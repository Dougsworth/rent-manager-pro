// Resend API configuration
const RESEND_API_KEY = 're_6AgzmEdp_iWzHsnf2kjkYsW4WH7o5XDmJ';

export interface ReminderEmailData {
  tenantName: string;
  tenantEmail: string;
  unit: string;
  rentAmount: number;
  daysOverdue?: number;
  propertyName?: string;
}

export const sendPaymentReminder = async (data: ReminderEmailData): Promise<boolean> => {
  try {
    const message = data.daysOverdue 
      ? `Your rent payment for ${data.unit} is ${data.daysOverdue} days overdue. Please make payment as soon as possible to avoid late fees.`
      : `This is a friendly reminder that your rent payment for ${data.unit} is due soon.`;

    const emailPayload = {
      from: 'The Pods <noreply@resend.dev>', // Using Resend's test domain
      to: [data.tenantEmail],
      subject: `Rent Reminder - ${data.unit} | The Pods`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">The Pods</h1>
              <p style="color: #6b7280; margin: 5px 0;">6 University Dr, Kingston</p>
            </div>
            
            <h2 style="color: #1f2937;">Dear ${data.tenantName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">${message}</p>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0;">Payment Details</h3>
              <p style="margin: 5px 0;"><strong>Unit:</strong> ${data.unit}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> J$${data.rentAmount.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Property:</strong> ${data.propertyName || 'The Pods'}</p>
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
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Email sent successfully via Resend:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    return false;
  }
};

// Mock function for demo purposes (remove when EmailJS is configured)
export const sendMockReminder = async (data: ReminderEmailData): Promise<boolean> => {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Mock Email Sent:', {
    to: data.tenantEmail,
    subject: `Rent Reminder - ${data.unit}`,
    tenant: data.tenantName,
    amount: `J$${data.rentAmount.toLocaleString()}`,
    property: 'The Pods'
  });
  
  // Simulate 95% success rate (occasionally fail for testing)
  return Math.random() > 0.05;
};