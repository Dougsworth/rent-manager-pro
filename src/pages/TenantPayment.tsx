import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  CreditCard, 
  Building2, 
  Calendar, 
  DollarSign, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface OutstandingInvoice {
  id: string;
  amount: string;
  dueDate: string;
  description: string;
  status: 'overdue' | 'pending';
  lateFee?: string;
}

const mockInvoices: OutstandingInvoice[] = [
  {
    id: 'INV-002',
    amount: 'J$52,000',
    dueDate: '2024-02-01',
    description: 'Monthly Rent - February 2024',
    status: 'pending'
  },
  {
    id: 'INV-001',
    amount: 'J$45,000',
    dueDate: '2024-01-15',
    description: 'Monthly Rent - January 2024',
    status: 'overdue',
    lateFee: 'J$2,250'
  }
];

export default function TenantPayment() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'cash'>('card');
  const [step, setStep] = useState<'select' | 'payment' | 'confirmation'>('select');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const tenantInfo = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    property: '456 Oak Ave, Unit 2B'
  };

  const totalAmount = selectedInvoices.reduce((sum, invoiceId) => {
    const invoice = mockInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return sum;
    const amount = parseInt(invoice.amount.replace('J$', '').replace(',', ''));
    const lateFee = invoice.lateFee ? parseInt(invoice.lateFee.replace('J$', '').replace(',', '')) : 0;
    return sum + amount + lateFee;
  }, 0);

  const handleInvoiceToggle = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handlePaymentSubmit = () => {
    setStep('confirmation');
  };

  const renderSelectStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outstanding Payments</h2>
        <p className="text-gray-600 mb-6">Select the invoices you'd like to pay</p>
        
        <div className="space-y-4">
          {mockInvoices.map((invoice) => (
            <Card key={invoice.id} className={`cursor-pointer transition-colors ${
              selectedInvoices.includes(invoice.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleInvoiceToggle(invoice.id)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{invoice.description}</p>
                        <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Due: {invoice.dueDate}</span>
                        <span>Invoice: {invoice.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{invoice.amount}</p>
                    {invoice.lateFee && (
                      <p className="text-sm text-red-600">Late fee: {invoice.lateFee}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedInvoices.length > 0 && (
          <Card className="mt-6 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  J${totalAmount.toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => setStep('payment')}
                disabled={selectedInvoices.length === 0}
              >
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total to Pay:</span>
              <span className="text-2xl font-bold text-blue-600">
                J${totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected
            </p>
          </CardContent>
        </Card>

        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Payment Method</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Instant processing' },
              { id: 'bank', label: 'Bank Transfer', icon: Building2, description: '1-2 business days' },
              { id: 'cash', label: 'Cash Payment', icon: DollarSign, description: 'In-person only' },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <p className="font-medium">{method.label}</p>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {paymentMethod === 'card' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Card Information
              </CardTitle>
              <p className="text-sm text-gray-600">Your payment information is secure and encrypted</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cardName">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethod === 'bank' && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Bank Transfer Instructions</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Account Name:</strong> ABC Property Management</p>
                  <p><strong>Account Number:</strong> 123-456-7890</p>
                  <p><strong>Bank:</strong> National Commercial Bank</p>
                  <p><strong>Reference:</strong> {selectedInvoices.join(', ')}</p>
                </div>
                <p className="text-sm text-gray-600">
                  Please include the reference number in your transfer description.
                  Payment confirmation may take 1-2 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethod === 'cash' && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Cash Payment Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Office Address:</strong> 123 Business St, Kingston, Jamaica</p>
                  <p><strong>Office Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM</p>
                  <p><strong>Contact:</strong> +1 (876) 555-0123</p>
                </div>
                <p className="text-sm text-gray-600">
                  Please bring this payment reference and a valid ID when making your cash payment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep('select')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {paymentMethod === 'card' ? 'Pay Now' : 'Confirm Payment'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {paymentMethod === 'card' ? 'Payment Successful!' : 'Payment Submitted!'}
        </h2>
        <p className="text-gray-600">
          {paymentMethod === 'card' 
            ? 'Your payment has been processed successfully.'
            : 'Your payment request has been submitted and is being processed.'
          }
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-semibold">J${totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction ID:</span>
              <span className="font-mono text-sm">TXN-{Date.now()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1">
          Download Receipt
        </Button>
        <Button className="flex-1">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
              <p className="text-gray-600">{tenantInfo.name} • {tenantInfo.property}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'select' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Select Invoices</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        {step === 'select' && renderSelectStep()}
        {step === 'payment' && renderPaymentStep()}
        {step === 'confirmation' && renderConfirmationStep()}
      </div>
    </div>
  );
}