from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Tenant, TenantDocument


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model."""
    
    payment_status = serializers.SerializerMethodField()
    is_lease_active = serializers.BooleanField(read_only=True)
    days_until_lease_end = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', 
        read_only=True
    )
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'email', 'phone', 'unit', 'monthly_rent',
            'security_deposit', 'lease_start', 'lease_end', 'status',
            'emergency_contact_name', 'emergency_contact_phone', 'notes',
            'payment_status', 'is_lease_active', 'days_until_lease_end',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_payment_status(self, obj):
        """Get the payment status for frontend display."""
        status = obj.get_payment_status()
        status_map = {
            'paid': 'paid',
            'pending': 'pending',
            'overdue': 'overdue',
            'no_invoice': 'pending'
        }
        return status_map.get(status, 'pending')
    
    def validate_lease_dates(self, data):
        """Validate lease start and end dates."""
        lease_start = data.get('lease_start')
        lease_end = data.get('lease_end')
        
        if lease_start and lease_end and lease_start >= lease_end:
            raise serializers.ValidationError(
                "Lease end date must be after lease start date."
            )
        
        return data
    
    def validate_email(self, value):
        """Ensure email is unique."""
        tenant_id = self.instance.id if self.instance else None
        
        if Tenant.objects.exclude(id=tenant_id).filter(email=value).exists():
            raise serializers.ValidationError(
                "A tenant with this email already exists."
            )
        
        return value
    
    def create(self, validated_data):
        """Create tenant with current user as creator."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TenantListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for tenant lists."""
    
    payment_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'email', 'phone', 'unit', 'monthly_rent', 
            'status', 'payment_status', 'lease_start', 'lease_end'
        ]
    
    def get_payment_status(self, obj):
        """Get the payment status for frontend display."""
        status = obj.get_payment_status()
        status_map = {
            'paid': 'paid',
            'pending': 'pending',
            'overdue': 'overdue',
            'no_invoice': 'pending'
        }
        return status_map.get(status, 'pending')


class TenantDocumentSerializer(serializers.ModelSerializer):
    """Serializer for TenantDocument model."""
    
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.get_full_name', 
        read_only=True
    )
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantDocument
        fields = [
            'id', 'tenant', 'document_type', 'name', 'file', 
            'file_url', 'uploaded_at', 'uploaded_by', 'uploaded_by_name'
        ]
        read_only_fields = ['uploaded_at', 'uploaded_by']
    
    def get_file_url(self, obj):
        """Get full URL for file."""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None
    
    def create(self, validated_data):
        """Set uploaded_by to current user."""
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)