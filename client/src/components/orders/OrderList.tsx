import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Search, Filter, Eye, FileText, Printer, Mail, X, CreditCard, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/lib/pdfExport";
import { printOrderInvoice } from "@/lib/printUtils";

interface Order {
  id: number;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  description: string;
  artworkDescription?: string;
  dimensions?: string;
  frameStyle?: string;
  matColor?: string;
  glazing?: string;
  totalAmount: string;
  depositAmount?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  notes?: string;
}

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onEdit: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onGenerateWorkOrder?: (order: Order) => void;
  onPrintInvoice?: (order: Order) => void;
  onEmailInvoice?: (order: Order) => void;
  onProcessPayment?: (order: Order) => void;
  onPayBalance?: (order: Order) => void;
}

export default function OrderList({ 
  orders, 
  isLoading, 
  onEdit,
  onGenerateInvoice,
  onGenerateWorkOrder,
  onPrintInvoice,
  onEmailInvoice,
  onProcessPayment,
  onPayBalance
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
  };

  const handlePayBalance = (order: any) => {
    const balanceAmount = parseFloat(order.totalAmount) - parseFloat(order.depositAmount || "0");
    if (confirm(`Mark balance of $${balanceAmount.toFixed(2)} as paid for order ${order.orderNumber}?`)) {
      // Update order to mark balance as paid
      fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...order,
          depositAmount: order.totalAmount,
          status: order.status === "ready" ? "completed" : order.status,
        }),
      }).then(() => {
        // Refresh orders list
        window.location.reload();
      });
    }
  };

  // Generate and download invoice PDF
  const handleGenerateInvoice = onGenerateInvoice || (async (order: Order) => {
    try {
      const invoiceData = {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email || '',
        customerPhone: order.customer.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        dimensions: order.dimensions || '',
        frameStyle: order.frameStyle || '',
        matColor: order.matColor || '',
        glazing: order.glazing || '',
        totalAmount: parseFloat(order.totalAmount),
        depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : 0,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate || '',
        createdAt: order.createdAt,
        notes: order.notes || ''
      };

      await exportToPDF(invoiceData, 'invoice');
      toast({
        title: "Invoice Generated",
        description: `Invoice for order ${order.orderNumber} has been downloaded.`,
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice PDF.",
        variant: "destructive",
      });
    }
  });

  // Generate and download work order PDF
  const handleGenerateWorkOrder = onGenerateWorkOrder || (async (order: Order) => {
    try {
      const workOrderData = {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email || '',
        customerPhone: order.customer.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        dimensions: order.dimensions || '',
        frameStyle: order.frameStyle || '',
        matColor: order.matColor || '',
        glazing: order.glazing || '',
        totalAmount: parseFloat(order.totalAmount),
        depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : 0,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate || '',
        createdAt: order.createdAt,
        notes: order.notes || ''
      };

      await exportToPDF(workOrderData, 'work-order');
      toast({
        title: "Work Order Generated",
        description: `Work order for ${order.orderNumber} has been downloaded.`,
      });
    } catch (error) {
      console.error('Work order generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate work order PDF.",
        variant: "destructive",
      });
    }
  });

  // Print invoice
  const handlePrintInvoice = onPrintInvoice || ((order: Order) => {
    try {
      const invoiceData = {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email || '',
        customerPhone: order.customer.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        dimensions: order.dimensions || '',
        frameStyle: order.frameStyle || '',
        matColor: order.matColor || '',
        glazing: order.glazing || '',
        totalAmount: parseFloat(order.totalAmount),
        depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : 0,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate || '',
        createdAt: order.createdAt,
        notes: order.notes || ''
      };

      // Open print window with specific order invoice
      printOrderInvoice(invoiceData);

      toast({
        title: "Print Window Opened",
        description: `Invoice for order ${order.orderNumber} opened in new window for printing.`,
      });
    } catch (error) {
      console.error('Print preparation error:', error);
      toast({
        title: "Error",
        description: "Failed to prepare invoice for printing.",
        variant: "destructive",
      });
    }
  });

  // Email invoice
  const handleEmailInvoice = onEmailInvoice || ((order: Order) => {
    if (!order.customer.email) {
      toast({
        title: "No Email Address",
        description: "Customer has no email address on file.",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link with invoice details
    const subject = `Invoice ${order.orderNumber} - ${order.description}`;
    const body = `Dear ${order.customer.firstName} ${order.customer.lastName},

Please find attached your invoice for order ${order.orderNumber}.

Order Details:
- Description: ${order.description}
- Total Amount: $${parseFloat(order.totalAmount).toFixed(2)}
${order.depositAmount ? `- Deposit: $${parseFloat(order.depositAmount).toFixed(2)}` : ''}

Thank you for your business!

Best regards,
FrameCraft`;

    const mailtoLink = `mailto:${order.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    toast({
      title: "Email Client Opened",
      description: `Email client opened for ${order.customer.email}`,
    });
  });

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "order-status-pending" },
      measuring: { label: "Measuring", className: "order-status-pending" },
      production: { label: "In Progress", className: "order-status-production" },
      ready: { label: "Ready", className: "order-status-ready" },
      completed: { label: "Completed", className: "order-status-completed" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "order-status-pending"
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Low", className: "bg-gray-100 text-gray-800" },
      normal: { label: "Normal", className: "bg-blue-100 text-blue-800" },
      high: { label: "High", className: "bg-orange-100 text-orange-800" },
      rush: { label: "Rush", className: "bg-red-100 text-red-800" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      className: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={`${config.className} px-2 py-1 rounded-full text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "measuring", label: "Measuring" },
    { value: "production", label: "Production" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "rush", label: "Rush" },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders ({orders.length})</CardTitle>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.customer.firstName} {order.customer.lastName}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={order.description}>
                        {order.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(order.priority)}
                    </TableCell>
                    <TableCell>
                      {order.dueDate ? (
                        <span className={new Date(order.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                          {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        {order.depositAmount && parseFloat(order.depositAmount) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Deposit: {formatCurrency(order.depositAmount)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(order)}
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateInvoice(order)}
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateWorkOrder(order)}
                          title="Generate Work Order"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintInvoice(order)}
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEmailInvoice(order)}
                          title="Email Invoice"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                         {order.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onProcessPayment?.(order)}
                            title="Process Payment"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                        {order.depositAmount && parseFloat(order.depositAmount) > 0 && parseFloat(order.depositAmount) < parseFloat(order.totalAmount) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPayBalance?.(order)}
                            title="Pay Remaining Balance"
                            className="text-blue-600 hover:text-blue-700"
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

      {/* Order Details Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Order Details - {selectedOrder?.orderNumber}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="font-medium">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                  </div>
                  {selectedOrder.customer.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{selectedOrder.customer.email}</p>
                    </div>
                  )}
                  {selectedOrder.customer.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="font-medium">{selectedOrder.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <div className="mt-1">{getPriorityBadge(selectedOrder.priority)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  {selectedOrder.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="font-medium">{formatDate(selectedOrder.dueDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="font-medium">{selectedOrder.description}</p>
                  </div>
                  {selectedOrder.artworkDescription && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Artwork Description</label>
                      <p className="font-medium">{selectedOrder.artworkDescription}</p>
                    </div>
                  )}
                  {selectedOrder.dimensions && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dimensions</label>
                      <p className="font-medium">{selectedOrder.dimensions}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    {selectedOrder.frameStyle && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Frame Style</label>
                        <p className="font-medium">{selectedOrder.frameStyle}</p>
                      </div>
                    )}
                    {selectedOrder.matColor && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mat Color</label>
                        <p className="font-medium">{selectedOrder.matColor}</p>
                      </div>
                    )}
                    {selectedOrder.glazing && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Glazing</label>
                        <p className="font-medium">{selectedOrder.glazing}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  {selectedOrder.depositAmount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Deposit Amount</label>
                      <p className="font-medium">{formatCurrency(selectedOrder.depositAmount)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="bg-gray-50 p-3 rounded-md">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  onClick={() => onEdit(selectedOrder)} 
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleGenerateInvoice(selectedOrder)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleGenerateWorkOrder(selectedOrder)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Work Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                {selectedOrder.customer.email && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleEmailInvoice(selectedOrder)}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Invoice
                  </Button>
                )}
                {selectedOrder.depositAmount && parseFloat(selectedOrder.depositAmount) > 0 && parseFloat(selectedOrder.depositAmount) < parseFloat(selectedOrder.totalAmount) && (
                  <Button 
                    variant="outline" 
                    onClick={() => onPayBalance?.(selectedOrder)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <DollarSign className="w-4 h-4" />
                    Pay Balance
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}