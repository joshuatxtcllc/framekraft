import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Edit, Search, Filter, Eye, FileText, Printer, Mail, X, CreditCard, DollarSign, MoreVertical } from "lucide-react";
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
  artworkImage?: string;
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
    setIsViewDialogOpen(true);
  };

  const handlePayBalance = (order: any) => {
    const balanceAmount = parseFloat(order.totalAmount) - parseFloat(order.depositAmount || "0");
    if (confirm(`Mark balance of $${balanceAmount.toFixed(2)} as paid for order ${order.orderNumber}?`)) {
      fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: order.customer?._id || order.customer?.id || order.customerId,
          orderNumber: order.orderNumber,
          description: order.description,
          artworkDescription: order.artworkDescription,
          artworkImage: order.artworkImage,
          dimensions: order.dimensions,
          frameStyle: order.frameStyle,
          matColor: order.matColor,
          glazing: order.glazing,
          totalAmount: parseFloat(order.totalAmount),
          depositAmount: parseFloat(order.totalAmount),
          discountPercentage: parseFloat(order.discountPercentage || "0"),
          status: order.status === "ready" ? "completed" : order.status,
          priority: order.priority,
          dueDate: order.dueDate,
          notes: order.notes,
        }),
      }).then(() => {
        toast({
          title: "Payment Recorded",
          description: `Balance of $${balanceAmount.toFixed(2)} marked as paid for order ${order.orderNumber}`,
        });
        window.location.reload();
      });
    }
  };

  const handlePaidInFull = (order: any) => {
    if (confirm(`Mark order ${order.orderNumber} as paid in full ($${parseFloat(order.totalAmount).toFixed(2)})?`)) {
      fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: order.customer?._id || order.customer?.id || order.customerId,
          orderNumber: order.orderNumber,
          description: order.description,
          artworkDescription: order.artworkDescription,
          artworkImage: order.artworkImage,
          dimensions: order.dimensions,
          frameStyle: order.frameStyle,
          matColor: order.matColor,
          glazing: order.glazing,
          totalAmount: parseFloat(order.totalAmount),
          depositAmount: parseFloat(order.totalAmount),
          discountPercentage: parseFloat(order.discountPercentage || "0"),
          status: "completed",
          priority: order.priority,
          dueDate: order.dueDate,
          notes: order.notes,
        }),
      }).then(() => {
        toast({
          title: "Payment Recorded",
          description: `Order ${order.orderNumber} marked as paid in full and completed`,
        });
        window.location.reload();
      });
    }
  };

  // Generate and download invoice PDF
  const handleGenerateInvoice = onGenerateInvoice || (async (order: Order) => {
    try {
      const invoiceData = {
        orderNumber: order.orderNumber,
        customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'No customer',
        customerEmail: order.customer?.email || '',
        customerPhone: order.customer?.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        artworkImage: order.artworkImage || '',
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
        customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'No customer',
        customerEmail: order.customer?.email || '',
        customerPhone: order.customer?.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        artworkImage: order.artworkImage || '',
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
        customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'No customer',
        customerEmail: order.customer?.email || '',
        customerPhone: order.customer?.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        artworkImage: order.artworkImage || '',
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
    if (!order.customer?.email) {
      toast({
        title: "No Email Address",
        description: "Customer has no email address on file.",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link with invoice details
    const subject = `Invoice ${order.orderNumber} - ${order.description}`;
    const body = `Dear ${order.customer?.firstName || 'Customer'} ${order.customer?.lastName || ''},

Please find attached your invoice for order ${order.orderNumber}.

Order Details:
- Description: ${order.description}
- Total Amount: $${parseFloat(order.totalAmount).toFixed(2)}
${order.depositAmount ? `- Deposit: $${parseFloat(order.depositAmount).toFixed(2)}` : ''}

Thank you for your business!

Best regards,
FrameCraft`;

    const mailtoLink = `mailto:${order.customer?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    toast({
      title: "Email Client Opened",
      description: `Email client opened for ${order.customer?.email}`,
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
      (order.customer ? `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
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
        <div className="flex flex-col gap-4 pt-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order #</TableHead>
                  <TableHead className="hidden sm:table-cell">Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Priority</TableHead>
                  <TableHead className="hidden xl:table-cell">Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">{order.orderNumber}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'No customer'}
                        </span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {order.description.substring(0, 30)}{order.description.length > 30 ? '...' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="truncate max-w-[120px]" title={order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'No customer'}>
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'No customer'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="truncate max-w-[180px]" title={order.description}>
                        {order.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getPriorityBadge(order.priority)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {order.dueDate ? (
                        <span className={new Date(order.dueDate) < new Date() ? 'text-red-600 font-medium text-sm' : 'text-sm'}>
                          {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-right sm:text-left">
                        <div className="font-medium text-sm">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        {order.depositAmount && parseFloat(order.depositAmount) > 0 && (
                          <div className="text-xs space-y-0.5 hidden sm:block">
                            <div className="text-muted-foreground">
                              Dep: {formatCurrency(order.depositAmount)}
                            </div>
                            <div className="text-red-600 font-medium">
                              Bal: {formatCurrency((parseFloat(order.totalAmount) - parseFloat(order.depositAmount)).toString())}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewOrder(order)}
                          title="View Details"
                          className="h-8 w-8 hidden sm:inline-flex"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(order)}
                          title="Edit Order"
                          className="h-8 w-8 hidden sm:inline-flex"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateWorkOrder(order)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Work Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintInvoice(order)}>
                              <Printer className="w-4 h-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            {order.customer?.email && (
                              <DropdownMenuItem onClick={() => handleEmailInvoice(order)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Email Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.status !== 'completed' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => onProcessPayment?.(order)}
                                  className="text-green-600"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Process Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handlePaidInFull(order)}
                                  className="text-green-600"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Mark Paid in Full
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.depositAmount && parseFloat(order.depositAmount) > 0 && parseFloat(order.depositAmount) < parseFloat(order.totalAmount) && (
                              <DropdownMenuItem 
                                onClick={() => handlePayBalance(order)}
                                className="text-blue-600"
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pay Balance (${(parseFloat(order.totalAmount) - parseFloat(order.depositAmount)).toFixed(2)})
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <DialogTitle>
              Order Details - {selectedOrder?.orderNumber}
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
                    <p className="font-medium">{selectedOrder.customer ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : 'No customer'}</p>
                  </div>
                  {selectedOrder.customer?.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{selectedOrder.customer?.email}</p>
                    </div>
                  )}
                  {selectedOrder.customer?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="font-medium">{selectedOrder.customer?.phone}</p>
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
                  {selectedOrder.artworkImage && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Artwork Image</label>
                      <div className="mt-2">
                        <img 
                          src={selectedOrder.artworkImage} 
                          alt="Artwork" 
                          className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
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