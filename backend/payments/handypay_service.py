"""
HandyPay API integration for automatic payment recording.
"""
import requests
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from decimal import Decimal
from .models import Payment, Invoice
from tenants.models import Tenant

logger = logging.getLogger(__name__)


class HandyPayService:
    """Service for integrating with HandyPay payment gateway."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'HANDYPAY_API_KEY', '')
        self.api_secret = getattr(settings, 'HANDYPAY_API_SECRET', '')
        self.base_url = getattr(settings, 'HANDYPAY_BASE_URL', 'https://api.handypay.me/v1')
        self.webhook_secret = getattr(settings, 'HANDYPAY_WEBHOOK_SECRET', '')
        self.is_sandbox = getattr(settings, 'HANDYPAY_SANDBOX', True)
        
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers with authentication."""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
            'X-API-Secret': self.api_secret
        }
    
    def create_payment_link(self, invoice: Invoice) -> Optional[Dict[str, Any]]:
        """
        Create a payment link for an invoice.
        
        Args:
            invoice: Invoice instance to create payment link for
            
        Returns:
            Dictionary with payment link data or None if failed
        """
        try:
            # Check if HandyPay is configured
            if not self.api_key or not self.api_secret:
                logger.warning("HandyPay API credentials not configured")
                return {
                    'error': 'HandyPay not configured',
                    'message': 'Payment gateway credentials are not configured'
                }
            
            # Ensure invoice has an organization
            if not hasattr(invoice, 'organization') or not invoice.organization:
                logger.error(f"Invoice {invoice.id} has no organization assigned")
                return None
            
            # Ensure invoice has a tenant
            if not hasattr(invoice, 'tenant') or not invoice.tenant:
                logger.error(f"Invoice {invoice.id} has no tenant assigned")
                return None
            
            payload = {
                'amount': str(invoice.amount),
                'currency': 'JMD',  # Jamaican Dollar
                'description': f'Rent Payment - Invoice {invoice.invoice_number}',
                'reference': invoice.invoice_number,
                'customer': {
                    'name': invoice.tenant.name,
                    'email': invoice.tenant.email,
                    'phone': str(invoice.tenant.phone) if invoice.tenant.phone else None
                },
                'metadata': {
                    'invoice_id': invoice.id,
                    'tenant_id': invoice.tenant.id,
                    'organization_id': str(invoice.organization.id)
                },
                'webhook_url': f"{settings.SITE_URL}/api/payments/handypay-webhook/",
                'return_url': f"{settings.SITE_URL}/payment-success",
                'cancel_url': f"{settings.SITE_URL}/payment-cancelled"
            }
            
            response = requests.post(
                f'{self.base_url}/payment-links',
                headers=self._get_headers(),
                json=payload,
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                logger.info(f"Created HandyPay payment link for invoice {invoice.invoice_number}")
                return data
            else:
                logger.error(f"HandyPay API error: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"HandyPay API request failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating payment link: {str(e)}")
            return None
    
    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Get payment status from HandyPay.
        
        Args:
            payment_id: HandyPay payment ID
            
        Returns:
            Dictionary with payment status data or None if failed
        """
        try:
            response = requests.get(
                f'{self.base_url}/payments/{payment_id}',
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"HandyPay status check error: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"HandyPay status check failed: {str(e)}")
            return None
    
    def process_webhook(self, webhook_data: Dict[str, Any]) -> bool:
        """
        Process HandyPay webhook for payment notifications.
        
        Args:
            webhook_data: Webhook payload from HandyPay
            
        Returns:
            True if processed successfully, False otherwise
        """
        try:
            event_type = webhook_data.get('event')
            payment_data = webhook_data.get('data', {})
            
            if event_type == 'payment.completed':
                return self._handle_payment_completed(payment_data)
            elif event_type == 'payment.failed':
                return self._handle_payment_failed(payment_data)
            elif event_type == 'payment.pending':
                return self._handle_payment_pending(payment_data)
            else:
                logger.warning(f"Unknown HandyPay webhook event: {event_type}")
                return True  # Don't fail for unknown events
                
        except Exception as e:
            logger.error(f"Error processing HandyPay webhook: {str(e)}")
            return False
    
    def _handle_payment_completed(self, payment_data: Dict[str, Any]) -> bool:
        """Handle completed payment webhook."""
        try:
            reference = payment_data.get('reference')
            amount = Decimal(payment_data.get('amount', '0'))
            transaction_id = payment_data.get('id')
            metadata = payment_data.get('metadata', {})
            
            # Find the invoice
            try:
                invoice = Invoice.objects.get(invoice_number=reference)
            except Invoice.DoesNotExist:
                logger.error(f"Invoice not found for reference: {reference}")
                return False
            
            # Check if payment already exists
            existing_payment = Payment.objects.filter(
                transaction_id=transaction_id,
                invoice=invoice
            ).first()
            
            if existing_payment:
                logger.info(f"Payment already exists for transaction {transaction_id}")
                return True
            
            # Create payment record
            payment = Payment.objects.create(
                organization=invoice.organization,
                tenant=invoice.tenant,
                invoice=invoice,
                amount=amount,
                payment_method='card',  # HandyPay typically processes card payments
                status='completed',
                transaction_id=transaction_id,
                notes=f'HandyPay payment - {payment_data.get("method", "card")}'
            )
            
            # Update invoice status
            invoice.amount_paid += amount
            invoice.update_status()
            
            logger.info(f"Recorded HandyPay payment {payment.reference_number} for invoice {reference}")
            
            # Send confirmation email (optional)
            self._send_payment_confirmation(payment)
            
            return True
            
        except Exception as e:
            logger.error(f"Error handling payment completed webhook: {str(e)}")
            return False
    
    def _handle_payment_failed(self, payment_data: Dict[str, Any]) -> bool:
        """Handle failed payment webhook."""
        try:
            reference = payment_data.get('reference')
            logger.info(f"HandyPay payment failed for invoice {reference}")
            
            # Find the invoice and update any pending payments
            try:
                invoice = Invoice.objects.get(invoice_number=reference)
                # Update any pending payments to failed status
                Payment.objects.filter(
                    invoice=invoice,
                    status='pending',
                    transaction_id=payment_data.get('id')
                ).update(status='failed')
                
            except Invoice.DoesNotExist:
                logger.error(f"Invoice not found for failed payment: {reference}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error handling payment failed webhook: {str(e)}")
            return False
    
    def _handle_payment_pending(self, payment_data: Dict[str, Any]) -> bool:
        """Handle pending payment webhook."""
        try:
            reference = payment_data.get('reference')
            amount = Decimal(payment_data.get('amount', '0'))
            transaction_id = payment_data.get('id')
            
            # Find the invoice
            try:
                invoice = Invoice.objects.get(invoice_number=reference)
            except Invoice.DoesNotExist:
                logger.error(f"Invoice not found for reference: {reference}")
                return False
            
            # Check if payment already exists
            existing_payment = Payment.objects.filter(
                transaction_id=transaction_id,
                invoice=invoice
            ).first()
            
            if not existing_payment:
                # Create pending payment record
                Payment.objects.create(
                    organization=invoice.organization,
                    tenant=invoice.tenant,
                    invoice=invoice,
                    amount=amount,
                    payment_method='card',
                    status='pending',
                    transaction_id=transaction_id,
                    notes='HandyPay payment - processing'
                )
                
                logger.info(f"Created pending payment record for invoice {reference}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error handling payment pending webhook: {str(e)}")
            return False
    
    def _send_payment_confirmation(self, payment: Payment):
        """Send payment confirmation email to tenant."""
        try:
            # Use existing email service
            from .email_service import send_payment_confirmation_email
            send_payment_confirmation_email(payment)
        except ImportError:
            logger.warning("Email service not available for payment confirmation")
        except Exception as e:
            logger.error(f"Error sending payment confirmation: {str(e)}")
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify webhook signature for security.
        
        Args:
            payload: Raw webhook payload
            signature: Signature from HandyPay
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            import hmac
            import hashlib
            
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False


# Global instance
handypay_service = HandyPayService()