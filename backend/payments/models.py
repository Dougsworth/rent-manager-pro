from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from tenants.models import Tenant
import uuid
from datetime import date


class Invoice(models.Model):
    """Model representing an invoice for rent payment."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Invoice Information
    invoice_number = models.CharField(
        max_length=50, 
        unique=True, 
        db_index=True,
        editable=False
    )
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='invoices'
    )
    
    # Financial Information
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    amount_paid = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Dates
    issue_date = models.DateField(default=date.today)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft',
        db_index=True
    )
    
    # Additional Information
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='invoices_created'
    )
    
    class Meta:
        ordering = ['-issue_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'invoice_number'],
                name='unique_invoice_number_per_tenant'
            )
        ]
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)
    
    def generate_invoice_number(self):
        """Generate unique invoice number per tenant."""
        # Get the last invoice number for this tenant
        last_invoice = Invoice.objects.filter(
            tenant=self.tenant
        ).order_by('-id').first()
        
        if last_invoice and last_invoice.invoice_number:
            # Extract the number from formats like "INV-0001" or "TENANT-INV-0001"
            try:
                # Try to find the last number in the invoice number
                parts = last_invoice.invoice_number.split('-')
                last_number = int(parts[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        # Format: TENANT_UNIT-INV-0001
        tenant_prefix = self.tenant.unit.replace(' ', '').upper()
        return f"{tenant_prefix}-INV-{new_number:04d}"
    
    def __str__(self):
        return f"{self.invoice_number} - {self.tenant.name}"
    
    @property
    def balance_due(self):
        """Calculate remaining balance."""
        return self.amount - self.amount_paid
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue."""
        if self.status in ['paid', 'cancelled']:
            return False
        return timezone.now().date() > self.due_date
    
    @property
    def days_overdue(self):
        """Calculate days overdue."""
        if not self.is_overdue:
            return 0
        delta = timezone.now().date() - self.due_date
        return delta.days
    
    def update_status(self):
        """Update invoice status based on payments."""
        if self.amount_paid >= self.amount:
            self.status = 'paid'
            self.paid_date = timezone.now().date()
        elif self.amount_paid > 0:
            self.status = 'partially_paid'
        elif self.is_overdue:
            self.status = 'overdue'
        self.save()


class Payment(models.Model):
    """Model representing a payment made by a tenant."""
    
    PAYMENT_METHODS = [
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('card', 'Credit/Debit Card'),
        ('mobile_money', 'Mobile Money'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    # Payment Information
    reference_number = models.CharField(
        max_length=100, 
        unique=True, 
        db_index=True,
        default=uuid.uuid4
    )
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    invoice = models.ForeignKey(
        Invoice, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='payments'
    )
    
    # Financial Information
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Payment Details
    payment_date = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(
        max_length=20, 
        choices=PAYMENT_METHODS
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='completed',
        db_index=True
    )
    
    # Transaction Details
    transaction_id = models.CharField(
        max_length=255, 
        blank=True,
        help_text="External transaction ID from payment processor"
    )
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='payments_processed'
    )
    
    class Meta:
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['payment_date', 'status']),
        ]
    
    def __str__(self):
        return f"Payment {self.reference_number} - {self.tenant.name}"
    
    def save(self, *args, **kwargs):
        # Generate receipt number if not exists
        if not self.reference_number or self.reference_number == str(uuid.uuid4()):
            self.reference_number = self.generate_receipt_number()
        
        # Update invoice if payment is completed
        if self.invoice and self.status == 'completed':
            self.invoice.amount_paid += self.amount
            self.invoice.update_status()
        
        super().save(*args, **kwargs)
    
    def generate_receipt_number(self):
        """Generate unique receipt number."""
        year = timezone.now().year
        month = timezone.now().month
        
        # Get the last payment for this month
        last_payment = Payment.objects.filter(
            reference_number__startswith=f"RCP-{year}-{month:02d}"
        ).order_by('-reference_number').first()
        
        if last_payment:
            last_number = int(last_payment.reference_number.split('-')[-1])
            new_number = last_number + 1
        else:
            new_number = 1
        
        return f"RCP-{year}-{month:02d}{new_number:04d}"


class PaymentReminder(models.Model):
    """Model for tracking payment reminders sent to tenants."""
    
    REMINDER_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('whatsapp', 'WhatsApp'),
        ('letter', 'Physical Letter'),
    ]
    
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='payment_reminders'
    )
    invoice = models.ForeignKey(
        Invoice, 
        on_delete=models.CASCADE, 
        related_name='reminders'
    )
    
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    sent_date = models.DateTimeField(default=timezone.now)
    
    # Email/SMS details
    recipient = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    
    # Status
    is_sent = models.BooleanField(default=True)
    is_read = models.BooleanField(default=False)
    read_date = models.DateTimeField(null=True, blank=True)
    
    # Response
    response_received = models.BooleanField(default=False)
    response_date = models.DateTimeField(null=True, blank=True)
    response_notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    sent_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True
    )
    
    class Meta:
        ordering = ['-sent_date']
        indexes = [
            models.Index(fields=['tenant', 'sent_date']),
            models.Index(fields=['invoice', 'sent_date']),
        ]
    
    def __str__(self):
        return f"Reminder to {self.tenant.name} on {self.sent_date}"