from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, RegexValidator
from phonenumber_field.modelfields import PhoneNumberField
from django.utils import timezone


class Tenant(models.Model):
    """Model representing a tenant in the rental system."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=255, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    phone = PhoneNumberField(region='JM', blank=True)
    
    # Rental Information
    unit = models.CharField(max_length=50, db_index=True)
    monthly_rent = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    security_deposit = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    
    # Lease Information
    lease_start = models.DateField()
    lease_end = models.DateField()
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        db_index=True
    )
    
    # Additional Information
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = PhoneNumberField(region='JM', blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='tenants_created'
    )
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['status', 'lease_end']),
            models.Index(fields=['unit', 'status']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.unit}"
    
    @property
    def is_lease_active(self):
        """Check if the lease is currently active."""
        today = timezone.now().date()
        return self.lease_start <= today <= self.lease_end
    
    @property
    def days_until_lease_end(self):
        """Calculate days until lease ends."""
        today = timezone.now().date()
        delta = self.lease_end - today
        return delta.days
    
    def get_payment_status(self):
        """Get the current payment status for this tenant."""
        from payments.models import Payment, Invoice
        
        # Get the latest invoice
        latest_invoice = Invoice.objects.filter(
            tenant=self,
            due_date__lte=timezone.now().date()
        ).order_by('-due_date').first()
        
        if not latest_invoice:
            return 'no_invoice'
        
        # Check if paid
        payment = Payment.objects.filter(
            invoice=latest_invoice,
            status='completed'
        ).exists()
        
        if payment:
            return 'paid'
        elif latest_invoice.is_overdue:
            return 'overdue'
        else:
            return 'pending'


class TenantDocument(models.Model):
    """Model for storing tenant-related documents."""
    
    DOCUMENT_TYPES = [
        ('lease', 'Lease Agreement'),
        ('id', 'Identification'),
        ('proof_of_income', 'Proof of Income'),
        ('reference', 'Reference Letter'),
        ('other', 'Other'),
    ]
    
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='tenant_documents/%Y/%m/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True
    )
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.name} - {self.tenant.name}"