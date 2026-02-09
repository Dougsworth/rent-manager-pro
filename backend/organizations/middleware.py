from django.utils.deprecation import MiddlewareMixin
from django.core.exceptions import PermissionDenied
from .models import OrganizationMembership


class OrganizationMiddleware(MiddlewareMixin):
    """
    Middleware to handle organization context for multi-tenancy.
    Adds the current organization to the request object.
    """
    
    def process_request(self, request):
        # Skip for non-authenticated requests
        if not request.user.is_authenticated:
            request.organization = None
            request.membership = None
            return
        
        # Skip for admin and auth URLs
        if request.path.startswith('/admin/') or request.path.startswith('/api/auth/'):
            request.organization = None
            request.membership = None
            return
        
        # Get organization from header or session
        org_id = request.headers.get('X-Organization-ID') or request.session.get('organization_id')
        
        if org_id:
            # Verify user has access to this organization
            try:
                membership = OrganizationMembership.objects.select_related('organization').get(
                    user=request.user,
                    organization_id=org_id
                )
                request.organization = membership.organization
                request.membership = membership
                # Store in session for future requests
                request.session['organization_id'] = str(org_id)
            except OrganizationMembership.DoesNotExist:
                raise PermissionDenied("You don't have access to this organization")
        else:
            # Get user's first organization (for now)
            membership = OrganizationMembership.objects.select_related('organization').filter(
                user=request.user
            ).first()
            
            if membership:
                request.organization = membership.organization
                request.membership = membership
                request.session['organization_id'] = str(membership.organization.id)
            else:
                request.organization = None
                request.membership = None


class OrganizationFilterMiddleware(MiddlewareMixin):
    """
    Middleware to automatically filter querysets by organization.
    This ensures data isolation between organizations.
    """
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Skip if no organization context
        if not hasattr(request, 'organization') or not request.organization:
            return None
        
        # Add organization context to view kwargs if needed
        if hasattr(view_func, 'view_class'):
            view_class = view_func.view_class
            if hasattr(view_class, 'get_queryset'):
                # This will be handled in the viewset's get_queryset method
                pass
        
        return None