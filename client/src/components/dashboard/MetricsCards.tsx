import { DollarSign, ShoppingBag, Users, CheckCircle, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricsCardsProps {
  metrics: {
    monthlyRevenue: number;
    activeOrders: number;
    totalCustomers: number;
    completionRate: number;
    newCustomersThisMonth?: number;
    revenueGrowth?: number;
    customerGrowth?: number;
    weeklyOrders?: number;
    weeklyRevenue?: number;
    averageOrderValue?: number;
    totalOrders?: number;
    monthlyPaidRevenue?: number;
    paymentRate?: number;
    outstandingAmount?: number;
  } | undefined;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  if (!metrics) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeType = (value: number): "increase" | "decrease" | "neutral" => {
    if (value > 0) return "increase";
    if (value < 0) return "decrease";
    return "neutral";
  };

  const formatChange = (value: number): string => {
    if (value === 0) return "No change";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const metricCards = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(metrics.monthlyRevenue),
      icon: DollarSign,
      iconColor: "text-green-600",
      change: formatChange(metrics.revenueGrowth || 0),
      changeType: getChangeType(metrics.revenueGrowth || 0),
      subtitle: "from last month",
    },
    {
      title: "Active Orders",
      value: metrics.activeOrders.toString(),
      icon: ShoppingBag,
      iconColor: "text-secondary",
      change: `${metrics.weeklyOrders || 0} this week`,
      changeType: "neutral",
      subtitle: "orders in progress",
    },
    {
      title: "Total Customers",
      value: metrics.totalCustomers.toString(),
      icon: Users,
      iconColor: "text-accent-foreground",
      change: formatChange(metrics.customerGrowth || 0),
      changeType: getChangeType(metrics.customerGrowth || 0),
      subtitle: "customer growth",
    },
    {
      title: "Average Order Value",
      value: formatCurrency(metrics.averageOrderValue),
      icon: CheckCircle,
      iconColor: "text-primary",
      change: `${metrics.totalOrders} total`,
      changeType: "neutral",
      subtitle: "all orders",
    },
    {
      title: "Weekly Revenue",
      value: formatCurrency(metrics.weeklyRevenue || 0),
      icon: DollarSign,
      iconColor: "text-blue-600",
      change: `${metrics.weeklyOrders || 0} orders`,
      changeType: "neutral",
      subtitle: "last 7 days",
    },
    {
      title: "Paid Revenue",
      value: formatCurrency(metrics.monthlyPaidRevenue || 0),
      icon: CreditCard,
      iconColor: "text-green-600",
      change: `${metrics.paymentRate?.toFixed(1) || 0}% collected`,
      changeType: "neutral",
      subtitle: "of monthly revenue",
    },
    {
      title: "Outstanding",
      value: formatCurrency(metrics.outstandingAmount || 0),
      icon: DollarSign,
      iconColor: (metrics.totalCriticalAmount || 0) > 0 ? "text-red-600" : (metrics.outstandingAmount || 0) > 0 ? "text-orange-600" : "text-gray-500",
      change: metrics.criticalReceivablesCount > 0 ? `${metrics.criticalReceivablesCount} CRITICAL` : `${((metrics.outstandingAmount || 0) / (metrics.monthlyRevenue || 1) * 100).toFixed(1)}%`,
      changeType: (metrics.criticalReceivablesCount || 0) > 0 ? "decrease" : (metrics.outstandingAmount || 0) > 0 ? "decrease" : "neutral",
      subtitle: metrics.criticalReceivablesCount > 0 ? "accounts 30+ days overdue" : "awaiting payment",
    },
    {
      title: "Completion Rate",
      value: `${metrics.completionRate}%`,
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      change: "On track",
      changeType: "neutral",
      subtitle: "project delivery",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 mb-8">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="metric-card">
          <CardContent className="metric-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    {metric.title}
                  </dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {metric.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="metric-card-footer">
            <div className="text-sm flex items-center">
              {metric.changeType === "increase" && (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              )}
              {metric.changeType === "decrease" && (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`font-medium ${
                metric.changeType === "increase" ? "text-green-600" : 
                metric.changeType === "decrease" ? "text-red-600" : "text-muted-foreground"
              }`}>
                {metric.change}
              </span>
              <span className="text-muted-foreground ml-1">{metric.subtitle}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
