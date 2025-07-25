
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890');

interface PaymentFormProps {
  invoiceId: number;
  amount: number;
  customerName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ invoiceId, amount, customerName, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret } = await apiRequest('POST', `/api/invoices/${invoiceId}/create-payment-intent`);

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: stripeError.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        setSucceeded(true);
        toast({
          title: "Payment Successful",
          description: `Payment of $${amount.toFixed(2)} has been processed successfully.`,
        });
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing');
      toast({
        title: "Payment Error",
        description: err.message || 'An error occurred during payment processing',
        variant: "destructive",
      });
    }

    setProcessing(false);
  };

  if (succeeded) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your payment of ${amount.toFixed(2)} has been processed successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Invoice payment for {customerName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <div className="mb-2 text-sm font-medium">Payment Amount</div>
            <div className="text-2xl font-bold">${amount.toFixed(2)}</div>
          </div>

          <div className="p-4 border rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!stripe || processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface StripePaymentProps {
  invoiceId: number;
  amount: number;
  customerName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePayment({ invoiceId, amount, customerName, onSuccess, onCancel }: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        invoiceId={invoiceId}
        amount={amount}
        customerName={customerName}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
