from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.core.validators import MinLengthValidator
import uuid


class Organization(models.Model):
    """Represents a landlord/property management company account."""
    
    # Unique identifier
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    
    # Basic Information
    name = models.CharField(max_length=255, validators=[MinLengthValidator(3)])
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=2, default='JM')
    
    # Branding
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    
    # Settings
    timezone = models.CharField(max_length=50, default='America/Jamaica')
    currency = models.CharField(max_length=3, default='JMD')
    
    # Relations
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name='owned_organizations')
    members = models.ManyToManyField(User, through='OrganizationMembership', related_name='organizations')
    
    # Subscription (for future use)
    subscription_plan = models.CharField(max_length=20, default='free')
    subscription_active = models.BooleanField(default=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['email']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while Organization.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    """Represents a user's membership in an organization."""
    
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Administrator'),
        ('manager', 'Property Manager'),
        ('staff', 'Staff'),
        ('viewer', 'Viewer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    
    # Permissions
    can_manage_tenants = models.BooleanField(default=True)
    can_manage_finances = models.BooleanField(default=False)
    can_manage_properties = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    
    # Metadata
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'organization']
        ordering = ['organization', 'role']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.organization.name} ({self.get_role_display()})"


class Property(models.Model):
    """Represents a property owned/managed by an organization."""
    
    TYPE_CHOICES = [
        ('apartment', 'Apartment Building'),
        ('house', 'Single Family Home'),
        ('condo', 'Condominium'),
        ('townhouse', 'Townhouse'),
        ('commercial', 'Commercial'),
        ('mixed', 'Mixed Use'),
    ]
    
    # Relations
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='properties'
    )
    
    # Basic Information
    name = models.CharField(max_length=255)
    property_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Address
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2, default='JM')
    
    # Details
    units_count = models.IntegerField(default=1)
    year_built = models.IntegerField(null=True, blank=True)
    
    # Features
    amenities = models.JSONField(default=list, blank=True)
    parking_spaces = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['organization', 'name']
        unique_together = ['organization', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.organization.name}"


class Unit(models.Model):
    """Represents an individual unit within a property."""
    
    # Relations
    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='units'
    )
    
    # Identification
    unit_number = models.CharField(max_length=50)
    floor = models.IntegerField(null=True, blank=True)
    
    # Details
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, default=1)
    square_feet = models.IntegerField(null=True, blank=True)
    
    # Rent
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    is_available = models.BooleanField(default=True)
    
    # Features
    amenities = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['property', 'unit_number']
        unique_together = ['property', 'unit_number']
    
    def __str__(self):
        return f"{self.unit_number} - {self.property.name}"
    
