from django.db import models
from django.contrib.auth.models import User
from tenants.models import Tenant
from django.utils import timezone
import os


def document_upload_path(instance, filename):
    """Generate upload path for documents."""
    # Format: documents/tenant_id/year/filename
    tenant_id = instance.tenant.id if instance.tenant else 'general'
    year = timezone.now().year
    return f'documents/{tenant_id}/{year}/{filename}'


class DocumentCategory(models.Model):
    """Categories for organizing documents."""
    CATEGORY_CHOICES = [
        ('lease', 'Lease Agreement'),
        ('id', 'Identification'),
        ('payment', 'Payment Receipt'),
        ('notice', 'Notice'),
        ('maintenance', 'Maintenance'),
        ('insurance', 'Insurance'),
        ('other', 'Other'),
    ]
    
    # Organization - for multi-tenancy
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='document_categories',
        null=True  # Temporarily nullable for migration
    )
    
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Document Categories"
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'name'],
                name='unique_category_per_organization'
            )
        ]
        indexes = [
            models.Index(fields=['organization', 'name']),
        ]
    
    def __str__(self):
        return self.get_name_display()


class Document(models.Model):
    """Model for storing tenant documents."""
    
    # Organization - for multi-tenancy
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='documents',
        null=True  # Temporarily nullable for migration
    )
    
    # Relations
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='documents',
        null=True,
        blank=True
    )
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documents'
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    
    # Document Information
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=document_upload_path)
    file_size = models.IntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=50)
    
    # Important Dates
    document_date = models.DateField(
        default=timezone.now,
        help_text="Date of the document"
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True,
        help_text="When this document expires"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Digital Signature
    is_signed = models.BooleanField(default=False)
    signed_at = models.DateTimeField(null=True, blank=True)
    signature_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-document_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'category']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['organization', 'tenant']),
            models.Index(fields=['organization', 'category']),
            models.Index(fields=['organization', 'expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.tenant.name if self.tenant else 'General'}"
    
    def save(self, *args, **kwargs):
        # Set file size and type if file is being uploaded
        if self.file and not self.file_size:
            self.file_size = self.file.size
            self.file_type = os.path.splitext(self.file.name)[1][1:].upper()
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if document has expired."""
        if not self.expiry_date:
            return False
        return timezone.now().date() > self.expiry_date
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry."""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - timezone.now().date()
        return delta.days


class DocumentTemplate(models.Model):
    """Templates for common documents."""
    
    # Organization - for multi-tenancy
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='document_templates',
        null=True  # Temporarily nullable for migration
    )
    
    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.SET_NULL,
        null=True
    )
    description = models.TextField(blank=True)
    
    # Template content (HTML/Markdown)
    content = models.TextField(
        help_text="Template content with variables like {{tenant_name}}, {{unit}}, etc."
    )
    
    # Available variables for this template
    variables = models.JSONField(
        default=dict,
        help_text="List of variables available in this template"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'name'],
                name='unique_template_per_organization'
            )
        ]
        indexes = [
            models.Index(fields=['organization', 'name']),
        ]
    
    def __str__(self):
        return self.name


class DocumentSignature(models.Model):
    """Digital signatures for documents."""
    
    # Organization - for multi-tenancy
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='document_signatures',
        null=True  # Temporarily nullable for migration
    )
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='signatures'
    )
    signer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    
    # Signature data
    signature_image = models.TextField(
        help_text="Base64 encoded signature image"
    )
    signed_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Verification
    is_verified = models.BooleanField(default=True)
    verification_code = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-signed_at']
        unique_together = [['document', 'signer']]
        indexes = [
            models.Index(fields=['organization', 'document']),
            models.Index(fields=['organization', 'signed_at']),
        ]
    
    def __str__(self):
        return f"Signature for {self.document.title} by {self.signer.get_full_name()}"