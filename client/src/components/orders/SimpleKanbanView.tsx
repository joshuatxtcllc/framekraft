import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit, ArrowRight, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/shared/schema";

interface SimpleKanbanViewProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onPrintInvoice?: (order: Order) => void;
}

const stages = [
  { id: 'pending' as const, title: 'Pending', color: 'bg-gray-500' },
  { id: 'measuring' as const, title: 'Measuring', color: 'bg-yellow-500' },
  { id: 'designing' as const, title: 'Designing', color: 'bg-blue-500' },
  { id: 'cutting' as const, title: 'Cutting', color: 'bg-orange-500' },
  { id: 'assembly' as const, title: 'Assembly', color: 'bg-purple-500' },
  { id: 'completed' as const, title: 'Completed', color: 'bg-green-500' },
];

export default function SimpleKanbanView({ 
  orders, 
  onEdit, 
  onGenerateInvoice, 
  onPrintInvoice 
}: SimpleKanbanViewProps) {
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order['status']>('pending');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      console.log('Updating order with data:', { id, ...data });
      
      // Clean and format the data properly (matching working KanbanView)
      const updateData = {
        customerId: data.customerId || data.customer?.id,
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

      console.log('Sending update data:', updateData);
      
      const response = await apiRequest("PUT", `/api/orders/${id}`, updateData);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', errorText);
        throw new Error(`Update failed: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      setStatusChangeOrder(null);
      setSelectedOrder(null);
    },
    onError: (error) => {
      console.error('Update failed - Full error:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
      toast({
        title: "Error",
        description: `Failed to update order status: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleMoveOrder = () => {
    if (statusChangeOrder && newStatus) {
      const updatedOrder = { 
        ...statusChangeOrder, 
        status: newStatus,
        id: statusChangeOrder.id 
      };
      console.log('Moving order from', statusChangeOrder.status, 'to', newStatus);
      updateOrderMutation.mutate(updatedOrder);
    }
  };

  return (
    <>
      {/* Simple Instructions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-green-800">
          <strong>Easy Controls:</strong> Use the blue arrow button (→) on each order card to move it between stages. Simple and reliable!
        </p>
      </div>

      <div className="kanban-container overflow-x-auto">
        <div className="grid grid-cols-6 gap-4 min-w-[1200px] md:min-w-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                <div className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[400px] space-y-2">
                  {stageOrders.map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
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
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(order)}
                              className="h-8 w-8 p-0"
                              title="Edit Order"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Move Order Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setStatusChangeOrder(order);
                                setNewStatus(order.status);
                              }}
                              className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 border-blue-300"
                              title="Move Order"
                            >
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            </Button>
                            {onGenerateInvoice && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onGenerateInvoice(order)}
                                className="h-6 w-6 p-0"
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Move Order Dialog */}
      <Dialog open={!!statusChangeOrder} onOpenChange={() => setStatusChangeOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Order</DialogTitle>
            <DialogDescription>
              Select the new stage for order {statusChangeOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Stage:</label>
              <p className="text-sm text-muted-foreground capitalize">{statusChangeOrder?.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Move to:</label>
              <Select value={newStatus} onValueChange={(value: Order['status']) => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStatusChangeOrder(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMoveOrder}
                disabled={updateOrderMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateOrderMutation.isPending ? 'Moving...' : 'Move Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer:</label>
                  <p>{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status:</label>
                  <p className="capitalize">{selectedOrder.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority:</label>
                  <Badge className={`${getPriorityColor(selectedOrder.priority)} text-white`}>
                    {selectedOrder.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Amount:</label>
                  <p className="font-semibold text-green-600">
                    ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description:</label>
                <p className="text-sm">{selectedOrder.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Frame Style:</label>
                  <p>{selectedOrder.frameStyle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Mat Color:</label>
                  <p>{selectedOrder.matColor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Glass Type:</label>
                  <p>{selectedOrder.glassType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Dimensions:</label>
                  <p>{selectedOrder.dimensions}</p>
                </div>
              </div>
              {selectedOrder.dueDate && (
                <div>
                  <label className="text-sm font-medium">Due Date:</label>
                  <p>{new Date(selectedOrder.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}