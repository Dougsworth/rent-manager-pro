from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InvoiceViewSet, PaymentViewSet, PaymentReminderViewSet,
    dashboard_stats, recent_payments, overdue_tenants,
    handypay_webhook, create_payment_link, payment_status
)

app_name = 'payments'

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payment-reminders', PaymentReminderViewSet, basename='payment-reminder')

urlpatterns = [
    path('', include(router.urls)),
    
    # Dashboard endpoints
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/recent-payments/', recent_payments, name='recent-payments'),
    path('dashboard/overdue-tenants/', overdue_tenants, name='overdue-tenants'),
    
    # HandyPay integration endpoints
    path('handypay-webhook/', handypay_webhook, name='handypay-webhook'),
    path('create-payment-link/', create_payment_link, name='create-payment-link'),
    path('payment-status/<str:payment_id>/', payment_status, name='payment-status'),
]