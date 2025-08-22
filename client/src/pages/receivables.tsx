import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2
} from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  description: string;
  totalAmount: string;
  depositAmount: string | null;
  balanceAmount: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function Receivables() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch('/api/receivables/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to record payment');
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setSelectedOrder(null);
      toast({
        title: "Payment Recorded",
        description: data.message,
        variant: data.paidInFull ? "default" : "default",
      });
    },
    onError: (error: any) => {
      console.error("Payment recording error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (reminderData: any) => {
      const response = await fetch('/api/receivables/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reminderData)
      });
      if (!response.ok) throw new Error('Failed to send reminder');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Sent",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  });

  const handleRecordPayment = (order: any) => {
    setSelectedOrder(order);
    // Use the corrected balance amount for payment
    const actualBalance = parseFloat(order.totalAmount) - (parseFloat(order.depositAmount) || 0);
    setPaymentAmount(actualBalance.toString());
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = () => {
    if (!selectedOrder || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Payment",
        description: "Please enter a valid payment amount greater than $0.",
        variant: "destructive",
      });
      return;
    }
    
    recordPaymentMutation.mutate({
      orderId: selectedOrder.id,
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod,
      notes: `Payment recorded for order ${selectedOrder.orderNumber}`
    });
  };

  const handleSendReminder = (order: any, method: string) => {
    sendReminderMutation.mutate({
      orderId: order.id,
      method
    });
  };

  // Calculate receivables data - match metrics service logic
  const receivablesData = orders
    .map((order: Order) => {
      const customer = customers.find((c: any) => c.id === order.customerId);
      const totalAmount = parseFloat(order.totalAmount);
      const depositAmount = order.depositAmount ? parseFloat(order.depositAmount) : 0;
      
      // Calculate CORRECT balance: total - deposit = what customer owes
      const actualBalance = totalAmount - depositAmount;
      
      // Only include orders with outstanding balances (exclude cancelled only)
      if (actualBalance <= 0 || order.status === 'cancelled') {
        return null;
      }

      const daysPastDue = order.dueDate 
        ? Math.floor((new Date().getTime() - new Date(order.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const daysOld = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...order,
        customer,
        balanceAmount: actualBalance, // Use corrected balance
        totalAmount,
        depositAmount,
        daysPastDue,
        daysOld,
        urgencyLevel: daysPastDue > 30 ? 'critical' : daysPastDue > 14 ? 'high' : daysPastDue > 7 ? 'medium' : 'normal'
      };
    })
    .filter(Boolean)
    .filter((order: any) => {
      if (!order) return false;
      
      const matchesSearch = !searchTerm || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.customer?.firstName} ${order.customer?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'overdue' && order.daysPastDue > 0) ||
        (filterStatus === 'critical' && order.urgencyLevel === 'critical') ||
        (filterStatus === 'recent' && order.daysOld <= 7);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'amount':
          return b.balanceAmount - a.balanceAmount;
        case 'dueDate':
          return b.daysPastDue - a.daysPastDue;
        case 'customer':
          return `${a.customer?.firstName} ${a.customer?.lastName}`.localeCompare(`${b.customer?.firstName} ${b.customer?.lastName}`);
        default:
          return b.daysPastDue - a.daysPastDue;
      }
    });

  // Summary calculations
  const totalOutstanding = receivablesData.reduce((sum: number, order: any) => sum + order.balanceAmount, 0);
  const overdueAmount = receivablesData.filter((order: any) => order.daysPastDue > 0).reduce((sum: number, order: any) => sum + order.balanceAmount, 0);
  const criticalAmount = receivablesData.filter((order: any) => order.urgencyLevel === 'critical').reduce((sum: number, order: any) => sum + order.balanceAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Clock className="h-4 w-4" />;
      case 'medium': return <Calendar className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading receivables...</div>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Accounts Receivable</h1>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(overdueAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critical (30+ days)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(criticalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold">{receivablesData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Accounts</option>
                <option value="overdue">Overdue Only</option>
                <option value="critical">Critical (30+ days)</option>
                <option value="recent">Recent Orders</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="customer">Sort by Customer</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receivables List */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {receivablesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No outstanding receivables found.
            </div>
          ) : (
            <div className="space-y-4">
              {receivablesData.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={getUrgencyColor(order.urgencyLevel)}>
                          {getUrgencyIcon(order.urgencyLevel)}
                          <span className="ml-1">{order.urgencyLevel.toUpperCase()}</span>
                        </Badge>
                        <span className="font-semibold">{order.orderNumber}</span>
                        <span className="text-muted-foreground">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Order:</span>
                          <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Paid:</span>
                          <div className="font-medium text-green-600">{formatCurrency(order.depositAmount)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Outstanding:</span>
                          <div className="font-bold text-red-600">{formatCurrency(order.balanceAmount)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Old:</span>
                          <div className="font-medium">
                            {order.daysPastDue > 0 ? `${order.daysPastDue} days overdue` : `${order.daysOld} days`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2">
                      {order.customer?.phone && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleSendReminder(order, 'sms')}
                          disabled={sendReminderMutation.isPending}
                          data-testid={`button-call-${order.id}`}
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                      {order.customer?.email && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleSendReminder(order, 'email')}
                          disabled={sendReminderMutation.isPending}
                          data-testid={`button-email-${order.id}`}
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleRecordPayment(order)}
                        data-testid={`button-payment-${order.id}`}
                      >
                        <DollarSign className="h-4 w-4" />
                        Record Payment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Recording Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{selectedOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                </p>
                <p className="text-lg font-bold text-red-600">
                  Outstanding: {formatCurrency(selectedOrder.balanceAmount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  data-testid="input-payment-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitPayment}
                  disabled={!paymentAmount || recordPaymentMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-payment"
                >
                  {recordPaymentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      Recording...
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}