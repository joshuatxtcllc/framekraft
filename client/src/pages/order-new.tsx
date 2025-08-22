import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderForm from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingOrder, setEditingOrder] = useState(null);

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const createOrderMutation = useMutation({
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
        status: data.status || 'pending',
        priority: data.priority || 'normal',
        dueDate: data.dueDate || null,
        notes: data.notes || null,
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Order #${newOrder.orderNumber} created successfully!`,
      });
      // Navigate back to orders list
      setLocation("/orders");
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      
      let errorMessage = "Failed to create order. Please try again.";

      // Parse API error response if available
      if (error?.response) {
        try {
          const errorData = error.response;
          console.log("API error response:", errorData);

          if (errorData?.details?.type === 'validation') {
            errorMessage = `Validation failed: ${errorData.details.issues?.map((i: any) => i.message).join(', ') || 'Invalid data provided'}`;
          } else if (errorData?.details?.type === 'foreign_key') {
            errorMessage = "Invalid customer selected. Please choose a valid customer.";
          } else if (errorData?.details?.type === 'duplicate_key') {
            errorMessage = "Order number already exists. Please try again.";
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error("Error parsing API response:", parseError);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error Creating Order",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createOrderMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/orders");
  };

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
                    Create New Order
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fill in the details below to create a new custom framing order.
                  </p>
                </div>
              </div>

              {/* Order Form */}
              <div className="bg-white shadow rounded-lg p-6">
                <OrderForm
                  customers={Array.isArray(customers) ? customers : []}
                  initialData={editingOrder}
                  onSubmit={handleSubmit}
                  isLoading={createOrderMutation.isPending}
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