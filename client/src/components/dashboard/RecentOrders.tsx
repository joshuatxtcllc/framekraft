import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Order {
  id: number;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  description: string;
  totalAmount: string;
  status: string;
  createdAt: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "order-status-pending" },
      measuring: { label: "Measuring", className: "order-status-pending" },
      production: { label: "In Progress", className: "order-status-production" },
      ready: { label: "Ready", className: "order-status-ready" },
      completed: { label: "Completed", className: "order-status-completed" },
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/orders" className="text-sm text-primary hover:text-primary/80">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {order.customer?.firstName?.[0] || 'U'}{order.customer?.lastName?.[0] || ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
