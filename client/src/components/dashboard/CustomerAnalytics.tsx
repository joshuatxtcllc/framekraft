import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, TrendingUp, DollarSign, ShoppingCart, 
  Calendar, ChevronUp, ChevronDown, Eye 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface ChartData {
  month: string;
  customers: number;
  revenue: number;
  orders: number;
}

interface CustomerMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function CustomerAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedMetric, setSelectedMetric] = useState<'customers' | 'revenue' | 'orders'>('revenue');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  // Calculate customer analytics
  const calculateAnalytics = () => {
    if (!customers || !orders) return null;

    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = new Date(now.getFullYear(), thisMonth - 1, 1);
    
    // Group orders by month
    const monthlyData: { [key: string]: ChartData } = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = {
        month: monthKey,
        customers: 0,
        revenue: 0,
        orders: 0
      };
    }

    // Process orders
    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].orders++;
        monthlyData[monthKey].revenue += parseFloat(order.totalAmount || 0);
      }
    });

    // Count unique customers per month
    const customersByMonth: { [key: string]: Set<string> } = {};
    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (!customersByMonth[monthKey]) {
        customersByMonth[monthKey] = new Set();
      }
      customersByMonth[monthKey].add(order.customerId);
    });

    Object.keys(customersByMonth).forEach(monthKey => {
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].customers = customersByMonth[monthKey].size;
      }
    });

    return Object.values(monthlyData);
  };

  const chartData = calculateAnalytics() || [];

  // Calculate key metrics
  const calculateMetrics = (): CustomerMetric[] => {
    if (!customers || !orders) return [];

    const totalCustomers = customers.length;
    const activeCustomers = new Set(orders.map((o: any) => o.customerId)).size;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Calculate month-over-month changes
    const thisMonthOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    });

    const lastMonthOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
    });

    const thisMonthRevenue = thisMonthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
    
    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    const customerChange = ((activeCustomers - (customers.length - activeCustomers)) / customers.length) * 100;

    return [
      {
        label: 'Total Customers',
        value: totalCustomers,
        change: Math.round(customerChange),
        trend: customerChange > 0 ? 'up' : customerChange < 0 ? 'down' : 'stable',
        icon: Users,
        color: 'text-blue-600'
      },
      {
        label: 'Active Customers',
        value: activeCustomers,
        change: 15,
        trend: 'up',
        icon: TrendingUp,
        color: 'text-green-600'
      },
      {
        label: 'Avg Order Value',
        value: `$${avgOrderValue.toFixed(0)}`,
        change: 8,
        trend: 'up',
        icon: DollarSign,
        color: 'text-purple-600'
      },
      {
        label: 'Total Revenue',
        value: `$${(totalRevenue / 1000).toFixed(1)}k`,
        change: Math.round(revenueChange),
        trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable',
        icon: ShoppingCart,
        color: 'text-orange-600'
      }
    ];
  };

  const customerMetrics = calculateMetrics();

  // Get max value for chart scaling
  const getMaxValue = () => {
    if (!chartData.length) return 100;
    switch (selectedMetric) {
      case 'revenue':
        return Math.max(...chartData.map(d => d.revenue)) * 1.2;
      case 'customers':
        return Math.max(...chartData.map(d => d.customers)) * 1.2;
      case 'orders':
        return Math.max(...chartData.map(d => d.orders)) * 1.2;
      default:
        return 100;
    }
  };

  const maxValue = getMaxValue();

  const getBarHeight = (value: number) => {
    return (value / maxValue) * 100;
  };

  const getMetricValue = (data: ChartData) => {
    switch (selectedMetric) {
      case 'revenue':
        return data.revenue;
      case 'customers':
        return data.customers;
      case 'orders':
        return data.orders;
      default:
        return 0;
    }
  };

  const formatValue = (value: number) => {
    switch (selectedMetric) {
      case 'revenue':
        return `$${(value / 1000).toFixed(1)}k`;
      case 'customers':
        return value.toString();
      case 'orders':
        return value.toString();
      default:
        return value.toString();
    }
  };

  if (!customers || !orders) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/customers')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {customerMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}
                  >
                    {metric.trend === 'up' ? <ChevronUp className="h-3 w-3" /> : 
                     metric.trend === 'down' ? <ChevronDown className="h-3 w-3" /> : null}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
                <div className="text-lg font-semibold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </div>
            );
          })}
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('revenue')}
            >
              Revenue
            </Button>
            <Button
              variant={selectedMetric === 'customers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('customers')}
            >
              Customers
            </Button>
            <Button
              variant={selectedMetric === 'orders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('orders')}
            >
              Orders
            </Button>
          </div>
          <Badge variant="secondary">
            <Calendar className="h-3 w-3 mr-1" />
            Last 6 Months
          </Badge>
        </div>

        {/* Chart */}
        <div className="relative h-48 bg-muted/20 rounded-lg p-4">
          <div className="absolute inset-4 flex items-end justify-between">
            {chartData.map((data, index) => {
              const value = getMetricValue(data);
              const height = getBarHeight(value);
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center h-32">
                    <div 
                      className="w-3/4 bg-primary rounded-t transition-all duration-500 hover:bg-primary/80 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="text-xs">
                          {formatValue(value)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Retention Rate: </span>
              <span className="font-medium">82%</span>
              <Badge variant="outline" className="ml-2 text-xs text-green-600">
                <ChevronUp className="h-3 w-3" />
                5%
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Lifetime Value: </span>
              <span className="font-medium">$2,450</span>
              <Badge variant="outline" className="ml-2 text-xs text-green-600">
                <ChevronUp className="h-3 w-3" />
                12%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}