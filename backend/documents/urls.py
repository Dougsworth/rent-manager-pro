from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, DocumentCategoryViewSet, DocumentTemplateViewSet

app_name = 'documents'

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-categories', DocumentCategoryViewSet, basename='document-category')
router.register(r'document-templates', DocumentTemplateViewSet, basename='document-template')

urlpatterns = [
    path('', include(router.urls)),
]