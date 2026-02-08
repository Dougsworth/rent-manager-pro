from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Invoice, Payment, PaymentReminder
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer,
    PaymentSerializer, PaymentListSerializer,
    PaymentReminderSerializer,
    DashboardStatsSerializer,
    RecentPaymentSerializer,
    OverdueTenantSerializer
)
from tenants.models import Tenant
from authentication.utils import create_audit_log


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tenant']
    search_fields = ['invoice_number', 'tenant__name', 'description']
    ordering_fields = ['invoice_number', 'due_date', 'amount', 'created_at']
    ordering = ['-issue_date']
    
    def get_queryset(self):
        """Get invoices with optional date filtering."""
        queryset = Invoice.objects.select_related('tenant', 'created_by')
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(issue_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(issue_date__lte=end_date)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views."""
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def perform_create(self, serializer):
        """Create invoice and log action."""
        invoice = serializer.save()
        
        # Update invoice status if needed
        invoice.update_status()
        
        create_audit_log(
            user=self.request.user,
            action='create',
            content_type='Invoice',
            object_id=invoice.id,
            object_repr=str(invoice),
            changes=serializer.validated_data
        )
    
    def perform_update(self, serializer):
        """Update invoice and log action."""
        old_data = InvoiceSerializer(self.get_object()).data
        invoice = serializer.save()
        
        # Update invoice status
        invoice.update_status()
        
        # Calculate changes
        changes = {
            key: {'old': old_data.get(key), 'new': value}
            for key, value in serializer.validated_data.items()
            if old_data.get(key) != value
        }
        
        create_audit_log(
            user=self.request.user,
            action='update',
            content_type='Invoice',
            object_id=invoice.id,
            object_repr=str(invoice),
            changes=changes
        )
    
    @action(detail=False, methods=['POST'])
    def bulk_create(self, request):
        """Create monthly invoices for all active tenants."""
        active_tenants = Tenant.objects.filter(status='active')
        created_count = 0
        errors = []
        
        # Get month and year from request or use current
        month = request.data.get('month', timezone.now().month)
        year = request.data.get('year', timezone.now().year)
        
        for tenant in active_tenants:
            # Check if invoice already exists for this month
            existing_invoice = Invoice.objects.filter(
                tenant=tenant,
                issue_date__month=month,
                issue_date__year=year
            ).exists()
            
            if existing_invoice:
                errors.append(f"Invoice already exists for {tenant.name}")
                continue
            
            # Create invoice
            due_date = timezone.now().date().replace(day=1) + timedelta(days=30)
            
            invoice = Invoice.objects.create(
                tenant=tenant,
                amount=tenant.monthly_rent,
                due_date=due_date,
                description=f"Monthly rent for {tenant.unit}",
                created_by=request.user
            )
            
            created_count += 1
        
        return Response({
            'success': True,
            'created_count': created_count,
            'errors': errors,
            'message': f'Created {created_count} invoices successfully'
        })
    
    @action(detail=True, methods=['POST'])
    def send(self, request, pk=None):
        """Send invoice to tenant."""
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response({
                'success': False,
                'message': 'Invoice is already paid'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status to sent
        invoice.status = 'sent'
        invoice.save()
        
        # TODO: Implement actual email sending
        # from payments.utils import send_invoice_email
        # send_invoice_email(invoice)
        
        return Response({
            'success': True,
            'message': f'Invoice sent to {invoice.tenant.email}'
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payments.
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'tenant']
    search_fields = ['reference_number', 'tenant__name', 'transaction_id']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']
    
    def get_queryset(self):
        """Get payments with optional date filtering."""
        queryset = Payment.objects.select_related('tenant', 'invoice', 'processed_by')
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views."""
        if self.action == 'list':
            return PaymentListSerializer
        return PaymentSerializer
    
    def perform_create(self, serializer):
        """Create payment and log action."""
        payment = serializer.save()
        
        create_audit_log(
            user=self.request.user,
            action='payment',
            content_type='Payment',
            object_id=payment.id,
            object_repr=str(payment),
            changes=serializer.validated_data,
            description=f"Payment of {payment.amount} from {payment.tenant.name}"
        )
    
    @action(detail=False, methods=['GET'])
    def export(self, request):
        """Export payments to CSV."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Create CSV data
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Receipt Number', 'Tenant', 'Unit', 'Amount', 
            'Payment Date', 'Method', 'Status'
        ])
        
        for payment in queryset:
            writer.writerow([
                payment.reference_number,
                payment.tenant.name,
                payment.tenant.unit,
                payment.amount,
                payment.payment_date.strftime('%Y-%m-%d %H:%M'),
                payment.get_payment_method_display(),
                payment.get_status_display()
            ])
        
        create_audit_log(
            user=request.user,
            action='export',
            content_type='Payment',
            description=f"Exported {queryset.count()} payments to CSV"
        )
        
        return response


class PaymentReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment reminders.
    """
    
    serializer_class = PaymentReminderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tenant', 'invoice', 'reminder_type', 'is_sent']
    ordering_fields = ['sent_date', 'created_at']
    ordering = ['-sent_date']
    
    def get_queryset(self):
        """Get reminders with related data."""
        return PaymentReminder.objects.select_related(
            'tenant', 'invoice', 'sent_by'
        )


# Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics."""
    # Calculate expected rent from active tenants
    active_tenants = Tenant.objects.filter(status='active')
    expected = active_tenants.aggregate(
        total=Sum('monthly_rent')
    )['total'] or 0
    
    # Calculate collected payments for current month
    current_month = timezone.now().month
    current_year = timezone.now().year
    
    collected = Payment.objects.filter(
        payment_date__month=current_month,
        payment_date__year=current_year,
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Calculate outstanding
    outstanding = expected - collected
    
    # Count overdue invoices
    overdue = Invoice.objects.filter(
        status__in=['sent', 'partially_paid'],
        due_date__lt=timezone.now().date()
    ).count()
    
    # Count pending invoices (sent or partially paid but not overdue)
    pending = Invoice.objects.filter(
        status__in=['sent', 'partially_paid'],
        due_date__gte=timezone.now().date()
    ).count()
    
    data = {
        'expected': expected,
        'collected': collected,
        'outstanding': outstanding,
        'overdue': overdue,
        'pending': pending,
        'tenantCount': active_tenants.count()
    }
    
    serializer = DashboardStatsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_payments(request):
    """Get recent payments for dashboard."""
    # Get last 5 payments
    payments = Payment.objects.filter(
        status='completed'
    ).select_related('tenant').order_by('-payment_date')[:5]
    
    data = []
    for payment in payments:
        data.append({
            'id': payment.id,
            'tenant': payment.tenant.name,
            'unit': payment.tenant.unit,
            'amount': payment.amount,
            'date': payment.payment_date.strftime('%b %d, %Y, %I:%M %p'),
            'method': payment.get_payment_method_display()
        })
    
    serializer = RecentPaymentSerializer(data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overdue_tenants(request):
    """Get overdue tenants for dashboard."""
    # Get tenants with overdue invoices
    overdue_invoices = Invoice.objects.filter(
        status__in=['sent', 'partially_paid'],
        due_date__lt=timezone.now().date()
    ).select_related('tenant')
    
    # Group by tenant and calculate totals
    tenant_data = {}
    for invoice in overdue_invoices:
        tenant_id = invoice.tenant.id
        if tenant_id not in tenant_data:
            tenant_data[tenant_id] = {
                'id': tenant_id,
                'name': invoice.tenant.name,
                'unit': invoice.tenant.unit,
                'amount': 0,
                'daysOverdue': 0
            }
        
        tenant_data[tenant_id]['amount'] += invoice.balance_due
        tenant_data[tenant_id]['daysOverdue'] = max(
            tenant_data[tenant_id]['daysOverdue'],
            invoice.days_overdue
        )
    
    data = list(tenant_data.values())
    serializer = OverdueTenantSerializer(data, many=True)
    return Response(serializer.data)