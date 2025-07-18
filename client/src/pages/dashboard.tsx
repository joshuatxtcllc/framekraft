import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MetricsCards from "@/components/dashboard/MetricsCards";
import RecentOrders from "@/components/dashboard/RecentOrders";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import ProjectTracking from "@/components/dashboard/ProjectTracking";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
                    Good morning, {user?.firstName || 'there'}!
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Here's what's happening with your framing business today.
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <button className="btn btn-secondary">
                    Export Report
                  </button>
                  <button className="btn btn-primary">
                    New Order
                  </button>
                </div>
              </div>

              {/* Metrics Cards */}
              {metricsLoading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              ) : (
                <MetricsCards metrics={metrics} />
              )}

              {/* Content Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                {/* Recent Orders */}
                {ordersLoading ? (
                  <Skeleton className="h-96 rounded-lg" />
                ) : (
                  <RecentOrders orders={orders?.slice(0, 5) || []} />
                )}

                {/* AI Recommendations */}
                <AIRecommendations />
              </div>

              {/* Project Tracking */}
              <ProjectTracking />

              {/* Customer Insights */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Analytics Chart Placeholder */}
                <div className="lg:col-span-2 bg-card shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                      Customer Analytics
                    </h3>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <div className="text-center">
                        <h4 className="mt-2 text-sm font-medium text-foreground">
                          Revenue & Customer Growth Chart
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Interactive chart showing business trends
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="bg-card shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                      Top Customers
                    </h3>
                    {customersLoading ? (
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-12 rounded" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customers?.slice(0, 4).map((customer: any) => (
                          <div key={customer.id} className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {customer.firstName[0]}{customer.lastName[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {customer.firstName} {customer.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {customer.orderCount} orders
                              </p>
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              ${parseFloat(customer.totalSpent || "0").toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
