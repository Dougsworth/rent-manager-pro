from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile, AuditLog


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    phone = serializers.CharField(
        source='profile.phone', 
        required=False, 
        allow_blank=True
    )
    role = serializers.CharField(
        source='profile.role', 
        required=False
    )
    full_name = serializers.CharField(
        source='profile.full_name', 
        read_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'is_active', 'date_joined'
        ]
        read_only_fields = ['date_joined']
    
    def update(self, instance, validated_data):
        """Update user and profile data."""
        profile_data = validated_data.pop('profile', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    user_data = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'user_data', 'phone', 'role',
            'notification_email', 'notification_sms',
            'two_factor_enabled', 'last_password_change',
            'last_activity', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'last_password_change', 'last_activity',
            'created_at', 'updated_at'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, default='staff')
    
    class Meta:
        model = User
        fields = [
            'username', 'password', 'password2', 'email',
            'first_name', 'last_name', 'phone', 'role'
        ]
    
    def validate(self, attrs):
        """Validate registration data."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({
                "email": "A user with this email already exists."
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create user and profile."""
        validated_data.pop('password2')
        phone = validated_data.pop('phone', '')
        role = validated_data.pop('role', 'staff')
        
        user = User.objects.create_user(**validated_data)
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            phone=phone,
            role=role
        )
        
        return user


class LoginSerializer(TokenObtainPairSerializer):
    """Custom login serializer with additional user data."""
    
    @classmethod
    def get_token(cls, user):
        """Add custom claims to token."""
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        if hasattr(user, 'profile'):
            token['role'] = user.profile.role
        
        return token
    
    def validate(self, attrs):
        """Validate and return token with user data."""
        data = super().validate(attrs)
        
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        write_only=True,
        validators=[validate_password]
    )
    
    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def save(self):
        """Change user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        
        # Update profile
        if hasattr(user, 'profile'):
            user.profile.last_password_change = timezone.now()
            user.profile.save()
        
        return user


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    
    user_name = serializers.CharField(
        source='user.get_full_name', 
        read_only=True
    )
    action_display = serializers.CharField(
        source='get_action_display', 
        read_only=True
    )
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'ip_address', 'user_agent',
            'action', 'action_display', 'timestamp', 'content_type',
            'object_id', 'object_repr', 'changes', 'description'
        ]
        read_only_fields = ['timestamp']