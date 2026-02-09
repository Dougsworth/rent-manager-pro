from rest_framework import serializers
from .models import Document, DocumentCategory, DocumentTemplate, DocumentSignature
from tenants.serializers import TenantListSerializer


class DocumentCategorySerializer(serializers.ModelSerializer):
    """Serializer for document categories."""
    display_name = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'display_name', 'description']


class DocumentSignatureSerializer(serializers.ModelSerializer):
    """Serializer for document signatures."""
    signer_name = serializers.CharField(source='signer.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentSignature
        fields = [
            'id', 'signer', 'signer_name', 'signature_image',
            'signed_at', 'ip_address', 'is_verified'
        ]
        read_only_fields = ['signed_at', 'is_verified']


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_unit = serializers.CharField(source='tenant.unit', read_only=True)
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    file_url = serializers.SerializerMethodField()
    signatures = DocumentSignatureSerializer(many=True, read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'tenant', 'tenant_name', 'tenant_unit', 'category',
            'category_name', 'title', 'description', 'file', 'file_url',
            'file_size', 'file_type', 'document_date', 'expiry_date',
            'is_expired', 'days_until_expiry', 'created_at', 'updated_at',
            'uploaded_by', 'uploaded_by_name', 'is_active', 'is_signed',
            'signed_at', 'signatures'
        ]
        read_only_fields = [
            'file_size', 'file_type', 'created_at', 'updated_at',
            'uploaded_by', 'is_signed', 'signed_at'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document lists."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'tenant_name', 'category_name',
            'file_type', 'document_date', 'expiry_date',
            'is_expired', 'is_signed'
        ]


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading documents."""
    class Meta:
        model = Document
        fields = [
            'tenant', 'category', 'title', 'description',
            'file', 'document_date', 'expiry_date'
        ]
    
    def create(self, validated_data):
        # uploaded_by is now set in the view
        return super().create(validated_data)


class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for document templates."""
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'category', 'category_name',
            'description', 'content', 'variables',
            'is_active', 'created_at', 'updated_at'
        ]


class SignDocumentSerializer(serializers.Serializer):
    """Serializer for signing documents."""
    signature_image = serializers.CharField(help_text="Base64 encoded signature image")
    ip_address = serializers.IPAddressField(required=False)