"""
Script to update existing invoice numbers to per-tenant format
Run with: python manage.py shell < payments/update_invoice_numbers.py
"""

from payments.models import Invoice
from django.db import transaction

def update_invoice_numbers():
    """Update all existing invoice numbers to per-tenant format."""
    print("Starting invoice number update...")
    
    # Get all unique tenants with invoices
    tenants = Invoice.objects.values_list('tenant', flat=True).distinct()
    
    with transaction.atomic():
        for tenant_id in tenants:
            # Get all invoices for this tenant ordered by creation date
            tenant_invoices = Invoice.objects.filter(
                tenant_id=tenant_id
            ).order_by('created_at', 'id')
            
            # Update each invoice with new numbering
            for index, invoice in enumerate(tenant_invoices, start=1):
                old_number = invoice.invoice_number
                unit_prefix = invoice.tenant.unit.replace(' ', '').upper()
                new_number = f"{unit_prefix}-INV-{index:04d}"
                
                invoice.invoice_number = new_number
                invoice.save(update_fields=['invoice_number'])
                
                print(f"Updated {old_number} -> {new_number}")
    
    print("Invoice number update complete!")

if __name__ == '__main__':
    update_invoice_numbers()