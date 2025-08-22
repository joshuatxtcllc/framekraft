import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Printer, BarChart3, Table } from "lucide-react";
import { Link } from "wouter";

interface Order {
  id: string;
  customerId: number;
  orderNumber: string;
  description: string;
  artworkDescription?: string;
  dimensions: string;
  frameStyle: string;
  matColor: string;
  glazing: string;
  totalAmount: string;
  status: string;
  priority: string;
  dueDate?: string;
  customer: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  createdAt: string;
}

const KanbanBoard = () => {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const orders: Order[] = (ordersData as Order[]) || [];
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);

  const stages = [
    { id: 'pending', title: 'Order Processed', color: 'bg-blue-500', count: 0 },
    { id: 'measuring', title: 'Materials Ordered', color: 'bg-orange-500', count: 0 },
    { id: 'production', title: 'In Production', color: 'bg-purple-500', count: 0 },
    { id: 'quality_check', title: 'Quality Check', color: 'bg-indigo-500', count: 0 },
    { id: 'ready', title: 'Ready for Pickup', color: 'bg-green-500', count: 0 },
    { id: 'completed', title: 'Completed', color: 'bg-gray-500', count: 0 },
    { id: 'cancelled', title: 'Delayed/Issues', color: 'bg-red-500', count: 0 },
  ];

  // Count orders in each stage
  stages.forEach(stage => {
    stage.count = orders.filter(order => order.status === stage.id).length;
  });

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== newStatus) {
      try {
        // Update order status via API
        const response = await fetch(`/api/orders/${draggedOrder.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...draggedOrder,
            status: newStatus,
          }),
        });

        if (response.ok) {
          // Use React Query to refresh the orders data smoothly
          const queryClient = (await import('@/lib/queryClient')).queryClient;
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        }
      } catch (error) {
        console.error('Failed to update order status:', error);
      }
      setDraggedOrder(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'border-l-red-500 bg-red-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-l-gray-500 bg-gray-500/5';
      default: return 'border-l-gray-500';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        
        <div className="lg:pl-64 flex flex-col flex-1">
          <Header />
          
          <main className="flex-1">
            <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="flex gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-80 h-96 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Production Board</h1>
          <p className="text-muted-foreground">Drag orders between stages to update their status</p>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="bg-card rounded-lg border border-border w-80 flex-shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    {/* Column Header */}
                    <div className={`p-4 rounded-t-lg ${stage.color} text-white`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm">{stage.title}</h3>
                        <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                          {stage.count}
                        </span>
                      </div>
                    </div>

                    {/* Orders in this stage */}
                    <div className="p-3 space-y-3 min-h-[200px]">
                      {orders
                        .filter(order => order.status === stage.id)
                        .map((order) => (
                          <div
                            key={order.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, order)}
                            className={`bg-card border-l-4 ${getPriorityColor(order.priority)} p-4 rounded-r-lg cursor-move hover:bg-muted/50 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1`}
                            data-testid={`kanban-card-${order.id}`}
                          >
                            {/* Header with Order Number and Priority */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-bold text-foreground text-lg" data-testid={`order-number-${order.id}`}>
                                  {order.orderNumber}
                                </p>
                                <p className="text-sm text-muted-foreground">{order.description.split(' ').slice(0, 3).join(' ')}...</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                  order.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                  order.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`} data-testid={`priority-${order.id}`}>
                                  {order.priority?.toUpperCase() || 'NORMAL'}
                                </span>
                                {isOverdue(order.dueDate) && (
                                  <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium mt-1">
                                    OVERDUE
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-3">
                              <p className="font-semibold text-primary text-lg" data-testid={`customer-name-${order.id}`}>
                                {order.customer.firstName} {order.customer.lastName}
                              </p>
                              {order.customer.phone && (
                                <p className="text-sm text-muted-foreground font-mono">{order.customer.phone}</p>
                              )}
                            </div>

                            {/* Order Description */}
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                              <p className="text-sm text-foreground leading-relaxed">{order.description}</p>
                            </div>

                            {/* Frame Details */}
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreference uppercase tracking-wide mb-1">Frame Details</p>
                              <p className="text-sm text-muted-foreground">
                                {order.dimensions} • {order.frameStyle} • {order.matColor}
                              </p>
                            </div>

                            {/* Due Date */}
                            {order.dueDate && (
                              <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="text-xs text-muted-foreground">Due Date</span>
                                <span className={`text-sm font-medium ${isOverdue(order.dueDate) ? 'text-red-400' : 'text-foreground'}`}>
                                  {new Date(order.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                      {/* Empty state for columns */}
                      {orders.filter(order => order.status === stage.id).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No orders in this stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4 flex-wrap">
          <Link href="/orders">
            <Button className="bg-primary text-primary-foreground" data-testid="button-new-order">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </Link>
          <Button variant="outline" data-testid="button-print-orders">
            <Printer className="w-4 h-4 mr-2" />
            Print Work Orders
          </Button>
          <Link href="/analytics">
            <Button variant="outline" data-testid="button-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" data-testid="button-table-view">
              <Table className="w-4 h-4 mr-2" />
              Table View
            </Button>
          </Link>
        </div>

        {/* Quick Reference Legend */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Priority Levels</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">High Priority - Rush orders, special clients</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Medium Priority - Standard turnaround</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-sm">Low Priority - No rush, flexible timeline</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Card Information</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="text-primary">Customer Name & Phone</span> - Contact information</p>
              <p><span className="text-secondary">Frame Details</span> - Specifications and materials</p>
              <p><span className="text-muted-foreground">Description</span> - Order details</p>
              <p><span className="text-muted-foreground">Due Date</span> - Customer pickup date</p>
            </div>
          </Card>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default KanbanBoard;