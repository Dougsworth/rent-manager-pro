import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Resend API configuration
RESEND_API_KEY = 're_6AgzmEdp_iWzHsnf2kjkYsW4WH7o5XDmJ'
RESEND_API_URL = 'https://api.resend.com/emails'

def send_payment_reminder(tenant_name, tenant_email, unit, rent_amount, days_overdue=None, property_name="The Pods"):
    """
    Send payment reminder email using Resend API.
    """
    try:
        message = (
            f"Your rent payment for {unit} is {days_overdue} days overdue. "
            f"Please make payment as soon as possible to avoid late fees."
            if days_overdue 
            else f"This is a friendly reminder that your rent payment for {unit} is due soon."
        )

        # Domain verification status
        domain_verified = False  # Change to True once rent-manager-pro-three.vercel.app is verified
        
        if domain_verified:
            from_email = "The Pods <noreply@rent-manager-pro-three.vercel.app>"
            recipient_email = tenant_email
        else:
            # Test mode: use Resend's domain and send to your email
            from_email = "The Pods <noreply@resend.dev>"
            recipient_email = "dougyd15@gmail.com"
        
        email_payload = {
            "from": from_email,
            "to": [recipient_email],
            "subject": f"Rent Reminder - {unit} | The Pods",
            "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin: 0;">The Pods</h1>
                            <p style="color: #6b7280; margin: 5px 0;">6 University Dr, Kingston</p>
                        </div>
                        
                        <h2 style="color: #1f2937;">Dear {tenant_name},</h2>
                        
                        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">{message}</p>
                        
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0;">Payment Details</h3>
                            <p style="margin: 5px 0;"><strong>Unit:</strong> {unit}</p>
                            <p style="margin: 5px 0;"><strong>Amount:</strong> J${rent_amount:,.2f}</p>
                            <p style="margin: 5px 0;"><strong>Property:</strong> {property_name}</p>
                        </div>
                        
                        <p style="color: #4b5563; line-height: 1.6;">
                            Please make your payment as soon as possible. If you have any questions or need to discuss your payment, 
                            please contact us immediately.
                        </p>
                        
                        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center; color: #6b7280;">
                            <p><strong>The Pods Property Management</strong></p>
                            <p>📧 info@thepods.com | 📞 876-784-8380</p>
                            <p>6 University Dr, Kingston</p>
                        </div>
                    </div>
                </div>
            """
        }

        headers = {
            'Authorization': f'Bearer {RESEND_API_KEY}',
            'Content-Type': 'application/json',
        }

        response = requests.post(RESEND_API_URL, json=email_payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Email sent successfully via Resend: {result}")
            if domain_verified:
                return True, f"Email sent to {tenant_email}"
            else:
                return True, f"Test email sent to {recipient_email} (for {tenant_name})"
        else:
            error_text = response.text
            logger.error(f"Resend API error: {error_text}")
            return False, f"Failed to send email: {error_text}"
            
    except Exception as e:
        logger.error(f"Failed to send email via Resend: {str(e)}")
        return False, f"Email service error: {str(e)}"