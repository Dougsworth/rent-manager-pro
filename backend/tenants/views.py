from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Tenant, TenantDocument
from .serializers import (
    TenantSerializer, TenantListSerializer, TenantDocumentSerializer
)
from authentication.utils import create_audit_log


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tenants.
    
    Provides CRUD operations for tenants with filtering and search capabilities.
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'unit']
    search_fields = ['name', 'email', 'unit', 'phone']
    ordering_fields = ['name', 'unit', 'created_at', 'monthly_rent']
    ordering = ['name']
    
    def get_queryset(self):
        """Get queryset with optional status filtering."""
        queryset = Tenant.objects.select_related('created_by')
        
        # Filter by payment status if requested
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            tenant_ids = []
            for tenant in queryset:
                if tenant.get_payment_status() == payment_status:
                    tenant_ids.append(tenant.id)
            queryset = queryset.filter(id__in=tenant_ids)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views."""
        if self.action == 'list':
            return TenantListSerializer
        return TenantSerializer
    
    def perform_create(self, serializer):
        """Create tenant and log action."""
        tenant = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='create',
            content_type='Tenant',
            object_id=tenant.id,
            object_repr=str(tenant),
            changes=serializer.validated_data
        )
    
    def perform_update(self, serializer):
        """Update tenant and log action."""
        old_data = TenantSerializer(self.get_object()).data
        tenant = serializer.save()
        
        # Calculate changes
        changes = {
            key: {'old': old_data.get(key), 'new': value}
            for key, value in serializer.validated_data.items()
            if old_data.get(key) != value
        }
        
        create_audit_log(
            user=self.request.user,
            action='update',
            content_type='Tenant',
            object_id=tenant.id,
            object_repr=str(tenant),
            changes=changes
        )
    
    def perform_destroy(self, instance):
        """Delete tenant and log action."""
        tenant_str = str(instance)
        tenant_id = instance.id
        
        create_audit_log(
            user=self.request.user,
            action='delete',
            content_type='Tenant',
            object_id=tenant_id,
            object_repr=tenant_str
        )
        
        instance.delete()
    
    @action(detail=False, methods=['GET'])
    def summary(self, request):
        """Get summary statistics for tenants."""
        tenants = self.get_queryset()
        
        total = tenants.count()
        active = tenants.filter(status='active').count()
        
        # Calculate payment statuses
        paid = 0
        pending = 0
        overdue = 0
        
        for tenant in tenants.filter(status='active'):
            status = tenant.get_payment_status()
            if status == 'paid':
                paid += 1
            elif status == 'overdue':
                overdue += 1
            else:
                pending += 1
        
        return Response({
            'total': total,
            'active': active,
            'inactive': tenants.filter(status='inactive').count(),
            'paid': paid,
            'pending': pending,
            'overdue': overdue
        })
    
    @action(detail=True, methods=['POST'])
    def send_reminder(self, request, pk=None):
        """Send payment reminder to tenant."""
        tenant = self.get_object()

        try:
            from payments.email_service import send_payment_reminder
            from payments.models import Invoice, PaymentReminder
            from django.utils import timezone

            # Find the most overdue invoice for this tenant
            overdue_invoice = Invoice.objects.filter(
                tenant=tenant,
                status__in=['sent', 'partially_paid'],
                due_date__lt=timezone.now().date()
            ).order_by('due_date').first()

            days_overdue = None
            rent_amount = float(tenant.monthly_rent)
            if overdue_invoice:
                days_overdue = (timezone.now().date() - overdue_invoice.due_date).days
                rent_amount = float(overdue_invoice.balance_due)

            success, message = send_payment_reminder(
                tenant_name=tenant.name,
                tenant_email=tenant.email,
                unit=tenant.unit,
                rent_amount=rent_amount,
                days_overdue=days_overdue,
                property_name="The Pods"
            )

            if success:
                # Create PaymentReminder record
                if overdue_invoice:
                    PaymentReminder.objects.create(
                        tenant=tenant,
                        invoice=overdue_invoice,
                        reminder_type='email',
                        recipient=tenant.email,
                        subject=f"Payment Reminder - {tenant.unit}",
                        message=message,
                        is_sent=True,
                        sent_by=request.user,
                        sent_date=timezone.now()
                    )

                create_audit_log(
                    user=request.user,
                    action='reminder',
                    content_type='Tenant',
                    object_id=tenant.id,
                    object_repr=str(tenant),
                    description=f"Payment reminder sent to {tenant.email}"
                )

                return Response({
                    'success': True,
                    'message': message
                })
            else:
                return Response({
                    'success': False,
                    'message': message
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to send reminder: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'])
    def bulk_send_reminders(self, request):
        """Send reminders to all tenants with overdue invoices."""
        from payments.email_service import send_payment_reminder
        from payments.models import Invoice, PaymentReminder
        from django.utils import timezone

        overdue_invoices = Invoice.objects.filter(
            status__in=['sent', 'partially_paid'],
            due_date__lt=timezone.now().date()
        ).select_related('tenant').order_by('tenant', 'due_date')

        # Group by tenant - send one reminder per tenant for their most overdue invoice
        tenant_invoices = {}
        for invoice in overdue_invoices:
            if invoice.tenant.id not in tenant_invoices:
                tenant_invoices[invoice.tenant.id] = invoice

        sent_count = 0
        errors = []

        for tenant_id, invoice in tenant_invoices.items():
            tenant = invoice.tenant
            days_overdue = (timezone.now().date() - invoice.due_date).days

            try:
                success, message = send_payment_reminder(
                    tenant_name=tenant.name,
                    tenant_email=tenant.email,
                    unit=tenant.unit,
                    rent_amount=float(invoice.balance_due),
                    days_overdue=days_overdue,
                    property_name="The Pods"
                )

                if success:
                    PaymentReminder.objects.create(
                        tenant=tenant,
                        invoice=invoice,
                        reminder_type='email',
                        recipient=tenant.email,
                        subject=f"Payment Reminder - {tenant.unit}",
                        message=message,
                        is_sent=True,
                        sent_by=request.user,
                        sent_date=timezone.now()
                    )
                    sent_count += 1
                else:
                    errors.append(f"Failed for {tenant.name}: {message}")
            except Exception as e:
                errors.append(f"Failed for {tenant.name}: {str(e)}")

        return Response({
            'success': True,
            'sent_count': sent_count,
            'total': len(tenant_invoices),
            'errors': errors,
            'message': f'Sent {sent_count} of {len(tenant_invoices)} reminders'
        })


class TenantDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tenant documents.
    """
    
    serializer_class = TenantDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tenant', 'document_type']
    ordering_fields = ['uploaded_at', 'name']
    ordering = ['-uploaded_at']
    
    def get_queryset(self):
        """Get documents, optionally filtered by tenant."""
        queryset = TenantDocument.objects.select_related('tenant', 'uploaded_by')
        
        # Filter by tenant if specified in URL
        tenant_id = self.kwargs.get('tenant_id')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create document and log action."""
        document = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='create',
            content_type='TenantDocument',
            object_id=document.id,
            object_repr=str(document),
            description=f"Uploaded document '{document.name}' for {document.tenant.name}"
        )