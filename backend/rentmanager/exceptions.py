from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that logs errors and provides consistent error responses.
    """
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Get request details
    request = context.get('request')
    view = context.get('view')
    
    # Log the error
    if response is not None:
        logger.error(
            f"API Error: {exc.__class__.__name__} - {str(exc)} | "
            f"Path: {request.path if request else 'Unknown'} | "
            f"Method: {request.method if request else 'Unknown'} | "
            f"User: {request.user if request else 'Anonymous'} | "
            f"View: {view.__class__.__name__ if view else 'Unknown'}"
        )
        
        # Customize error response format
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data,
            'status_code': response.status_code
        }
        
        # Add specific error messages for common status codes
        if response.status_code == status.HTTP_404_NOT_FOUND:
            custom_response_data['message'] = 'Resource not found'
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            custom_response_data['message'] = 'You do not have permission to perform this action'
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            custom_response_data['message'] = 'Authentication credentials were not provided or are invalid'
        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            custom_response_data['message'] = 'Invalid request data'
        elif response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            custom_response_data['message'] = 'Internal server error'
        
        response.data = custom_response_data
    
    else:
        # Handle unexpected exceptions
        logger.exception(
            f"Unhandled Exception: {exc.__class__.__name__} - {str(exc)} | "
            f"Path: {request.path if request else 'Unknown'} | "
            f"Method: {request.method if request else 'Unknown'} | "
            f"User: {request.user if request else 'Anonymous'}"
        )
        
        # Return generic error response
        data = {
            'error': True,
            'message': 'An unexpected error occurred',
            'details': str(exc) if settings.DEBUG else 'Internal server error',
            'status_code': 500
        }
        
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response


class APIException(Exception):
    """Base exception class for API errors."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    
    def __init__(self, detail=None, status_code=None):
        if detail is not None:
            self.detail = detail
        else:
            self.detail = self.default_detail
            
        if status_code is not None:
            self.status_code = status_code


class ValidationError(APIException):
    """Exception for validation errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input data.'


class NotFoundError(APIException):
    """Exception for resource not found errors."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'


class PermissionDeniedError(APIException):
    """Exception for permission denied errors."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'


class AuthenticationError(APIException):
    """Exception for authentication errors."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication required.'