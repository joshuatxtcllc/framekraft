import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderForm from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditOrder() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();

  // Fetch the order to edit
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${id}`],
    enabled: !!id,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Clean and format the data properly
      const orderData = {
        customerId: data.customerId, // Keep as string for MongoDB ObjectId
        description: data.description,
        artworkDescription: data.artworkDescription || null,
        dimensions: data.dimensions || null,
        frameStyle: data.frameStyle || null,
        matColor: data.matColor || null,
        glazing: data.glazing || null,
        totalAmount: parseFloat(data.totalAmount),
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : 0,
        discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : 0,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
      };

      const response = await apiRequest("PUT", `/api/orders/${id}`, orderData);
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Order #${updatedOrder.orderNumber} updated successfully!`,
      });
      // Navigate back to orders list
      setLocation("/orders");
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
    updateOrderMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/orders");
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        
        <div className="lg:pl-64 flex flex-col flex-1">
          <Header />
          
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-32 w-full" />
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

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Page Header with Back Button */}
              <div className="flex items-center space-x-4 mb-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/orders")}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl">
                    Edit Order {order?.orderNumber ? `#${order.orderNumber}` : ''}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update the order details below.
                  </p>
                </div>
              </div>

              {/* Order Form */}
              <div className="bg-white shadow rounded-lg p-6">
                <OrderForm
                  customers={Array.isArray(customers) ? customers : []}
                  initialData={order}
                  onSubmit={handleSubmit}
                  isLoading={updateOrderMutation.isPending}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}