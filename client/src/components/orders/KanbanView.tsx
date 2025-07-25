import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, FileText, Printer, Mail, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  description: string;
  artworkDescription?: string;
  dimensions?: string;
  frameStyle?: string;
  matColor?: string;
  glazing?: string;
  totalAmount: string;
  depositAmount?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  notes?: string;
}

interface KanbanViewProps {
  orders: Order[];
  isLoading: boolean;
  onEdit: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onGenerateWorkOrder?: (order: Order) => void;
  onPrintInvoice?: (order: Order) => void;
  onEmailInvoice?: (order: Order) => void;
  onProcessPayment?: (order: Order) => void;
}

const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-green-500',
    normal: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-500';
};

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-500',
    measuring: 'bg-blue-500',
    production: 'bg-purple-500',
    quality_check: 'bg-indigo-500',
    ready: 'bg-green-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

export default function KanbanView({
  orders,
  isLoading,
  onEdit,
  onGenerateInvoice,
  onGenerateWorkOrder,
  onPrintInvoice,
  onEmailInvoice,
  onProcessPayment
}: KanbanViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      // Clean and format the data properly
      const updateData = {
        customerId: parseInt(data.customerId),
        orderNumber: data.orderNumber,
        description: data.description,
        artworkDescription: data.artworkDescription || null,
        dimensions: data.dimensions || null,
        frameStyle: data.frameStyle || null,
        matColor: data.matColor || null,
        glazing: data.glazing || null,
        totalAmount: parseFloat(data.totalAmount),
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : 0,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
      };
      
      const response = await apiRequest("PUT", `/api/orders/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Updated",
        description: "Order status updated successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Order update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== newStatus) {
      updateOrderMutation.mutate({
        id: draggedOrder.id,
        ...draggedOrder,
        status: newStatus,
      });
    }
    setDraggedOrder(null);
  };

  // Touch events for mobile support
  const handleTouchStart = (e: React.TouchEvent, order: Order) => {
    setDraggedOrder(order);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (draggedOrder) {
      // Get the element under the touch point
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementBelow?.closest('[data-drop-zone]');
      
      if (dropZone) {
        const newStatus = dropZone.getAttribute('data-status');
        if (newStatus && draggedOrder.status !== newStatus) {
          updateOrderMutation.mutate({
            id: draggedOrder.id,
            ...draggedOrder,
            status: newStatus,
          });
        }
      }
    }
    setDraggedOrder(null);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const stages = [
    { id: 'pending', title: 'Order Processed', color: 'bg-blue-500' },
    { id: 'measuring', title: 'Measuring', color: 'bg-yellow-500' },
    { id: 'production', title: 'In Production', color: 'bg-purple-500' },
    { id: 'quality_check', title: 'Quality Check', color: 'bg-indigo-500' },
    { id: 'ready', title: 'Ready for Pickup', color: 'bg-green-500' },
    { id: 'completed', title: 'Completed', color: 'bg-gray-500' },
  ];

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Instructions */}
      <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Mobile Tip:</strong> Touch and hold an order card, then drag it to a different column to update its status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageOrders = getOrdersByStatus(stage.id);
          return (
            <div key={stage.id} className="flex flex-col">
              {/* Stage Header */}
              <div className={`${stage.color} text-white p-3 rounded-t-lg flex items-center justify-between`}>
                <h3 className="font-semibold text-sm">{stage.title}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {stageOrders.length}
                </Badge>
              </div>

              {/* Orders Column */}
              <div 
                className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[400px] space-y-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                data-drop-zone="true"
                data-status={stage.id}
              >
                {stageOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="cursor-move hover:shadow-md transition-shadow touch-none"
                    draggable
                    onDragStart={(e) => handleDragStart(e, order)}
                    onTouchStart={(e) => handleTouchStart(e, order)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Order Number & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{order.orderNumber}</span>
                          <Badge className={`${getPriorityColor(order.priority)} text-white text-xs px-2 py-1`}>
                            {order.priority}
                          </Badge>
                        </div>

                        {/* Customer */}
                        <p className="text-sm text-muted-foreground">
                          {order.customer.firstName} {order.customer.lastName}
                        </p>

                        {/* Description */}
                        <p className="text-xs text-foreground line-clamp-2">
                          {order.description}
                        </p>

                        {/* Amount */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-green-600">
                            ${parseFloat(order.totalAmount).toFixed(2)}
                          </span>
                          {order.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(order.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order)}
                            className="h-6 w-6 p-0"
                            data-testid={`button-view-${order.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(order)}
                            className="h-6 w-6 p-0"
                            data-testid={`button-edit-${order.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {onGenerateInvoice && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onGenerateInvoice(order)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-generate-invoice-${order.id}`}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          )}
                          {onPrintInvoice && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onPrintInvoice(order)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-print-${order.id}`}
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    No orders in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedOrder.customer.email || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedOrder.customer.phone || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h4 className="font-semibold mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)} text-white`}>
                      {selectedOrder.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <Badge className={`ml-2 ${getPriorityColor(selectedOrder.priority)} text-white`}>
                      {selectedOrder.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Due Date:</span> {selectedOrder.dueDate ? new Date(selectedOrder.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Artwork & Frame Details */}
              <div>
                <h4 className="font-semibold mb-2">Artwork & Frame Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Description:</span> {selectedOrder.description}</div>
                  {selectedOrder.artworkDescription && (
                    <div><span className="font-medium">Artwork:</span> {selectedOrder.artworkDescription}</div>
                  )}
                  {selectedOrder.dimensions && (
                    <div><span className="font-medium">Dimensions:</span> {selectedOrder.dimensions}</div>
                  )}
                  {selectedOrder.frameStyle && (
                    <div><span className="font-medium">Frame Style:</span> {selectedOrder.frameStyle}</div>
                  )}
                  {selectedOrder.matColor && (
                    <div><span className="font-medium">Mat Color:</span> {selectedOrder.matColor}</div>
                  )}
                  {selectedOrder.glazing && (
                    <div><span className="font-medium">Glazing:</span> {selectedOrder.glazing}</div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="font-semibold mb-2">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Amount:</span> ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Deposit:</span> ${selectedOrder.depositAmount ? parseFloat(selectedOrder.depositAmount).toFixed(2) : '0.00'}
                  </div>
                  <div>
                    <span className="font-medium">Balance Due:</span> ${(parseFloat(selectedOrder.totalAmount) - (selectedOrder.depositAmount ? parseFloat(selectedOrder.depositAmount) : 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => onEdit(selectedOrder)} data-testid="button-edit-dialog">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                {onGenerateInvoice && (
                  <Button variant="outline" onClick={() => onGenerateInvoice(selectedOrder)} data-testid="button-generate-invoice-dialog">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                )}
                {onPrintInvoice && (
                  <Button variant="outline" onClick={() => onPrintInvoice(selectedOrder)} data-testid="button-print-dialog">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                )}
                {onEmailInvoice && (
                  <Button variant="outline" onClick={() => onEmailInvoice(selectedOrder)} data-testid="button-email-dialog">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}