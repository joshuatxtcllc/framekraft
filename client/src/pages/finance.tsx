
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CreditCard, 
  AlertCircle,
  Plus,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import PaymentDialog from "@/components/payments/PaymentDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function Finance() {
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: '',
    vendor: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [dateRange, setDateRange] = useState('current_month');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
    initialData: []
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    initialData: []
  });

  const { data: financialData } = useQuery({
    queryKey: ["/api/finance/summary"],
    queryFn: async () => {
      const response = await fetch('/api/finance/summary');
      if (!response.ok) throw new Error('Failed to fetch financial data');
      return response.json();
    }
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/finance/expenses"],
    queryFn: async () => {
      const response = await fetch('/api/finance/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/finance/transactions"],
    queryFn: async () => {
      const response = await fetch('/api/finance/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (!response.ok) throw new Error('Failed to create expense');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Expense added successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/summary'] });
      setShowExpenseDialog(false);
      setExpenseForm({
        category: '',
        amount: '',
        description: '',
        vendor: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    },
    onError: () => {
      toast({ title: 'Failed to add expense', variant: 'destructive' });
    }
  });

  // Calculate financial metrics with date filtering
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (dateRange) {
      case 'current_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last_3_months':
        startDate = subMonths(now, 3);
        break;
      case 'year_to_date':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    const filterByDate = (item: any) => {
      const itemDate = new Date(item.createdAt || item.date);
      return isWithinInterval(itemDate, { start: startDate, end: endDate });
    };

    const filteredInvoices = dateRange === 'all_time' ? invoices : invoices.filter(filterByDate);
    const filteredExpenses = dateRange === 'all_time' ? expenses : expenses.filter(filterByDate);
    const filteredOrders = dateRange === 'all_time' ? orders : orders.filter(filterByDate);

    return {
      invoices: filteredInvoices,
      expenses: filteredExpenses,
      orders: filteredOrders
    };
  }, [invoices, expenses, orders, dateRange]);

  // Calculate metrics - use summary data from backend when available
  const metrics = useMemo(() => {
    // If we have financial summary data from backend, use it for primary metrics
    if (financialData?.currentMonthSummary && dateRange === 'current_month') {
      const summary = financialData.currentMonthSummary;
      
      // Get additional details from local data
      const paidInvoices = filteredData.invoices.filter((invoice: any) => invoice.status === 'paid');
      const unpaidInvoices = filteredData.invoices.filter((invoice: any) => 
        invoice.status === 'sent' || invoice.status === 'pending'
      );
      
      const pendingOrders = filteredData.orders.filter((order: any) => 
        ['pending', 'measuring', 'designing', 'cutting', 'assembly'].includes(order.status)
      );
      
      const projectedRevenue = pendingOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0
      );
      
      // Calculate outstanding (total of all orders minus what's been collected)
      const totalOrderValue = filteredData.orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0
      );
      
      return {
        totalRevenue: summary.revenue || 0,
        paidAmount: summary.revenue || 0,
        outstandingAmount: totalOrderValue - (summary.revenue || 0),
        totalExpenses: summary.expenses || 0,
        netProfit: summary.netProfit || 0,
        profitMargin: summary.revenue > 0 ? (summary.netProfit / summary.revenue) * 100 : 0,
        projectedRevenue,
        paidInvoices,
        unpaidInvoices,
        pendingOrders,
        completedOrders: [],
        ordersWithDeposit: []
      };
    }
    
    // Fallback to local calculation for other date ranges
    const completedOrders = filteredData.orders.filter((order: any) => 
      order.status === 'completed'
    );
    
    const ordersWithDeposit = filteredData.orders.filter((order: any) => 
      parseFloat(order.depositAmount || 0) > 0
    );
    
    // Revenue from completed orders
    const completedRevenue = completedOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.totalAmount || 0), 0
    );
    
    // Revenue from deposits on all orders
    const depositRevenue = ordersWithDeposit.reduce((sum: number, order: any) => 
      sum + parseFloat(order.depositAmount || 0), 0
    );
    
    // Use completed revenue plus deposits as total collected revenue
    const paidAmount = completedRevenue + depositRevenue;
    
    const totalRevenue = filteredData.orders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.totalAmount || 0), 0
    );
    
    const paidInvoices = filteredData.invoices.filter((invoice: any) => invoice.status === 'paid');
    const unpaidInvoices = filteredData.invoices.filter((invoice: any) => 
      invoice.status === 'sent' || invoice.status === 'pending'
    );
    
    const outstandingAmount = totalRevenue - paidAmount;

    const totalExpenses = filteredData.expenses.reduce((sum: number, expense: any) => 
      sum + parseFloat(expense.amount || 0), 0
    );

    const netProfit = paidAmount - totalExpenses;
    const profitMargin = paidAmount > 0 ? (netProfit / paidAmount) * 100 : 0;

    const pendingOrders = filteredData.orders.filter((order: any) => 
      ['pending', 'measuring', 'designing', 'cutting', 'assembly'].includes(order.status)
    );

    const projectedRevenue = pendingOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.totalAmount || 0), 0
    );

    return {
      totalRevenue,
      paidAmount,
      outstandingAmount,
      totalExpenses,
      netProfit,
      profitMargin,
      projectedRevenue,
      paidInvoices,
      unpaidInvoices,
      pendingOrders,
      completedOrders,
      ordersWithDeposit
    };
  }, [filteredData, financialData, dateRange]);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
                    Financial Overview
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track revenue, invoices, and financial performance
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="flex justify-end mb-6">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    <SelectItem value="year_to_date">Year to Date</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${metrics.paidAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.paidInvoices.length} paid invoices
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${metrics.totalExpenses.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {filteredData.expenses.length} expenses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    {metrics.netProfit >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(metrics.netProfit).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.profitMargin.toFixed(1)}% margin
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      ${metrics.outstandingAmount.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.unpaidInvoices.length} pending
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly revenue over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {financialData?.revenueChart ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={financialData.revenueChart}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                              <Line 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                dot={{ fill: '#10b981' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="expenses" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                dot={{ fill: '#ef4444' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Expense Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                        <CardDescription>Expenses by category</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {financialData?.expenseBreakdown && financialData.expenseBreakdown.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <RePieChart>
                              <Pie
                                data={financialData.expenseBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.name}: $${entry.value.toFixed(0)}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {financialData.expenseBreakdown.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={[
                                    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'
                                  ][index % 5]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                            </RePieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No expenses recorded
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cash Flow Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Summary</CardTitle>
                      <CardDescription>Income vs Expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Total Income</p>
                            <p className="text-2xl font-bold text-green-600">
                              ${metrics.paidAmount.toFixed(2)}
                            </p>
                          </div>
                          <ArrowUpRight className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">
                              ${metrics.totalExpenses.toFixed(2)}
                            </p>
                          </div>
                          <ArrowDownRight className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-medium">Net Cash Flow</p>
                            <p className={`text-2xl font-bold ${
                              metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {metrics.netProfit >= 0 ? '+' : '-'}${Math.abs(metrics.netProfit).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>All financial transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {transactions.length > 0 ? (
                          transactions.map((transaction: any) => (
                            <div key={transaction._id || transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                {transaction.type === 'income' ? (
                                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                                )}
                                <div>
                                  <p className="font-medium">{transaction.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className={`text-lg font-semibold ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No transactions recorded
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Expense Management</CardTitle>
                          <CardDescription>Track and manage business expenses</CardDescription>
                        </div>
                        <Button onClick={() => setShowExpenseDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Expense
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {filteredData.expenses.length > 0 ? (
                          filteredData.expenses.map((expense: any) => (
                            <div key={expense.id || expense._id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{expense.description}</p>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                  <span>{expense.category}</span>
                                  {expense.vendor && <span>• {expense.vendor}</span>}
                                  <span>• {format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <div className="text-lg font-semibold text-red-600">
                                -${parseFloat(expense.amount).toFixed(2)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No expenses recorded. Click "Add Expense" to start tracking.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="invoices" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Invoice Management</CardTitle>
                      <CardDescription>Track invoice status and payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredData.invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No invoices found. Create your first invoice from an order.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredData.invoices.slice(0, 10).map((invoice: any) => (
                            <div key={invoice.id || invoice._id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-medium">Invoice #{invoice.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <div className="font-semibold">${parseFloat(invoice.totalAmount || 0).toFixed(2)}</div>
                                  <Badge 
                                    variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                    className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                                  >
                                    {invoice.status}
                                  </Badge>
                                </div>
                                {invoice.status !== 'paid' && (
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedInvoiceForPayment(invoice)}
                                    className="shrink-0"
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Reports</CardTitle>
                      <CardDescription>Generate and export financial reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col">
                          <FileText className="w-6 h-6 mb-2" />
                          Monthly P&L Statement
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col">
                          <CreditCard className="w-6 h-6 mb-2" />
                          Payment Summary
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col">
                          <TrendingUp className="w-6 h-6 mb-2" />
                          Revenue Trends
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col">
                          <AlertCircle className="w-6 h-6 mb-2" />
                          Outstanding Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      <PaymentDialog
        invoice={selectedInvoiceForPayment}
        open={!!selectedInvoiceForPayment}
        onOpenChange={(open) => !open && setSelectedInvoiceForPayment(null)}
      />

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record a new business expense
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="salaries">Salaries</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="office_supplies">Office Supplies</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-vendor">Vendor</Label>
              <Input
                id="expense-vendor"
                placeholder="Vendor name (optional)"
                value={expenseForm.vendor}
                onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-description">Description</Label>
              <Textarea
                id="expense-description"
                placeholder="Describe the expense..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (expenseForm.category && expenseForm.amount && expenseForm.description) {
                    createExpenseMutation.mutate({
                      ...expenseForm,
                      amount: parseFloat(expenseForm.amount)
                    });
                  } else {
                    toast({ 
                      title: 'Please fill in required fields', 
                      variant: 'destructive' 
                    });
                  }
                }}
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
