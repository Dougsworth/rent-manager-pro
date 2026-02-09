from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import Document, DocumentCategory, DocumentTemplate, DocumentSignature
from .serializers import (
    DocumentSerializer, DocumentListSerializer, DocumentUploadSerializer,
    DocumentCategorySerializer, DocumentTemplateSerializer,
    SignDocumentSerializer, DocumentSignatureSerializer
)
from authentication.utils import create_audit_log
from organizations.models import OrganizationMembership


class OrganizationFilterMixin:
    """Mixin to filter queryset by user's organization."""
    
    def get_user_organization(self):
        """Get the organization from the request or user's membership."""
        # First check if organization_id is in the request
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            # Verify user has access to this organization
            membership = OrganizationMembership.objects.filter(
                user=self.request.user,
                organization_id=org_id,
                is_active=True
            ).first()
            if membership:
                return membership.organization
        
        # Otherwise, get the user's first active organization
        membership = OrganizationMembership.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('organization').first()
        
        return membership.organization if membership else None


class DocumentCategoryViewSet(OrganizationFilterMixin, viewsets.ReadOnlyModelViewSet):
    """ViewSet for document categories."""
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get document categories for user's organization."""
        organization = self.get_user_organization()
        if not organization:
            return DocumentCategory.objects.none()
        return DocumentCategory.objects.filter(organization=organization)


class DocumentViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """ViewSet for managing documents."""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tenant', 'category', 'is_active', 'is_signed']
    search_fields = ['title', 'description', 'tenant__name']
    ordering_fields = ['document_date', 'expiry_date', 'created_at']
    ordering = ['-document_date']
    
    def get_queryset(self):
        """Get documents with optional filtering."""
        organization = self.get_user_organization()
        if not organization:
            return Document.objects.none()
            
        queryset = Document.objects.filter(
            organization=organization
        ).select_related(
            'tenant', 'category', 'uploaded_by'
        ).prefetch_related('signatures')
        
        # Filter by expiry status
        expiry_status = self.request.query_params.get('expiry_status')
        if expiry_status == 'expired':
            queryset = queryset.filter(
                expiry_date__lt=timezone.now().date()
            )
        elif expiry_status == 'expiring_soon':
            # Documents expiring in next 30 days
            end_date = timezone.now().date() + timezone.timedelta(days=30)
            queryset = queryset.filter(
                expiry_date__gte=timezone.now().date(),
                expiry_date__lte=end_date
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return DocumentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DocumentUploadSerializer
        elif self.action == 'sign':
            return SignDocumentSerializer
        return DocumentSerializer
    
    def perform_create(self, serializer):
        """Create document and log action."""
        organization = self.get_user_organization()
        if not organization:
            raise serializers.ValidationError("No organization found for user")
            
        document = serializer.save(
            uploaded_by=self.request.user,
            organization=organization
        )
        
        create_audit_log(
            user=self.request.user,
            action='upload',
            content_type='Document',
            object_id=document.id,
            object_repr=str(document),
            description=f"Uploaded document: {document.title}"
        )
    
    @action(detail=True, methods=['POST'])
    def sign(self, request, pk=None):
        """Sign a document digitally."""
        document = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Create signature
            organization = self.get_user_organization()
            if not organization:
                return Response(
                    {'error': 'No organization found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            signature = DocumentSignature.objects.create(
                organization=organization,
                document=document,
                signer=request.user,
                signature_image=serializer.validated_data['signature_image'],
                ip_address=serializer.validated_data.get('ip_address')
            )
            
            # Update document
            document.is_signed = True
            document.signed_at = signature.signed_at
            document.save()
            
            create_audit_log(
                user=request.user,
                action='sign',
                content_type='Document',
                object_id=document.id,
                object_repr=str(document),
                description=f"Digitally signed document: {document.title}"
            )
            
            return Response({
                'success': True,
                'message': 'Document signed successfully',
                'signature': DocumentSignatureSerializer(signature).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['GET'])
    def download(self, request, pk=None):
        """Download a document."""
        document = self.get_object()
        
        if document.file:
            response = HttpResponse(
                document.file.read(),
                content_type=f'application/{document.file_type.lower()}'
            )
            response['Content-Disposition'] = f'attachment; filename="{document.file.name}"'
            
            create_audit_log(
                user=request.user,
                action='download',
                content_type='Document',
                object_id=document.id,
                object_repr=str(document),
                description=f"Downloaded document: {document.title}"
            )
            
            return response
        
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['GET'])
    def expiring_soon(self):
        """Get documents expiring soon."""
        # Documents expiring in next 30 days
        end_date = timezone.now().date() + timezone.timedelta(days=30)
        documents = self.get_queryset().filter(
            expiry_date__gte=timezone.now().date(),
            expiry_date__lte=end_date
        )
        
        serializer = DocumentListSerializer(documents, many=True)
        return Response({
            'count': documents.count(),
            'documents': serializer.data
        })


class DocumentTemplateViewSet(OrganizationFilterMixin, viewsets.ModelViewSet):
    """ViewSet for document templates."""
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        """Get document templates for user's organization."""
        organization = self.get_user_organization()
        if not organization:
            return DocumentTemplate.objects.none()
        return DocumentTemplate.objects.filter(
            organization=organization,
            is_active=True
        )
    
    @action(detail=True, methods=['POST'])
    def generate(self, request, pk=None):
        """Generate a document from template."""
        template = self.get_object()
        
        # Get variables from request
        variables = request.data.get('variables', {})
        tenant_id = request.data.get('tenant_id')
        
        # Replace variables in template
        content = template.content
        for var, value in variables.items():
            content = content.replace(f'{{{{{var}}}}}', str(value))
        
        # Create document from template
        document_data = {
            'title': request.data.get('title', template.name),
            'description': template.description,
            'tenant_id': tenant_id,
            'category': template.category,
            'content': content  # This would need to be converted to PDF/file
        }
        
        return Response({
            'success': True,
            'content': content,
            'message': 'Document generated from template'
        })