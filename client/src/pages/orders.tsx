import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderList from "@/components/orders/OrderList";
import OrderForm from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Orders() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure required fields are present
      const orderData = {
        ...data,
        customerId: parseInt(data.customerId),
        totalAmount: parseFloat(data.totalAmount),
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : 0,
        status: data.status || 'pending',
        priority: data.priority || 'normal',
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsFormOpen(false);
      setEditingOrder(null);
      toast({
        title: "Success",
        description: `Order #${newOrder.orderNumber} created successfully!`,
      });
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const orderData = {
        ...data,
        customerId: parseInt(data.customerId),
        totalAmount: parseFloat(data.totalAmount),
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : 0,
      };

      const response = await apiRequest("PUT", `/api/orders/${id}`, orderData);
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsFormOpen(false);
      setEditingOrder(null);
      toast({
        title: "Success",
        description: `Order #${updatedOrder.orderNumber} updated successfully!`,
      });
    },
    onError: (error: any) => {
      console.error("Order update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    if (editingOrder) {
      updateOrderMutation.mutate({ id: (editingOrder as any).id, ...data });
    } else {
      createOrderMutation.mutate(data);
    }
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleGenerateInvoice = (order: any) => {
    // TODO: Implement invoice generation logic
    toast({
      title: "Invoice Generated",
      description: `Invoice for order #${order.orderNumber} has been generated.`,
    });
  };

  const handleGenerateWorkOrder = (order: any) => {
    // TODO: Implement work order generation logic
    toast({
      title: "Work Order Generated",
      description: `Work order for order #${order.orderNumber} has been generated.`,
    });
  };

  const handlePrintInvoice = (order: any) => {
    // TODO: Implement print functionality
    toast({
      title: "Print Invoice",
      description: `Printing invoice for order #${order.orderNumber}.`,
    });
  };

  const handleEmailInvoice = (order: any) => {
    // TODO: Implement email functionality
    toast({
      title: "Email Invoice",
      description: `Invoice for order #${order.orderNumber} has been emailed.`,
    });
  };

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
                    Orders
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage all your custom framing orders and track their progress.
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        New Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingOrder ? 'Edit Order' : 'Create New Order'}
                        </DialogTitle>
                      </DialogHeader>
                      <OrderForm
                        customers={customers || []}
                        initialData={editingOrder}
                        onSubmit={handleSubmit}
                        isLoading={createOrderMutation.isPending || updateOrderMutation.isPending}
                        onCancel={() => {
                          setIsFormOpen(false);
                          setEditingOrder(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Orders List */}
              <OrderList 
                orders={orders || []} 
                isLoading={isLoading}
                onEdit={handleEdit}
                onGenerateInvoice={handleGenerateInvoice}
                onGenerateWorkOrder={handleGenerateWorkOrder}
                onPrintInvoice={handlePrintInvoice}
                onEmailInvoice={handleEmailInvoice}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}