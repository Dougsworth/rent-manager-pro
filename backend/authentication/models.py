from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField


class UserProfile(models.Model):
    """Extended user profile for additional information."""
    
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Property Manager'),
        ('staff', 'Staff'),
        ('accountant', 'Accountant'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    
    # Profile Information
    phone = PhoneNumberField(region='JM', blank=True)
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='staff'
    )
    
    # Preferences
    notification_email = models.BooleanField(default=True)
    notification_sms = models.BooleanField(default=False)
    
    # Security
    two_factor_enabled = models.BooleanField(default=False)
    last_password_change = models.DateTimeField(null=True, blank=True)
    
    # Activity
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['user__username']
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.get_role_display()}"
    
    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username
    
    def update_last_activity(self):
        """Update the last activity timestamp."""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])


class AuditLog(models.Model):
    """Model for tracking user actions in the system."""
    
    ACTION_TYPES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('login', 'Logged In'),
        ('logout', 'Logged Out'),
        ('export', 'Exported Data'),
        ('email', 'Sent Email'),
        ('payment', 'Processed Payment'),
    ]
    
    # User Information
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='audit_logs'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Action Information
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Target Information
    content_type = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    
    # Details
    changes = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.get_action_display()} - {self.timestamp}"


class PasswordResetToken(models.Model):
    """Custom password reset token with expiration."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'used']),
        ]
    
    def __str__(self):
        return f"Reset token for {self.user.username}"
    
    @property
    def is_expired(self):
        """Check if token is expired."""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if token is valid for use."""
        return not self.used and not self.is_expired