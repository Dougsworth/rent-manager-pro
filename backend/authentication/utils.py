from django.contrib.auth.models import User
from django.utils import timezone
from .models import AuditLog
import json


def create_audit_log(user, action, content_type='', object_id='', 
                    object_repr='', changes=None, description='', 
                    request=None):
    """
    Create an audit log entry.
    
    Args:
        user: User performing the action
        action: Type of action (create, update, delete, etc.)
        content_type: Type of object being acted upon
        object_id: ID of the object
        object_repr: String representation of the object
        changes: Dictionary of changes made
        description: Additional description
        request: HTTP request object for IP and user agent
    """
    
    # Get IP address and user agent from request if provided
    ip_address = None
    user_agent = ''
    
    if request:
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Convert changes to JSON if it's a dict
    if isinstance(changes, dict):
        changes = json.dumps(changes, default=str)
    
    # Create audit log
    audit_log = AuditLog.objects.create(
        user=user,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent[:500],  # Truncate to field max length
        content_type=content_type,
        object_id=str(object_id),
        object_repr=object_repr[:255],  # Truncate to field max length
        changes=changes or {},
        description=description
    )
    
    return audit_log


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def generate_password_reset_token():
    """Generate a secure password reset token."""
    import secrets
    return secrets.token_urlsafe(32)


def is_strong_password(password):
    """
    Check if password meets strength requirements.
    
    Requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    """
    import re
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"