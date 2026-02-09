from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Organization, OrganizationMembership, Property, Unit


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model."""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    tenant_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Organization
        fields = [
            'id', 'slug', 'name', 'email', 'phone', 'address', 
            'city', 'state', 'postal_code', 'country', 'logo',
            'primary_color', 'owner', 'owner_name', 'timezone',
            'currency', 'is_active', 'created_at', 'updated_at',
            'member_count', 'property_count', 'tenant_count'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add counts
        data['member_count'] = instance.members.count()
        data['property_count'] = instance.properties.count()
        data['tenant_count'] = instance.tenants.count()
        return data


class OrganizationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating organizations with initial user."""
    owner_email = serializers.EmailField(write_only=True)
    owner_password = serializers.CharField(write_only=True, min_length=8)
    owner_first_name = serializers.CharField(write_only=True)
    owner_last_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = Organization
        fields = [
            'name', 'email', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'timezone', 'currency',
            'owner_email', 'owner_password', 'owner_first_name', 'owner_last_name'
        ]
    
    def validate_owner_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        # Extract owner fields
        owner_data = {
            'email': validated_data.pop('owner_email'),
            'password': validated_data.pop('owner_password'),
            'first_name': validated_data.pop('owner_first_name'),
            'last_name': validated_data.pop('owner_last_name'),
        }
        
        # Create owner user
        owner = User.objects.create_user(
            username=owner_data['email'],
            email=owner_data['email'],
            password=owner_data['password'],
            first_name=owner_data['first_name'],
            last_name=owner_data['last_name']
        )
        
        # Create organization
        organization = Organization.objects.create(
            owner=owner,
            **validated_data
        )
        
        # Add owner as member
        OrganizationMembership.objects.create(
            user=owner,
            organization=organization,
            role='owner',
            can_manage_tenants=True,
            can_manage_finances=True,
            can_manage_properties=True,
            can_manage_users=True
        )
        
        return organization


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    """Serializer for organization membership."""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = OrganizationMembership
        fields = [
            'id', 'user', 'user_name', 'user_email', 'organization',
            'role', 'role_display', 'can_manage_tenants', 'can_manage_finances',
            'can_manage_properties', 'can_manage_users', 'joined_at'
        ]


class PropertySerializer(serializers.ModelSerializer):
    """Serializer for Property model."""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    units = serializers.IntegerField(source='units_count', read_only=True)
    
    class Meta:
        model = Property
        fields = [
            'id', 'organization', 'organization_name', 'name', 
            'property_type', 'description', 'address', 'city',
            'state', 'postal_code', 'country', 'units_count',
            'units', 'year_built', 'amenities', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UnitSerializer(serializers.ModelSerializer):
    """Serializer for Unit model."""
    property_name = serializers.CharField(source='property.name', read_only=True)
    organization = serializers.UUIDField(source='property.organization.id', read_only=True)
    
    class Meta:
        model = Unit
        fields = [
            'id', 'property', 'property_name', 'organization',
            'unit_number', 'floor', 'bedrooms', 'bathrooms',
            'square_feet', 'monthly_rent', 'deposit_amount',
            'is_available', 'amenities', 'notes', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']