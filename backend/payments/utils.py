from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from .models import Invoice, PaymentReminder


def send_payment_reminder(tenant, reminder_type='email', custom_message='', user=None):
    """
    Send payment reminder to tenant.
    
    Args:
        tenant: Tenant object
        reminder_type: Type of reminder (email, sms, etc.)
        custom_message: Custom message to include
        user: User sending the reminder
    
    Returns:
        PaymentReminder object or None
    """
    
    # Get the latest unpaid invoice
    latest_invoice = Invoice.objects.filter(
        tenant=tenant,
        status__in=['sent', 'partially_paid', 'overdue']
    ).order_by('-due_date').first()
    
    if not latest_invoice:
        raise ValueError("No unpaid invoices found for this tenant")
    
    # Prepare reminder data
    reminder_data = {
        'tenant': tenant,
        'invoice': latest_invoice,
        'reminder_type': reminder_type,
        'sent_by': user
    }
    
    # Send based on reminder type
    if reminder_type == 'email':
        subject = f"Payment Reminder - Invoice {latest_invoice.invoice_number}"
        
        # Prepare context for email template
        context = {
            'tenant': tenant,
            'invoice': latest_invoice,
            'custom_message': custom_message,
            'company_name': 'RentManager Pro',
            'due_date': latest_invoice.due_date,
            'amount_due': latest_invoice.balance_due,
            'days_overdue': latest_invoice.days_overdue if latest_invoice.is_overdue else 0
        }
        
        # Default message if no custom message provided
        if not custom_message:
            if latest_invoice.is_overdue:
                custom_message = f"Your rent payment of J${latest_invoice.balance_due} is {latest_invoice.days_overdue} days overdue."
            else:
                custom_message = f"This is a reminder that your rent payment of J${latest_invoice.balance_due} is due on {latest_invoice.due_date}."
        
        # Email body
        message = f"""
Dear {tenant.name},

{custom_message}

Invoice Details:
- Invoice Number: {latest_invoice.invoice_number}
- Amount Due: J${latest_invoice.balance_due}
- Due Date: {latest_invoice.due_date}
- Unit: {tenant.unit}

Please make your payment as soon as possible to avoid any late fees.

If you have already made this payment, please disregard this reminder.

Thank you,
RentManager Pro
"""
        
        # Send email
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[tenant.email],
                fail_silently=False,
            )
            
            # Create reminder record
            reminder_data.update({
                'recipient': tenant.email,
                'subject': subject,
                'message': message,
                'is_sent': True
            })
            
        except Exception as e:
            # Log error but still create reminder record
            reminder_data.update({
                'recipient': tenant.email,
                'subject': subject,
                'message': message,
                'is_sent': False
            })
            print(f"Failed to send email: {str(e)}")
    
    elif reminder_type == 'sms':
        # SMS implementation would go here
        # For now, just create a record
        reminder_data.update({
            'recipient': str(tenant.phone),
            'message': custom_message or f"Reminder: Your rent payment of J${latest_invoice.balance_due} is due.",
            'is_sent': False  # Would be True after actual SMS sending
        })
    
    else:
        # Other reminder types
        reminder_data.update({
            'recipient': tenant.email,
            'message': custom_message or "Payment reminder",
            'is_sent': False
        })
    
    # Create and return reminder record
    reminder = PaymentReminder.objects.create(**reminder_data)
    return reminder


def send_invoice_email(invoice):
    """
    Send invoice email to tenant.
    
    Args:
        invoice: Invoice object
    """
    
    subject = f"Invoice {invoice.invoice_number} - {invoice.tenant.unit}"
    
    message = f"""
Dear {invoice.tenant.name},

Please find below your invoice details:

Invoice Number: {invoice.invoice_number}
Issue Date: {invoice.issue_date}
Due Date: {invoice.due_date}
Amount: J${invoice.amount}

Unit: {invoice.tenant.unit}
Description: {invoice.description}

Please ensure payment is made by the due date to avoid any late fees.

Payment Methods:
- Bank Transfer
- Cash
- Credit/Debit Card

Thank you for your prompt payment.

Best regards,
RentManager Pro
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invoice.tenant.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send invoice email: {str(e)}")
        return False


def generate_invoice_pdf(invoice):
    """
    Generate PDF for an invoice.
    
    Args:
        invoice: Invoice object
        
    Returns:
        PDF file content
    """
    # This would use a library like ReportLab or WeasyPrint
    # For now, return None as placeholder
    # TODO: Implement PDF generation
    return None


def calculate_late_fees(invoice):
    """
    Calculate late fees for an overdue invoice.
    
    Args:
        invoice: Invoice object
        
    Returns:
        Late fee amount
    """
    if not invoice.is_overdue:
        return 0
    
    # Example: 5% of invoice amount or J$500, whichever is greater
    percentage_fee = invoice.amount * 0.05
    minimum_fee = 500
    
    return max(percentage_fee, minimum_fee)