
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StripeTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const runStripeTest = async () => {
    setTesting(true);
    const results = {
      publishableKey: false,
      secretKey: false,
      webhookSecret: false,
      testPayment: false,
      errors: []
    };

    try {
      // Test 1: Check if publishable key is configured
      const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (pubKey && pubKey.length > 10) {
        results.publishableKey = true;
      } else {
        results.errors.push('Missing or invalid VITE_STRIPE_PUBLISHABLE_KEY');
      }

      // Test 2: Test server connection and secret key
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const health = await response.json();
          if (health.stripe?.configured) {
            results.secretKey = true;
            results.webhookSecret = true;
          } else {
            results.errors.push('Stripe not properly configured on server');
          }
        }
      } catch (error) {
        results.errors.push('Cannot connect to server');
      }

      // Test 3: Try to create a test payment intent
      try {
        const response = await fetch('/api/invoices/1/create-payment-intent', {
          method: 'POST',
        });
        if (response.ok) {
          results.testPayment = true;
        } else {
          results.errors.push('Failed to create test payment intent');
        }
      } catch (error) {
        results.errors.push('Payment intent creation failed');
      }

    } catch (error) {
      results.errors.push('General test failure');
    }

    setTestResults(results);
    setTesting(false);

    if (results.publishableKey && results.secretKey && results.testPayment) {
      toast({
        title: "Stripe Integration Test",
        description: "✅ All tests passed! Stripe is properly configured.",
      });
    } else {
      toast({
        title: "Stripe Integration Test",
        description: "❌ Some tests failed. Check the results below.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stripe Integration Test</h1>
        <p className="text-muted-foreground">
          Test your Stripe configuration to ensure payments are working properly.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Test Stripe Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This test will verify that your Stripe keys are properly configured and that 
              the payment system is working correctly.
            </p>
            
            <Button 
              onClick={runStripeTest} 
              disabled={testing}
              className="w-full"
            >
              {testing ? "Running Tests..." : "Run Stripe Tests"}
            </Button>

            {testResults && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Test Results:</h3>
                
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.publishableKey)}
                      <span>Publishable Key</span>
                    </div>
                    {getStatusBadge(testResults.publishableKey)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.secretKey)}
                      <span>Secret Key</span>
                    </div>
                    {getStatusBadge(testResults.secretKey)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.webhookSecret)}
                      <span>Webhook Configuration</span>
                    </div>
                    {getStatusBadge(testResults.webhookSecret)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.testPayment)}
                      <span>Payment Intent Creation</span>
                    </div>
                    {getStatusBadge(testResults.testPayment)}
                  </div>
                </div>

                {testResults.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">Errors Found:</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {testResults.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Card Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use these test card numbers when testing payments:
            </p>
            <div className="grid gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded font-mono">
                <strong>Success:</strong> 4242424242424242
              </div>
              <div className="p-2 bg-gray-50 rounded font-mono">
                <strong>Declined:</strong> 4000000000000002
              </div>
              <div className="p-2 bg-gray-50 rounded font-mono">
                <strong>Insufficient Funds:</strong> 4000000000009995
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use any valid expiry date in the future and any 3-digit CVC.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
