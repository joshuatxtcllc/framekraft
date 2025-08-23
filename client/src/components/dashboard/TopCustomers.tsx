import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Users, TrendingUp, DollarSign, 
  Crown, Medal, Award, Star, ChevronRight,
  Calendar, ShoppingBag
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface TopCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
  averageOrderValue: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  loyaltyStatus: 'gold' | 'silver' | 'bronze' | 'new';
}

export default function TopCustomers() {
  const [, setLocation] = useLocation();

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Process and rank customers
  const getTopCustomers = (): TopCustomer[] => {
    if (!customers || !orders) return [];

    // Calculate customer metrics
    const customerMetrics = customers.map((customer: any) => {
      const customerOrders = orders.filter((order: any) => 
        order.customerId === customer.id || order.customerId === customer._id?.toString()
      );
      
      const totalSpent = customerOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0
      );
      
      const orderCount = customerOrders.length;
      const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      
      // Get last order date
      const sortedOrders = customerOrders.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastOrderDate = sortedOrders[0]?.createdAt;
      
      // Determine loyalty status based on order count and total spent
      let loyaltyStatus: 'gold' | 'silver' | 'bronze' | 'new' = 'new';
      if (totalSpent > 5000 || orderCount > 10) {
        loyaltyStatus = 'gold';
      } else if (totalSpent > 2000 || orderCount > 5) {
        loyaltyStatus = 'silver';
      } else if (totalSpent > 500 || orderCount > 2) {
        loyaltyStatus = 'bronze';
      }
      
      // Calculate trend (mock data for demonstration)
      const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down';
      
      return {
        id: customer.id || customer._id?.toString(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        totalSpent,
        orderCount,
        lastOrderDate,
        averageOrderValue,
        rank: 0,
        trend,
        loyaltyStatus
      };
    });

    // Sort by total spent and assign ranks
    const sorted = customerMetrics
      .sort((a: TopCustomer, b: TopCustomer) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((customer: TopCustomer, index: number) => ({
        ...customer,
        rank: index + 1
      }));

    return sorted;
  };

  const topCustomers = getTopCustomers();
  const maxSpent = topCustomers.length > 0 ? topCustomers[0].totalSpent : 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-orange-600" />;
      default:
        return <Star className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLoyaltyColor = (status: string) => {
    switch (status) {
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (customersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Customers
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/customers')}
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topCustomers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No customer data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setLocation(`/customers/${customer.id}`)}
              >
                <div className="flex items-start gap-3">
                  {/* Rank Icon */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    {getRankIcon(customer.rank)}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getLoyaltyColor(customer.loyaltyStatus)}`}
                      >
                        {customer.loyaltyStatus}
                      </Badge>
                      {customer.trend === 'up' && (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {customer.orderCount} orders
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${customer.averageOrderValue.toFixed(0)} avg
                      </span>
                      {customer.lastOrderDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(customer.lastOrderDate)}
                        </span>
                      )}
                    </div>

                    {/* Spending Progress */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total Spent</span>
                        <span className="font-semibold">${customer.totalSpent.toFixed(0)}</span>
                      </div>
                      <Progress 
                        value={(customer.totalSpent / maxSpent) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {topCustomers.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">
                  ${(topCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-muted-foreground">Top 5 Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {topCustomers.reduce((sum, c) => sum + c.orderCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${Math.round(topCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / topCustomers.length)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Order</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}