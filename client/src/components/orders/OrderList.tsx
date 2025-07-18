import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Search, Filter, Eye, FileText, Printer, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: number;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  description: string;
  totalAmount: string;
  depositAmount?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
}

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onEdit: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onGenerateWorkOrder?: (order: Order) => void;
  onPrintInvoice?: (order: Order) => void;
  onEmailInvoice?: (order: Order) => void;
}

export default function OrderList({ 
  orders, 
  isLoading, 
  onEdit,
  onGenerateInvoice,
  onGenerateWorkOrder,
  onPrintInvoice,
  onEmailInvoice
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Default handlers if not provided
  const handleGenerateInvoice = onGenerateInvoice || ((order: Order) => {
    console.log("Generate invoice for order:", order.orderNumber);
  });

  const handleGenerateWorkOrder = onGenerateWorkOrder || ((order: Order) => {
    console.log("Generate work order for order:", order.orderNumber);
  });

  const handlePrintInvoice = onPrintInvoice || ((order: Order) => {
    console.log("Print invoice for order:", order.orderNumber);
  });

  const handleEmailInvoice = onEmailInvoice || ((order: Order) => {
    console.log("Email invoice for order:", order.orderNumber);
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
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
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(order.priority)}
                    </TableCell>
                    <TableCell>
                      {order.dueDate ? formatDate(order.dueDate) : "-"}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt)}
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
  );
}