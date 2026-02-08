from django.contrib import admin
from .models import Document, DocumentCategory, DocumentTemplate, DocumentSignature


@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name', 'description']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'tenant', 'category', 'file_type',
        'document_date', 'expiry_date', 'is_signed', 'is_active'
    ]
    list_filter = [
        'category', 'is_signed', 'is_active',
        'file_type', 'document_date', 'expiry_date'
    ]
    search_fields = ['title', 'description', 'tenant__name']
    date_hierarchy = 'document_date'
    readonly_fields = [
        'file_size', 'file_type', 'created_at',
        'updated_at', 'uploaded_by'
    ]
    
    def save_model(self, request, obj, form, change):
        if not change:  # New document
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']


@admin.register(DocumentSignature)
class DocumentSignatureAdmin(admin.ModelAdmin):
    list_display = ['document', 'signer', 'signed_at', 'is_verified']
    list_filter = ['is_verified', 'signed_at']
    search_fields = ['document__title', 'signer__username']
    readonly_fields = ['signature_image', 'ip_address']