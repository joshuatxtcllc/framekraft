import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectTracking() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const getOrderCounts = () => {
    if (!orders) return { pending: 0, inProgress: 0, completed: 0 };
    
    const pending = orders.filter((order: any) => order.status === 'pending' || order.status === 'measuring').length;
    const inProgress = orders.filter((order: any) => order.status === 'production').length;
    const completed = orders.filter((order: any) => order.status === 'ready').length;
    
    return { pending, inProgress, completed };
  };

  const getRecentActivity = () => {
    if (!orders) return [];
    
    const recentOrders = orders
      .slice(0, 5)
      .map((order: any) => {
        let activityType = 'info';
        let description = '';
        
        switch (order.status) {
          case 'ready':
            activityType = 'success';
            description = `Order #${order.id} completed - ${order.customer.firstName} ${order.customer.lastName}'s order is ready for pickup`;
            break;
          case 'production':
            activityType = 'progress';
            description = `Production started on Order #${order.id} - ${order.customer.firstName} ${order.customer.lastName}'s order`;
            break;
          case 'pending':
            activityType = 'new';
            description = `New order received - Order #${order.id} from ${order.customer.firstName} ${order.customer.lastName}`;
            break;
          default:
            activityType = 'info';
            description = `Order #${order.id} status updated to ${order.status}`;
        }
        
        return {
          id: order.id,
          type: activityType,
          description,
          time: new Date(order.createdAt).toLocaleString(),
        };
      });
    
    return recentOrders;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const { pending, inProgress, completed } = getOrderCounts();
  const recentActivity = getRecentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{pending}</div>
            <div className="text-sm text-muted-foreground">Pending Orders</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{inProgress}</div>
            <div className="text-sm text-muted-foreground">In Production</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{completed}</div>
            <div className="text-sm text-muted-foreground">Ready for Pickup</div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div>
          <h4 className="text-md font-medium text-foreground mb-4">Recent Activity</h4>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded" />
              ))}
            </div>
          ) : (
            <div className="flow-root">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <ul className="-mb-8">
                  {recentActivity.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-background ${
                              activity.type === 'success' ? 'bg-green-500' :
                              activity.type === 'progress' ? 'bg-blue-500' :
                              activity.type === 'new' ? 'bg-secondary' : 'bg-muted'
                            }`}>
                              {activity.type === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : activity.type === 'progress' ? (
                                <Settings className="w-4 h-4 text-white" />
                              ) : (
                                <Clock className="w-4 h-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-foreground">{activity.description}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-muted-foreground">
                              <time>{formatTimeAgo(activity.time)}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
