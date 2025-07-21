import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Mail, CreditCard, DollarSign, Eye, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: (invoiceId: number) => 
      apiRequest("POST", `/api/invoices/${invoiceId}/create-payment-intent`),
    onSuccess: (data) => {
      // Redirect to payment page or show payment form
      toast({
        title: "Payment Link Created",
        description: "Payment intent created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create payment link",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ invoiceId, paymentData }: { invoiceId: number; paymentData: any }) =>
      apiRequest("POST", `/api/invoices/${invoiceId}/mark-paid`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      sent: { label: "Sent", className: "bg-blue-100 text-blue-800" },
      paid: { label: "Paid", className: "bg-green-100 text-green-800" },
      overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                <p className="text-muted-foreground">
                  Manage customer invoices and payments
                </p>
              </div>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer">Customer</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {(customers as any[])?.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.firstName} {customer.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="order">Order (Optional)</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                          <SelectContent>
                            {(orders as any[])?.map((order: any) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.orderNumber} - {order.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input type="date" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxAmount">Tax Amount ($)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Invoice Items</Label>
                      <div className="border rounded-lg p-4 space-y-2">
                        <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
                          <div>Description</div>
                          <div>Quantity</div>
                          <div>Unit Price</div>
                          <div>Total</div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input placeholder="Frame labor" />
                          <Input type="number" step="0.01" placeholder="1" />
                          <Input type="number" step="0.01" placeholder="0.00" />
                          <Input disabled placeholder="$0.00" />
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button>
                        Create Invoice
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading invoices...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(invoices as any[])?.map((invoice: any) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {invoice.customer.firstName} {invoice.customer.lastName}
                            </TableCell>
                            <TableCell>
                              {invoice.order ? invoice.order.orderNumber : "-"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(invoice.totalAmount)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(invoice.status)}
                            </TableCell>
                            <TableCell>
                              {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                            </TableCell>
                            <TableCell>
                              {formatDate(invoice.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" title="View Invoice">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Download PDF">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Send Email">
                                  <Mail className="w-4 h-4" />
                                </Button>
                                {invoice.status === 'sent' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Create Payment Link"
                                    onClick={() => createPaymentIntentMutation.mutate(invoice.id)}
                                  >
                                    <CreditCard className="w-4 h-4" />
                                  </Button>
                                )}
                                {invoice.status !== 'paid' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Mark as Paid"
                                    onClick={() => markPaidMutation.mutate({
                                      invoiceId: invoice.id,
                                      paymentData: {
                                        amount: invoice.totalAmount,
                                        paymentMethod: 'manual',
                                        status: 'completed'
                                      }
                                    })}
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}