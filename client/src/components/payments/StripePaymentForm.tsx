
import React, { useState } from "react";
import {
  useStripe,
  useElements,
  CardElement,
  Elements
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  process.env.STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51234567890abcdef' // Replace with your actual publishable key
);

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  invoiceId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, amount, invoiceId, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      toast({
        title: "Payment Successful",
        description: `Payment of $${amount.toFixed(2)} has been processed.`,
      });
      onSuccess();
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Amount: <span className="font-semibold">${amount.toFixed(2)}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 border rounded-md">
            <CardElement options={cardElementOptions} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  invoiceId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
