from django.contrib import admin
from .models import Tenant, TenantDocument


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Admin configuration for Tenant model."""
    
    list_display = [
        'name', 'email', 'unit', 'monthly_rent', 
        'status', 'lease_start', 'lease_end', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'lease_start', 'lease_end']
    search_fields = ['name', 'email', 'unit', 'phone']
    ordering = ['name']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Rental Information', {
            'fields': ('unit', 'monthly_rent', 'security_deposit')
        }),
        ('Lease Information', {
            'fields': ('lease_start', 'lease_end', 'status')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',),
            'description': 'System information'
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    def save_model(self, request, obj, form, change):
        """Set created_by on save."""
        if not change:  # Only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('created_by')


@admin.register(TenantDocument)
class TenantDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for TenantDocument model."""
    
    list_display = [
        'name', 'tenant', 'document_type', 
        'uploaded_at', 'uploaded_by'
    ]
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['name', 'tenant__name']
    ordering = ['-uploaded_at']
    date_hierarchy = 'uploaded_at'
    
    fieldsets = (
        ('Document Information', {
            'fields': ('tenant', 'document_type', 'name', 'file')
        }),
        ('Metadata', {
            'fields': ('uploaded_at', 'uploaded_by'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['uploaded_at', 'uploaded_by']
    autocomplete_fields = ['tenant']
    
    def save_model(self, request, obj, form, change):
        """Set uploaded_by on save."""
        if not change:  # Only on creation
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('tenant', 'uploaded_by')