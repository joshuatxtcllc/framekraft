import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderList from "@/components/orders/OrderList";
import SimpleKanbanView from "@/components/orders/SimpleKanbanView";
import OrderForm from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Table, Kanban, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { printOrderInvoice } from "@/lib/printUtils";

export default function Orders() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
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
      // Clean and format the data properly
      const orderData = {
        customerId: parseInt(data.customerId),
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
      setIsFormOpen(false);
      setEditingOrder(null);
      toast({
        title: "Success",
        description: `Order #${newOrder.orderNumber} created successfully!`,
      });
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
        status: error?.status
      });

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

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      // Clean and format the data properly
      const orderData = {
        customerId: parseInt(data.customerId),
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

  const handleGenerateInvoice = async (order: any) => {
    try {
      const { exportToPDF } = await import("@/lib/pdfExport");
      const invoiceData = {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email || '',
        customerPhone: order.customer.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        dimensions: order.dimensions || '',
        frameStyle: order.frameStyle || '',
        matColor: order.matColor || '',
        glazing: order.glazing || '',
        totalAmount: parseFloat(order.totalAmount),
        depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : 0,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate || '',
        createdAt: order.createdAt,
        notes: order.notes || ''
      };

      await exportToPDF(invoiceData, 'invoice');
      toast({
        title: "Invoice Generated",
        description: `Invoice for order ${order.orderNumber} has been downloaded.`,
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateWorkOrder = async (order: any) => {
    try {
      const { exportToPDF } = await import("@/lib/pdfExport");
      const workOrderData = {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email || '',
        customerPhone: order.customer.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        dimensions: order.dimensions || '',
        frameStyle: order.frameStyle || '',
        matColor: order.matColor || '',
        glazing: order.glazing || '',
        totalAmount: parseFloat(order.totalAmount),
        depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : 0,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate || '',
        createdAt: order.createdAt,
        notes: order.notes || ''
      };

      await exportToPDF(workOrderData, 'work-order');
      toast({
        title: "Work Order Generated",
        description: `Work order for ${order.orderNumber} has been downloaded.`,
      });
    } catch (error) {
      console.error('Work order generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate work order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrintInvoice = (order: any) => {
    try {
      const invoiceData = {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email || '',
        customerPhone: order.customer.phone || '',
        description: order.description,
        artworkDescription: order.artworkDescription || '',
        dimensions: order.dimensions || '',
        frameStyle: order.frameStyle || '',
        matColor: order.matColor || '',
        glazing: order.glazing || '',
        totalAmount: parseFloat(order.totalAmount),
        depositAmount: order.depositAmount ? parseFloat(order.depositAmount) : 0,
        status: order.status,
        priority: order.priority,
        dueDate: order.dueDate || '',
        createdAt: order.createdAt,
        notes: order.notes || ''
      };

      // Open print window with specific order invoice
      printOrderInvoice(invoiceData);

      toast({
        title: "Print Window Opened",
        description: `Invoice for order ${order.orderNumber} opened in new window for printing.`,
      });
    } catch (error) {
      console.error('Print preparation error:', error);
      toast({
        title: "Error",
        description: "Failed to prepare invoice for printing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailInvoice = (order: any) => {
    if (!order.customer.email) {
      toast({
        title: "No Email Address",
        description: "Customer has no email address on file.",
        variant: "destructive",
      });
      return;
    }

    const subject = `Invoice ${order.orderNumber} - ${order.description}`;
    const body = `Dear ${order.customer.firstName} ${order.customer.lastName},

Please find attached your invoice for order ${order.orderNumber}.

Order Details:
- Description: ${order.description}
- Total Amount: $${parseFloat(order.totalAmount).toFixed(2)}
${order.depositAmount ? `- Deposit: $${parseFloat(order.depositAmount).toFixed(2)}` : ''}

Thank you for your business!

Best regards,
FrameCraft`;

    const mailtoLink = `mailto:${order.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    toast({
      title: "Email Client Opened",
      description: `Email client opened for ${order.customer.email}`,
    });
  };

    // Placeholder function for payment processing
    const handleProcessPayment = (order: any) => {
        toast({
            title: "Payment Processing",
            description: `Payment processing initiated for order ${order.orderNumber}. This functionality is under construction.`,
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
              <div className="flex flex-col space-y-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl">
                    Orders
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage all your custom framing orders and track their progress.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Export Orders Button */}
                  <Button 
                    variant="outline" 
                    className="h-10 px-6 font-semibold"
                    onClick={() => {
                      toast({
                        title: "Export Orders",
                        description: "Exporting orders to CSV...",
                      });
                      // TODO: Implement CSV export functionality
                    }}
                    data-testid="button-export-orders"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Export Orders
                  </Button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('table')}
                      className="h-8 px-3"
                      data-testid="button-table-view"
                    >
                      <Table className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('kanban')}
                      className="h-8 px-3"
                      data-testid="button-kanban-view"
                    >
                      <Kanban className="h-4 w-4 mr-2" />
                      Kanban
                    </Button>
                  </div>

                  {/* New Order Button */}
                  <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary h-10 px-6 font-semibold bg-green-600 hover:bg-green-700 text-white" data-testid="button-new-order">
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
                        customers={Array.isArray(customers) ? customers : []}
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

              {/* Orders Content */}
              {viewMode === 'table' ? (
                <OrderList 
                  orders={Array.isArray(orders) ? orders : []} 
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onGenerateInvoice={handleGenerateInvoice}
                  onGenerateWorkOrder={handleGenerateWorkOrder}
                  onPrintInvoice={handlePrintInvoice}
                  onEmailInvoice={handleEmailInvoice}
                  onProcessPayment={handleProcessPayment}
                />
              ) : (
                <SimpleKanbanView
                  orders={Array.isArray(orders) ? orders : []} 
                  onEdit={handleEdit}
                  onGenerateInvoice={handleGenerateInvoice}
                  onPrintInvoice={handlePrintInvoice}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}