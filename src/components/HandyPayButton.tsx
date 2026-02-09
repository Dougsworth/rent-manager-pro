import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface HandyPayButtonProps {
  invoiceId: number;
  amount: number;
  invoiceNumber: string;
  disabled?: boolean;
  onPaymentInitiated?: () => void;
}

export function HandyPayButton({
  invoiceId,
  amount,
  invoiceNumber,
  disabled = false,
  onPaymentInitiated
}: HandyPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayWithHandyPay = async () => {
    if (disabled) return;

    setIsLoading(true);
    
    try {
      const response = await api.createPaymentLink(invoiceId);
      
      if (response.data?.success && response.data.payment_link) {
        // Open HandyPay payment page in a new window/tab
        const paymentWindow = window.open(
          response.data.payment_link,
          'handypay_payment',
          'width=500,height=700,scrollbars=yes,resizable=yes'
        );

        if (paymentWindow) {
          // Notify parent component that payment was initiated
          onPaymentInitiated?.();
          
          toast({
            title: "Payment Link Created",
            description: "You've been redirected to HandyPay to complete your payment.",
            duration: 5000,
          });

          // Optional: Monitor if the payment window is closed
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              // You could check payment status here
              toast({
                title: "Payment Window Closed",
                description: "Please refresh the page to see if your payment was processed.",
                duration: 3000,
              });
            }
          }, 1000);

          // Clear interval after 5 minutes to avoid memory leaks
          setTimeout(() => clearInterval(checkClosed), 300000);
        } else {
          // Popup was blocked, fallback to direct redirect
          window.location.href = response.data.payment_link;
        }
      } else {
        const errorMessage = response.data?.message || "Failed to create payment link";
        const isConfigError = errorMessage.includes("credentials") || errorMessage.includes("configuration");
        
        toast({
          title: isConfigError ? "Payment Gateway Not Available" : "Payment Link Error",
          description: isConfigError 
            ? "HandyPay payment gateway is not configured. Please contact support."
            : errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('HandyPay payment error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to create payment link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayWithHandyPay}
      disabled={disabled || isLoading}
      className="gap-2"
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {isLoading ? 'Creating Link...' : 'Pay with HandyPay'}
      {!isLoading && <ExternalLink className="h-3 w-3" />}
    </Button>
  );
}