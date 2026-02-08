from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from .models import Document, DocumentCategory, DocumentTemplate, DocumentSignature
from .serializers import (
    DocumentSerializer, DocumentListSerializer, DocumentUploadSerializer,
    DocumentCategorySerializer, DocumentTemplateSerializer,
    SignDocumentSerializer, DocumentSignatureSerializer
)
from authentication.utils import create_audit_log


class DocumentCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for document categories."""
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated]


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing documents."""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tenant', 'category', 'is_active', 'is_signed']
    search_fields = ['title', 'description', 'tenant__name']
    ordering_fields = ['document_date', 'expiry_date', 'created_at']
    ordering = ['-document_date']
    
    def get_queryset(self):
        """Get documents with optional filtering."""
        queryset = Document.objects.select_related(
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
        document = serializer.save()
        
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
            signature = DocumentSignature.objects.create(
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


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for document templates."""
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    
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