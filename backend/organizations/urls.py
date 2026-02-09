from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, PropertyViewSet, UnitViewSet,
    register_organization, get_current_organization
)

app_name = 'organizations'

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'units', UnitViewSet, basename='unit')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_organization, name='register-organization'),
    path('current/', get_current_organization, name='current-organization'),
]