from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer,
    LoginSerializer, ChangePasswordSerializer
)
from .models import UserProfile, PasswordResetToken
from .utils import create_audit_log, generate_password_reset_token, get_client_ip


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Create audit log
        create_audit_log(
            user=user,
            action='create',
            content_type='User',
            object_id=user.id,
            object_repr=user.username,
            description='User registered',
            request=request
        )
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    Custom login view with additional user data and audit logging.
    """
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user from username
            username = request.data.get('username')
            user = User.objects.get(username=username)
            
            # Update user profile
            if hasattr(user, 'profile'):
                user.profile.last_login_ip = get_client_ip(request)
                user.profile.update_last_activity()
            
            # Create audit log
            create_audit_log(
                user=user,
                action='login',
                description='User logged in',
                request=request
            )
        
        return response


class LogoutView(APIView):
    """
    Logout view that blacklists the refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Create audit log
            create_audit_log(
                user=request.user,
                action='logout',
                description='User logged out',
                request=request
            )
            
            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == 200:
            create_audit_log(
                user=request.user,
                action='update',
                content_type='UserProfile',
                object_id=request.user.id,
                object_repr=request.user.username,
                changes=request.data,
                request=request
            )
        
        return response


class ChangePasswordView(APIView):
    """
    Change user password.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            create_audit_log(
                user=user,
                action='update',
                content_type='User',
                object_id=user.id,
                object_repr=user.username,
                description='Password changed',
                request=request
            )
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Request password reset token.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Create reset token
            token = generate_password_reset_token()
            expires_at = timezone.now() + timedelta(hours=24)
            
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
            
            # TODO: Send email with reset link
            # from payments.utils import send_password_reset_email
            # send_password_reset_email(user, token)
            
            # Create audit log
            create_audit_log(
                user=user,
                action='update',
                content_type='User',
                object_id=user.id,
                object_repr=user.username,
                description='Password reset requested',
                request=request
            )
            
            return Response({
                'message': 'Password reset link sent to your email'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            return Response({
                'message': 'If the email exists, a reset link will be sent'
            }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Reset password with token.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response({
                'error': 'Token and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token,
                used=False
            )
            
            if not reset_token.is_valid:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            reset_token.used = True
            reset_token.used_at = timezone.now()
            reset_token.save()
            
            # Update profile
            if hasattr(user, 'profile'):
                user.profile.last_password_change = timezone.now()
                user.profile.save()
            
            # Create audit log
            create_audit_log(
                user=user,
                action='update',
                content_type='User',
                object_id=user.id,
                object_repr=user.username,
                description='Password reset completed',
                request=request
            )
            
            return Response({
                'message': 'Password reset successfully'
            }, status=status.HTTP_200_OK)
            
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)