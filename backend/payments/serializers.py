from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Invoice, Payment, PaymentReminder
from tenants.serializers import TenantListSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_unit = serializers.CharField(source='tenant.unit', read_only=True)
    balance_due = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', 
        read_only=True
    )
    issue_date = serializers.DateField()
    due_date = serializers.DateField()
    paid_date = serializers.DateField(allow_null=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'tenant', 'tenant_name', 'tenant_unit',
            'amount', 'amount_paid', 'balance_due', 'issue_date', 'due_date',
            'paid_date', 'status', 'is_overdue', 'days_overdue',
            'description', 'notes', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = [
            'invoice_number', 'amount_paid', 'paid_date',
            'created_at', 'updated_at', 'created_by'
        ]
    
    def validate(self, data):
        """Validate invoice data."""
        if data.get('due_date') and data.get('issue_date'):
            if data['due_date'] <= data['issue_date']:
                raise serializers.ValidationError(
                    "Due date must be after issue date."
                )
        
        return data
    
    def create(self, validated_data):
        """Create invoice with current user as creator."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice lists."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_unit = serializers.CharField(source='tenant.unit', read_only=True)
    issue_date = serializers.DateField(read_only=True)
    due_date = serializers.DateField(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'tenant_name', 'tenant_unit',
            'amount', 'due_date', 'status', 'issue_date'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_unit = serializers.CharField(source='tenant.unit', read_only=True)
    invoice_number = serializers.CharField(
        source='invoice.invoice_number', 
        read_only=True
    )
    processed_by_name = serializers.CharField(
        source='processed_by.get_full_name', 
        read_only=True
    )
    receipt = serializers.CharField(
        source='reference_number', 
        read_only=True
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reference_number', 'receipt', 'tenant', 'tenant_name',
            'tenant_unit', 'invoice', 'invoice_number', 'amount',
            'payment_date', 'payment_method', 'status', 'transaction_id',
            'notes', 'created_at', 'updated_at', 'processed_by',
            'processed_by_name'
        ]
        read_only_fields = [
            'reference_number', 'created_at', 'updated_at', 'processed_by'
        ]
    
    def validate_amount(self, value):
        """Ensure payment amount is positive."""
        if value <= 0:
            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )
        return value
    
    def create(self, validated_data):
        """Create payment with current user as processor."""
        validated_data['processed_by'] = self.context['request'].user
        return super().create(validated_data)


class PaymentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for payment lists."""
    
    tenant = serializers.CharField(source='tenant.name', read_only=True)
    unit = serializers.CharField(source='tenant.unit', read_only=True)
    date = serializers.DateTimeField(source='payment_date', read_only=True)
    method = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'tenant', 'unit', 'amount', 'date', 
            'method', 'status'
        ]


class PaymentReminderSerializer(serializers.ModelSerializer):
    """Serializer for PaymentReminder model."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    invoice_number = serializers.CharField(
        source='invoice.invoice_number', 
        read_only=True
    )
    sent_by_name = serializers.CharField(
        source='sent_by.get_full_name', 
        read_only=True
    )
    
    class Meta:
        model = PaymentReminder
        fields = [
            'id', 'tenant', 'tenant_name', 'invoice', 'invoice_number',
            'reminder_type', 'sent_date', 'recipient', 'subject', 'message',
            'is_sent', 'is_read', 'read_date', 'response_received',
            'response_date', 'response_notes', 'created_at', 'sent_by',
            'sent_by_name'
        ]
        read_only_fields = [
            'created_at', 'sent_by', 'is_sent'
        ]
    
    def create(self, validated_data):
        """Create reminder with current user as sender."""
        validated_data['sent_by'] = self.context['request'].user
        
        # Set recipient based on reminder type
        tenant = validated_data.get('tenant')
        if validated_data.get('reminder_type') == 'email':
            validated_data['recipient'] = tenant.email
        elif validated_data.get('reminder_type') in ['sms', 'whatsapp']:
            validated_data['recipient'] = str(tenant.phone)
        
        return super().create(validated_data)


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    
    expected = serializers.DecimalField(max_digits=10, decimal_places=2)
    collected = serializers.DecimalField(max_digits=10, decimal_places=2)
    outstanding = serializers.DecimalField(max_digits=10, decimal_places=2)
    overdue = serializers.IntegerField()
    pending = serializers.IntegerField()
    tenantCount = serializers.IntegerField()


class RecentPaymentSerializer(serializers.Serializer):
    """Serializer for recent payments on dashboard."""
    
    id = serializers.IntegerField()
    tenant = serializers.CharField()
    unit = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    date = serializers.CharField()
    method = serializers.CharField()


class OverdueTenantSerializer(serializers.Serializer):
    """Serializer for overdue tenants on dashboard."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    unit = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    daysOverdue = serializers.IntegerField()
    lastReminderDate = serializers.CharField(allow_null=True, required=False)
    reminderCount = serializers.IntegerField(required=False, default=0)