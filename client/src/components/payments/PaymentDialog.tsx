
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, Receipt, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StripePaymentForm from "./StripePaymentForm";

interface PaymentDialogProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentDialog({ invoice, open, onOpenChange }: PaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "manual">("stripe");

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/create-payment-intent`);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (data: { invoiceId: number; paymentData: any }) => {
      const response = await apiRequest("POST", `/api/invoices/${data.invoiceId}/mark-paid`, data.paymentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    setClientSecret(null);
    onOpenChange(false);
  };

  const handleManualPayment = () => {
    markPaidMutation.mutate({
      invoiceId: invoice.id,
      paymentData: {
        amount: invoice.totalAmount,
        paymentMethod: 'manual',
        status: 'completed'
      }
    });
  };

  const handleStripePayment = () => {
    createPaymentIntentMutation.mutate(invoice.id);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Process Payment - Invoice #{invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Choose a payment method to collect payment for this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium">{invoice.customer?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                  {invoice status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${parseFloat(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${parseFloat(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              {invoice.discountAmount && parseFloat(invoice.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-${parseFloat(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>${parseFloat(invoice.totalAmount).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {invoice.status !== 'paid' && (
            <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "stripe" | "manual")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stripe" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Card Payment
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Mark as Paid
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stripe" className="space-y-4">
                {!clientSecret ? (
                  <div className="text-center py-6">
                    <Button
                      onClick={handleStripePayment}
                      disabled={createPaymentIntentMutation.isPending}
                      className="min-w-[200px]"
                    >
                      {createPaymentIntentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Initialize Payment
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={parseFloat(invoice.totalAmount)}
                    invoiceId={invoice.id}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setClientSecret(null)}
                  />
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Manual Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Use this option if payment was received through cash, check, or other non-card methods.
                    </p>
                    <div className="text-center">
                      <Button
                        onClick={handleManualPayment}
                        disabled={markPaidMutation.isPending}
                        size="lg"
                      >
                        {markPaidMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Mark as Paid - ${parseFloat(invoice.totalAmount).toFixed(2)}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {invoice.status === 'paid' && (
            <Card>
              <CardContent className="text-center py-6">
                <Badge variant="default" className="mb-2 bg-green-100 text-green-800">
                  Payment Completed
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This invoice has already been paid.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
