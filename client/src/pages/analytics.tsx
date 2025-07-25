import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, Calendar, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const isLoading = ordersLoading || customersLoading || metricsLoading;

  // Process data for charts
  const processOrdersData = () => {
    if (!orders || !Array.isArray(orders)) return { monthlyData: [], statusData: [], revenueData: [], productivityData: [] };

    // Monthly revenue data
    const monthlyRevenue = orders.reduce((acc: any, order: any) => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + parseFloat(order.totalAmount);
      return acc;
    }, {});

    const monthlyData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
      orders: orders.filter((o: any) => {
        const orderMonth = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return orderMonth === month;
      }).length
    }));

    // Order status distribution
    const statusCounts = orders.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: getStatusColor(status)
    }));

    // Revenue by frame style
    const frameRevenue = orders.reduce((acc: any, order: any) => {
      const frame = order.frameStyle || 'Other';
      acc[frame] = (acc[frame] || 0) + parseFloat(order.totalAmount);
      return acc;
    }, {});

    const revenueData = Object.entries(frameRevenue)
      .map(([frame, revenue]) => ({ frame, revenue }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 8);

    // Productivity metrics (orders by day of week)
    const dayOfWeekCounts = orders.reduce((acc: any, order: any) => {
      const day = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const productivityData = daysOrder.map(day => ({
      day,
      orders: dayOfWeekCounts[day] || 0
    }));

    return { monthlyData, statusData, revenueData, productivityData };
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: '#f59e0b',
      measuring: '#3b82f6',
      production: '#8b5cf6',
      quality_check: '#06b6d4',
      ready: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const { monthlyData, statusData, revenueData, productivityData } = processOrdersData();

  const calculateGrowthRate = () => {
    if (monthlyData.length < 2) return 0;
    const current = monthlyData[monthlyData.length - 1]?.revenue || 0;
    const previous = monthlyData[monthlyData.length - 2]?.revenue || 0;
    return previous > 0 ? ((current - previous) / previous * 100) : 0;
  };

  const growthRate = calculateGrowthRate();

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl">
                  Business Analytics
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comprehensive insights into your framing business performance
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-32 rounded-lg" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <DollarSign className="h-8 w-8 text-green-500" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                            <p className="text-2xl font-bold text-foreground">
                              ${((metrics as any)?.monthlyRevenue)?.toFixed(2) || '0.00'}
                            </p>
                            <div className="flex items-center mt-1">
                              {growthRate >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className={`text-sm ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {Math.abs(growthRate).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ShoppingBag className="h-8 w-8 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                            <p className="text-2xl font-bold text-foreground">
                              {((metrics as any)?.activeOrders) || 0}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {Array.isArray(orders) ? orders.length : 0} total orders
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Users className="h-8 w-8 text-purple-500" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                            <p className="text-2xl font-bold text-foreground">
                              {Array.isArray(customers) ? customers.length : 0}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              ${((metrics as any)?.averageOrderValue)?.toFixed(2) || '0.00'} avg order
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Clock className="h-8 w-8 text-orange-500" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-muted-foreground">Avg Turnaround</p>
                            <p className="text-2xl font-bold text-foreground">7.2</p>
                            <p className="text-sm text-muted-foreground mt-1">days</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Monthly Revenue Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Revenue Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#revenueGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Order Status Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Frame Style */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by Frame Style</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={revenueData} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="frame" type="category" width={100} />
                            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Daily Productivity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Weekly Order Pattern</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={productivityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="orders" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}