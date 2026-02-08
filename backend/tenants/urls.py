from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, TenantDocumentViewSet

app_name = 'tenants'

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'tenant-documents', TenantDocumentViewSet, basename='tenant-document')

urlpatterns = [
    path('', include(router.urls)),
    
    # Add specific remind endpoint to match frontend expectation
    path('tenants/<int:pk>/remind/', 
         TenantViewSet.as_view({'post': 'send_reminder'}),
         name='tenant-remind'),
    
    # Nested routes for tenant documents
    path('tenants/<int:tenant_id>/documents/', 
         TenantDocumentViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='tenant-documents-list'),
    path('tenants/<int:tenant_id>/documents/<int:pk>/',
         TenantDocumentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}),
         name='tenant-documents-detail'),
]