import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  FileText, 
  Eye,
  Send,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  UserPlus,
  Trash2,
  Mail
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import InvoiceDialog from "@/components/orders/InvoiceDialog";
import StripePayment from "@/components/payments/StripePayment";
import { exportToPDF } from "@/lib/pdfExport";
import PaymentDialog from "@/components/payments/PaymentDialog";

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unitPrice: z.string().min(1, "Unit price is required"),
  total: z.string(),
});

const invoiceSchema = z.object({
  customerId: z.string().optional(),
  newCustomer: customerSchema.optional(),
  orderId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  taxAmount: z.string().default("0.00"),
  discountAmount: z.string().default("0.00"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type CustomerFormData = z.infer<typeof customerSchema>;

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const { toast } = useToast();
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      taxAmount: "0.00",
      discountAmount: "0.00",
      items: [{ description: "", quantity: "1", unitPrice: "0.00", total: "0.00" }],
    },
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

  const createInvoiceMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCreateDialogOpen(false);
      form.reset();
      setShowNewCustomer(false);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, { description: "", quantity: "1", unitPrice: "0.00", total: "0.00" }]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const calculateItemTotal = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const quantity = parseFloat(item.quantity || "0");
    const unitPrice = parseFloat(item.unitPrice || "0");
    const total = quantity * unitPrice;

    const updatedItems = [...items];
    updatedItems[index] = { ...item, total: total.toFixed(2) };
    form.setValue("items", updatedItems);
  };

  const calculateSubtotal = () => {
    const items = form.watch("items");
    return items.reduce((sum, item) => sum + parseFloat(item.total || "0"), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = parseFloat(form.watch("taxAmount") || "0");
    const discount = parseFloat(form.watch("discountAmount") || "0");
    return subtotal + tax - discount;
  };

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const handleExportPDF = (invoice: any) => {
    exportToPDF(invoice, "invoice");
  };

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const emailForm = useForm({
    resolver: zodResolver(
      z.object({
        emailAddress: z.string().email({ message: "Please enter a valid email address" }),
        customMessage: z.string().optional(),
      })
    ),
    defaultValues: {
      emailAddress: "",
      customMessage: "",
    },
  });

  const emailMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", `/api/invoices/${selectedInvoice?.id}/send-email`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
      setEmailDialogOpen(false);
      emailForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = (data: any) => {
    emailMutation.mutate(data);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleExportInvoice = (invoice: any) => {
    exportToPDF(invoice, "invoice");
  };

  const handleEmailInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEmailDialogOpen(true);
  };

  const handleProcessPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    setPaymentDialogOpen(false);
    setSelectedInvoice(null);
    toast({
      title: "Payment Processed",
      description: "Payment has been processed successfully and invoice has been marked as paid.",
    });
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Create a new invoice for an existing customer or add a new customer
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Customer Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Customer Information</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewCustomer(!showNewCustomer)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {showNewCustomer ? "Select Existing" : "Add New Customer"}
                          </Button>
                        </div>

                        {!showNewCustomer ? (
                          <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Customer</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a customer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {(customers as any[])?.map((customer: any) => (
                                      <SelectItem key={customer.id} value={customer.id.toString()}>
                                        {customer.firstName} {customer.lastName}
                                        {customer.email && (
                                          <span className="text-muted-foreground"> - {customer.email}</span>
                                        )}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                            <FormField
                              control={form.control}
                              name="newCustomer.firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="newCustomer.lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Smith" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="newCustomer.email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="john@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="newCustomer.phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="(555) 123-4567" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="newCustomer.address"
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Customer address" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Invoice Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="orderId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related Order (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select order" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(orders as any[])?.map((order: any) => (
                                    <SelectItem key={order.id} value={order.id.toString()}>
                                      {order.orderNumber} - {order.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Invoice Items */}
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Invoice Items</Label>
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground">
                            <div>Description</div>
                            <div>Quantity</div>
                            <div>Unit Price</div>
                            <div>Total</div>
                            <div>Actions</div>
                          </div>

                          {form.watch("items").map((item, index) => (
                            <div key={index} className="grid grid-cols-5 gap-2 items-end">
                              <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="Frame labor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="1"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          setTimeout(() => calculateItemTotal(index), 100);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          setTimeout(() => calculateItemTotal(index), 100);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.total`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        disabled
                                        placeholder="$0.00"
                                        value={`$${field.value}`}
                                        className="bg-muted"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-1">
                                {form.watch("items").length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addItem}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="taxAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax Amount ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="discountAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discount Amount ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex flex-col justify-end space-y-2 text-right">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${calculateSubtotal().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${parseFloat(form.watch("taxAmount") || "0").toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>-${parseFloat(form.watch("discountAmount") || "0").toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Additional notes for this invoice" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={createInvoiceMutation.isPending}>
                          Create Invoice
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCreateDialogOpen(false);
                            setShowNewCustomer(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
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
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="Download PDF"
                                  onClick={() => handleExportPDF(invoice)}
                                >
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

        <PaymentDialog
          invoice={selectedInvoiceForPayment}
          open={!!selectedInvoiceForPayment}
          onOpenChange={(open) => !open && setSelectedInvoiceForPayment(null)}
        />
      </div>

      {/* Email Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Invoice via Email</DialogTitle>
                </DialogHeader>

                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="emailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="customer@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="customMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add a personal message..." 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={emailMutation.isPending}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invoice
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEmailDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Payment Processing Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Process Payment</DialogTitle>
                </DialogHeader>

                {selectedInvoice && (
                  <StripePayment
                    invoiceId={selectedInvoice.id}
                    amount={parseFloat(selectedInvoice.totalAmount)}
                    customerName={`${selectedInvoice.order?.customer?.firstName || ''} ${selectedInvoice.order?.customer?.lastName || ''}`.trim()}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setPaymentDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
    </div>
  );
}