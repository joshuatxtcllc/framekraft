
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Mail, Download } from "lucide-react";
import InvoiceTemplate from './InvoiceTemplate';
import WorkOrderTemplate from './WorkOrderTemplate';
import { useToast } from "@/hooks/use-toast";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  customer: any;
  type: 'invoice' | 'workorder';
}

export default function InvoiceDialog({ isOpen, onClose, order, customer, type }: InvoiceDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [emailAddress, setEmailAddress] = React.useState(customer?.email || '');

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Print ${type === 'invoice' ? 'Invoice' : 'Work Order'}</title>
            <style>
              @media print {
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .print\\:p-0 { padding: 0 !important; }
                .print\\:shadow-none { box-shadow: none !important; }
                .print\\:appearance-auto { appearance: auto !important; }
                @page { margin: 0.5in; }
              }
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .bg-gray-50 { background-color: #f9fafb; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .bg-green-100 { background-color: #dcfce7; }
              .bg-yellow-100 { background-color: #fef3c7; }
              .bg-red-50 { background-color: #fef2f2; }
              .bg-red-100 { background-color: #fee2e2; }
              .bg-orange-100 { background-color: #fed7aa; }
              .bg-blue-100 { background-color: #dbeafe; }
              .text-green-800 { color: #166534; }
              .text-yellow-800 { color: #92400e; }
              .text-red-800 { color: #991b1b; }
              .text-orange-800 { color: #9a3412; }
              .text-blue-800 { color: #1e40af; }
              .text-gray-800 { color: #1f2937; }
              .text-gray-600 { color: #4b5563; }
              .text-red-600 { color: #dc2626; }
              .text-green-600 { color: #16a34a; }
              .border { border: 1px solid #d1d5db; }
              .border-t { border-top: 1px solid #d1d5db; }
              .border-b { border-bottom: 1px solid #d1d5db; }
              .border-t-2 { border-top: 2px solid #d1d5db; }
              .border-b-2 { border-bottom: 2px solid #d1d5db; }
              .border-gray-300 { border-color: #d1d5db; }
              .border-red-200 { border-color: #fecaca; }
              .border-red-300 { border-color: #fca5a5; }
              .border-orange-300 { border-color: #fdba74; }
              .border-blue-300 { border-color: #93c5fd; }
              .rounded { border-radius: 0.25rem; }
              .rounded-full { border-radius: 9999px; }
              .p-3 { padding: 0.75rem; }
              .p-4 { padding: 1rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .pt-2 { padding-top: 0.5rem; }
              .pt-3 { padding-top: 0.75rem; }
              .pt-4 { padding-top: 1rem; }
              .pt-6 { padding-top: 1.5rem; }
              .pb-6 { padding-bottom: 1.5rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-3 { margin-top: 0.75rem; }
              .mt-4 { margin-top: 1rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-8 { margin-bottom: 2rem; }
              .space-y-1 > :not(:first-child) { margin-top: 0.25rem; }
              .space-y-2 > :not(:first-child) { margin-top: 0.5rem; }
              .space-y-3 > :not(:first-child) { margin-top: 0.75rem; }
              .space-x-2 > :not(:first-child) { margin-left: 0.5rem; }
              .space-x-3 > :not(:first-child) { margin-left: 0.75rem; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .justify-between { justify-content: space-between; }
              .justify-end { justify-content: flex-end; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .text-xs { font-size: 0.75rem; }
              .text-sm { font-size: 0.875rem; }
              .text-lg { font-size: 1.125rem; }
              .text-2xl { font-size: 1.5rem; }
              .text-3xl { font-size: 1.875rem; }
              .w-full { width: 100%; }
              .w-64 { width: 16rem; }
              .w-1\\/3 { width: 33.333333%; }
              .max-w-4xl { max-width: 56rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .gap-4 { gap: 1rem; }
              .whitespace-pre-line { white-space: pre-line; }
              .overflow-hidden { overflow: hidden; }
              .border-dotted { border-style: dotted; }
              .h-6 { height: 1.5rem; }
              .border-gray-400 { border-color: #9ca3af; }
              .text-gray-500 { color: #6b7280; }
              .text-gray-700 { color: #374151; }
              .block { display: block; }
              .inline-block { display: inline-block; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore React functionality
    }
  };

  const handleEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/orders/email-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          type: type,
          emailAddress: emailAddress,
        }),
      });

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: `${type === 'invoice' ? 'Invoice' : 'Work order'} has been sent to ${emailAddress}`,
        });
        onClose();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (printRef.current) {
      // For now, just open print dialog which allows save as PDF
      handlePrint();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === 'invoice' ? 'Invoice' : 'Work Order'} - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div ref={printRef}>
            {type === 'invoice' ? (
              <InvoiceTemplate order={order} customer={customer} />
            ) : (
              <WorkOrderTemplate order={order} customer={customer} />
            )}
          </div>
        </div>
        
        <div className="border-t pt-4 flex flex-col space-y-4">
          {/* Email Section */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="email" className="min-w-0">Email to:</Label>
            <Input
              id="email"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="customer@example.com"
              className="flex-1"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
