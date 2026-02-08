import io
from datetime import datetime
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.colors import Color, black, blue
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from .models import Invoice


def generate_invoice_pdf(invoice_id):
    """Generate PDF for a specific invoice."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        invoice = Invoice.objects.select_related('tenant').get(id=invoice_id)
        logger.info(f"Generating PDF for invoice {invoice.invoice_number}")
    except Invoice.DoesNotExist:
        logger.error(f"Invoice with id {invoice_id} not found")
        return None
    
    # Create BytesIO buffer
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=Color(0.149, 0.396, 0.918),  # Blue color
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=Color(0.149, 0.396, 0.918),
        alignment=TA_LEFT
    )
    
    normal_style = styles['Normal']
    
    # Build content
    content = []
    
    # Header - Company Information
    content.append(Paragraph("PropertyHub Pro", title_style))
    content.append(Paragraph("The Pods Property Management", styles['Heading3']))
    content.append(Paragraph("6 University Dr, Kingston", normal_style))
    content.append(Paragraph("📧 info@thepods.com | 📞 876-784-8380", normal_style))
    content.append(Spacer(1, 20))
    
    # Invoice Title and Number
    invoice_title = f"<b>INVOICE</b>"
    content.append(Paragraph(invoice_title, title_style))
    content.append(Paragraph(f"Invoice Number: {invoice.invoice_number}", heading_style))
    content.append(Spacer(1, 20))
    
    # Invoice Details Table
    invoice_data = [
        ['Invoice Date:', invoice.issue_date.strftime('%B %d, %Y')],
        ['Due Date:', invoice.due_date.strftime('%B %d, %Y')],
        ['Status:', invoice.status.title()],
    ]
    
    # Add overdue information if applicable
    if invoice.is_overdue:
        invoice_data.append(['Days Overdue:', str(invoice.days_overdue)])
    
    invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
    invoice_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    content.append(invoice_table)
    content.append(Spacer(1, 20))
    
    # Tenant Information
    content.append(Paragraph("Bill To:", heading_style))
    tenant_data = [
        ['Tenant Name:', invoice.tenant.name],
        ['Unit:', invoice.tenant.unit],
        ['Email:', invoice.tenant.email],
    ]
    
    if invoice.tenant.phone:
        tenant_data.append(['Phone:', str(invoice.tenant.phone)])
    
    tenant_table = Table(tenant_data, colWidths=[2*inch, 3*inch])
    tenant_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    content.append(tenant_table)
    content.append(Spacer(1, 30))
    
    # Invoice Items Table
    content.append(Paragraph("Invoice Details:", heading_style))
    
    # Table headers
    items_data = [
        ['Description', 'Amount', 'Status']
    ]
    
    # Invoice item
    description = invoice.description or f"Monthly rent for {invoice.tenant.unit}"
    items_data.append([
        description,
        f"J${invoice.amount:,.2f}",
        invoice.status.title()
    ])
    
    # Add payment information if partially paid
    if invoice.amount_paid > 0:
        items_data.append([
            "Amount Paid",
            f"-J${invoice.amount_paid:,.2f}",
            "Paid"
        ])
        items_data.append([
            "Balance Due",
            f"J${invoice.balance_due:,.2f}",
            "Outstanding"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Color(0.9, 0.9, 0.9)),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, black),
    ]))
    
    content.append(items_table)
    content.append(Spacer(1, 30))
    
    # Total Amount (highlighted)
    total_data = [
        ['', 'Total Amount Due:', f"J${invoice.balance_due:,.2f}"]
    ]
    
    total_table = Table(total_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (1, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (1, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (-1, -1), Color(0.149, 0.396, 0.918)),
        ('TEXTCOLOR', (1, 0), (-1, -1), Color(1, 1, 1)),
        ('BOTTOMPADDING', (1, 0), (-1, -1), 12),
        ('TOPPADDING', (1, 0), (-1, -1), 12),
    ]))
    
    content.append(total_table)
    content.append(Spacer(1, 40))
    
    # Payment Instructions
    content.append(Paragraph("Payment Instructions:", heading_style))
    payment_instructions = [
        "• Please make payment by the due date to avoid late fees",
        "• Contact us immediately if you have any questions about this invoice",
        "• Include your invoice number with your payment",
        "• For payment inquiries, call 876-784-8380 or email info@thepods.com"
    ]
    
    for instruction in payment_instructions:
        content.append(Paragraph(instruction, normal_style))
        content.append(Spacer(1, 6))
    
    content.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=normal_style,
        fontSize=8,
        textColor=Color(0.5, 0.5, 0.5),
        alignment=TA_CENTER
    )
    
    content.append(Paragraph("Thank you for your business!", footer_style))
    content.append(Paragraph("PropertyHub Pro - Professional Property Management", footer_style))
    
    try:
        # Build PDF
        doc.build(content)
        
        # Return PDF buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        logger.info(f"Successfully generated PDF for invoice {invoice.invoice_number}")
        return pdf
    except Exception as e:
        logger.error(f"Error building PDF for invoice {invoice_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None


def create_invoice_pdf_response(invoice_id):
    """Create HTTP response with PDF invoice."""
    pdf = generate_invoice_pdf(invoice_id)
    
    if pdf is None:
        return None
    
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        filename = f"invoice_{invoice.invoice_number}.pdf"
    except Invoice.DoesNotExist:
        filename = f"invoice_{invoice_id}.pdf"
    
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response