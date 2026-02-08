from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, AuditLog, PasswordResetToken


class UserProfileInline(admin.StackedInline):
    """Inline admin for UserProfile."""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'


class CustomUserAdmin(UserAdmin):
    """Custom user admin with profile inline."""
    inlines = (UserProfileInline,)
    
    def get_inline_instances(self, request, obj=None):
        """Only show profile inline for existing users."""
        if not obj:
            return list()
        return super(CustomUserAdmin, self).get_inline_instances(request, obj)


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin configuration for AuditLog model."""
    
    list_display = [
        'user', 'action', 'content_type', 'object_repr',
        'timestamp', 'ip_address'
    ]
    list_filter = ['action', 'timestamp', 'content_type']
    search_fields = ['user__username', 'object_repr', 'description']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'
    readonly_fields = [
        'user', 'action', 'timestamp', 'ip_address',
        'user_agent', 'content_type', 'object_id', 
        'object_repr', 'changes', 'description'
    ]
    
    def has_add_permission(self, request):
        """Disable adding audit logs through admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable changing audit logs."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete audit logs."""
        return request.user.is_superuser


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Admin configuration for PasswordResetToken model."""
    
    list_display = [
        'user', 'created_at', 'expires_at', 'used', 'used_at'
    ]
    list_filter = ['used', 'created_at', 'expires_at']
    search_fields = ['user__username', 'user__email']
    ordering = ['-created_at']
    readonly_fields = [
        'token', 'created_at', 'expires_at', 'used', 'used_at'
    ]
    
    def has_add_permission(self, request):
        """Disable adding reset tokens through admin."""
        return False