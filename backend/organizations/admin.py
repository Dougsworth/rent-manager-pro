from django.contrib import admin
from .models import Organization, OrganizationMembership, Property, Unit


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'owner', 'is_active', 'created_at']
    list_filter = ['is_active', 'country', 'created_at']
    search_fields = ['name', 'email', 'owner__username']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'slug', 'email', 'phone')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country')
        }),
        ('Branding', {
            'fields': ('logo', 'primary_color')
        }),
        ('Settings', {
            'fields': ('owner', 'timezone', 'currency', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'organization', 'role', 
        'can_manage_tenants', 'can_manage_finances',
        'can_manage_properties', 'can_manage_users'
    ]
    list_filter = ['role', 'organization']
    search_fields = ['user__username', 'user__email', 'organization__name']
    
    fieldsets = (
        ('Membership', {
            'fields': ('user', 'organization', 'role', 'invited_by')
        }),
        ('Permissions', {
            'fields': (
                'can_manage_tenants', 'can_manage_finances',
                'can_manage_properties', 'can_manage_users'
            )
        }),
        ('Metadata', {
            'fields': ('joined_at',)
        }),
    )
    readonly_fields = ['joined_at']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'organization', 'property_type',
        'city', 'units_count', 'is_active'
    ]
    list_filter = ['property_type', 'is_active', 'organization']
    search_fields = ['name', 'address', 'city', 'organization__name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'name', 'property_type', 'description')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country')
        }),
        ('Details', {
            'fields': ('units_count', 'year_built', 'amenities')
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = [
        'unit_number', 'property', 'bedrooms', 'bathrooms',
        'monthly_rent', 'is_available'
    ]
    list_filter = ['is_available', 'bedrooms', 'property__organization']
    search_fields = ['unit_number', 'property__name', 'property__organization__name']
    
    fieldsets = (
        ('Unit Information', {
            'fields': ('property', 'unit_number', 'floor')
        }),
        ('Details', {
            'fields': ('bedrooms', 'bathrooms', 'square_feet')
        }),
        ('Pricing', {
            'fields': ('monthly_rent', 'deposit_amount')
        }),
        ('Features', {
            'fields': ('is_available', 'amenities', 'notes')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    readonly_fields = ['created_at', 'updated_at']