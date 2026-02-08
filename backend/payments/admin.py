from django.contrib import admin
from .models import Invoice, Payment, PaymentReminder


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin configuration for Invoice model."""
    
    list_display = [
        'invoice_number', 'tenant', 'amount', 'amount_paid',
        'balance_due', 'due_date', 'status', 'is_overdue'
    ]
    list_filter = ['status', 'due_date', 'issue_date']
    search_fields = ['invoice_number', 'tenant__name', 'tenant__unit']
    ordering = ['-issue_date']
    date_hierarchy = 'issue_date'
    
    fieldsets = (
        ('Invoice Information', {
            'fields': ('tenant', 'amount', 'due_date', 'status')
        }),
        ('Payment Information', {
            'fields': ('amount_paid', 'paid_date'),
            'description': 'Payment tracking information'
        }),
        ('Details', {
            'fields': ('description', 'notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('invoice_number', 'issue_date', 'created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'invoice_number', 'amount_paid', 'balance_due', 
        'is_overdue', 'created_at', 'updated_at', 'created_by'
    ]
    autocomplete_fields = ['tenant']
    
    def balance_due(self, obj):
        """Display balance due."""
        return f"J${obj.balance_due:,.2f}"
    balance_due.short_description = 'Balance Due'
    
    def save_model(self, request, obj, form, change):
        """Set created_by on save."""
        if not change:  # Only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('tenant', 'created_by')
    
    actions = ['mark_as_paid', 'mark_as_overdue', 'send_invoice']
    
    @admin.action(description='Mark selected invoices as paid')
    def mark_as_paid(self, request, queryset):
        """Mark invoices as paid."""
        updated = queryset.update(status='paid')
        self.message_user(request, f'{updated} invoices marked as paid.')
    
    @admin.action(description='Mark selected invoices as overdue')
    def mark_as_overdue(self, request, queryset):
        """Mark invoices as overdue."""
        updated = queryset.update(status='overdue')
        self.message_user(request, f'{updated} invoices marked as overdue.')
    
    @admin.action(description='Send selected invoices to tenants')
    def send_invoice(self, request, queryset):
        """Send invoices to tenants."""
        # TODO: Implement actual sending
        self.message_user(request, f'Invoices will be sent to tenants.')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment model."""
    
    list_display = [
        'reference_number', 'tenant', 'amount', 'payment_date',
        'payment_method', 'status', 'invoice'
    ]
    list_filter = ['status', 'payment_method', 'payment_date']
    search_fields = ['reference_number', 'tenant__name', 'transaction_id']
    ordering = ['-payment_date']
    date_hierarchy = 'payment_date'
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('tenant', 'invoice', 'amount', 'payment_method', 'status')
        }),
        ('Transaction Details', {
            'fields': ('transaction_id', 'notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('reference_number', 'payment_date', 'created_at', 'updated_at', 'processed_by'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'reference_number', 'created_at', 'updated_at', 'processed_by'
    ]
    autocomplete_fields = ['tenant', 'invoice']
    
    def save_model(self, request, obj, form, change):
        """Set processed_by on save."""
        if not change:  # Only on creation
            obj.processed_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related(
            'tenant', 'invoice', 'processed_by'
        )
    
    actions = ['export_to_csv']
    
    @admin.action(description='Export selected payments to CSV')
    def export_to_csv(self, request, queryset):
        """Export payments to CSV."""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Receipt Number', 'Tenant', 'Amount', 'Payment Date',
            'Method', 'Status', 'Invoice'
        ])
        
        for payment in queryset:
            writer.writerow([
                payment.reference_number,
                payment.tenant.name,
                payment.amount,
                payment.payment_date,
                payment.get_payment_method_display(),
                payment.get_status_display(),
                payment.invoice.invoice_number if payment.invoice else '-'
            ])
        
        return response


@admin.register(PaymentReminder)
class PaymentReminderAdmin(admin.ModelAdmin):
    """Admin configuration for PaymentReminder model."""
    
    list_display = [
        'tenant', 'invoice', 'reminder_type', 'sent_date',
        'is_sent', 'is_read', 'response_received'
    ]
    list_filter = [
        'reminder_type', 'is_sent', 'is_read', 
        'response_received', 'sent_date'
    ]
    search_fields = ['tenant__name', 'invoice__invoice_number', 'recipient']
    ordering = ['-sent_date']
    date_hierarchy = 'sent_date'
    
    fieldsets = (
        ('Reminder Information', {
            'fields': ('tenant', 'invoice', 'reminder_type')
        }),
        ('Message Details', {
            'fields': ('recipient', 'subject', 'message')
        }),
        ('Status', {
            'fields': ('is_sent', 'is_read', 'read_date')
        }),
        ('Response', {
            'fields': ('response_received', 'response_date', 'response_notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('sent_date', 'created_at', 'sent_by'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'created_at', 'sent_by', 'sent_date'
    ]
    autocomplete_fields = ['tenant', 'invoice']
    
    def save_model(self, request, obj, form, change):
        """Set sent_by on save."""
        if not change:  # Only on creation
            obj.sent_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related(
            'tenant', 'invoice', 'sent_by'
        )