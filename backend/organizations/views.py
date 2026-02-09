from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Organization, OrganizationMembership, Property, Unit
from .serializers import (
    OrganizationSerializer, OrganizationCreateSerializer,
    OrganizationMembershipSerializer, PropertySerializer, UnitSerializer
)
from authentication.utils import create_audit_log


class IsOrganizationOwner(permissions.BasePermission):
    """Permission to check if user is organization owner."""
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            return obj.owner == request.user
        return obj.organization.owner == request.user


class IsOrganizationMember(permissions.BasePermission):
    """Permission to check if user is organization member."""
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            org = obj
        else:
            org = obj.organization
        return OrganizationMembership.objects.filter(
            user=request.user,
            organization=org
        ).exists()


class OrganizationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing organizations."""
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get organizations where user is a member."""
        return Organization.objects.filter(
            members=self.request.user
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrganizationCreateSerializer
        return OrganizationSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOrganizationOwner()]
        return [IsAuthenticated(), IsOrganizationMember()]
    
    @action(detail=True, methods=['GET'])
    def members(self, request, pk=None):
        """Get organization members."""
        organization = self.get_object()
        memberships = OrganizationMembership.objects.filter(
            organization=organization
        ).select_related('user')
        serializer = OrganizationMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['POST'])
    def invite_member(self, request, pk=None):
        """Invite a new member to organization."""
        organization = self.get_object()
        
        # Check permission
        membership = OrganizationMembership.objects.filter(
            user=request.user,
            organization=organization
        ).first()
        
        if not membership or not membership.can_manage_users:
            return Response(
                {'error': 'You do not have permission to invite members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        role = request.data.get('role', 'staff')
        
        # Check if user exists
        try:
            from django.contrib.auth.models import User
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create invitation (implement email invitation system)
            return Response({
                'message': f'Invitation sent to {email}'
            })
        
        # Check if already member
        if OrganizationMembership.objects.filter(user=user, organization=organization).exists():
            return Response(
                {'error': 'User is already a member'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership
        membership = OrganizationMembership.objects.create(
            user=user,
            organization=organization,
            role=role,
            invited_by=request.user
        )
        
        serializer = OrganizationMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PropertyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing properties."""
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get properties for user's organizations."""
        return Property.objects.filter(
            organization__members=self.request.user
        ).select_related('organization').distinct()
    
    def perform_create(self, serializer):
        """Create property with organization validation."""
        organization_id = self.request.data.get('organization')
        
        # Verify user has access to organization
        if not OrganizationMembership.objects.filter(
            user=self.request.user,
            organization_id=organization_id,
            can_manage_properties=True
        ).exists():
            raise PermissionError("You don't have permission to create properties in this organization")
        
        property = serializer.save()
        
        create_audit_log(
            user=self.request.user,
            action='create',
            content_type='Property',
            object_id=property.id,
            object_repr=str(property),
            description=f"Created property: {property.name}"
        )


class UnitViewSet(viewsets.ModelViewSet):
    """ViewSet for managing units."""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get units for user's organizations."""
        return Unit.objects.filter(
            property__organization__members=self.request.user
        ).select_related('property', 'property__organization').distinct()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_organization(request):
    """Register a new organization with owner account."""
    serializer = OrganizationCreateSerializer(data=request.data)
    if serializer.is_valid():
        organization = serializer.save()
        
        # Return organization data with auth token
        from rest_framework_simplejwt.tokens import RefreshToken
        user = organization.owner
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'organization': OrganizationSerializer(organization).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_organization(request):
    """Get the current user's active organization."""
    # For now, return the first organization
    # Later, implement organization switching
    membership = OrganizationMembership.objects.filter(
        user=request.user
    ).select_related('organization').first()
    
    if membership:
        return Response({
            'organization': OrganizationSerializer(membership.organization).data,
            'membership': OrganizationMembershipSerializer(membership).data
        })
    
    return Response(
        {'error': 'No organization found'},
        status=status.HTTP_404_NOT_FOUND
    )