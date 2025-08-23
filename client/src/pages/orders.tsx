import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderList from "@/components/orders/OrderList";
import SimpleKanbanView from "@/components/orders/SimpleKanbanView";
import { Button } from "@/components/ui/button";
import { Plus, Table, Kanban, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printOrderInvoice } from "@/lib/printUtils";

export default function Orders() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const handleEdit = (order: any) => {
    // Navigate to edit page
    setLocation(`/orders/edit/${order.id}`);
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
        artworkImage: order.artworkImage || '',
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
        artworkImage: order.artworkImage || '',
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
        artworkImage: order.artworkImage || '',
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

  const handleExportOrders = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'Order Number',
        'Customer Name', 
        'Customer Email',
        'Customer Phone',
        'Description',
        'Status',
        'Priority',
        'Total Amount',
        'Deposit Amount',
        'Balance Due',
        'Due Date',
        'Created Date',
        'Frame Style',
        'Mat Color',
        'Glazing',
        'Dimensions',
        'Notes'
      ];

      // Convert orders to CSV rows
      const rows = orders.map(order => [
        order.orderNumber,
        `${order.customer.firstName} ${order.customer.lastName}`,
        order.customer.email || '',
        order.customer.phone || '',
        order.description,
        order.status,
        order.priority,
        parseFloat(order.totalAmount).toFixed(2),
        order.depositAmount ? parseFloat(order.depositAmount).toFixed(2) : '0.00',
        (parseFloat(order.totalAmount) - parseFloat(order.depositAmount || '0')).toFixed(2),
        order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '',
        new Date(order.createdAt).toLocaleDateString(),
        order.frameStyle || '',
        order.matColor || '',
        order.glazing || '',
        order.dimensions || '',
        order.notes || ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => 
            // Escape cells containing commas, quotes, or newlines
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${orders.length} orders to CSV file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export orders. Please try again.",
        variant: "destructive",
      });
    }
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
          <div className="py-4 sm:py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
              


              {/* Page Header */}
              <div className="flex flex-col space-y-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold leading-7 text-foreground sm:text-2xl lg:text-3xl">
                    Orders
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Manage all your custom framing orders and track their progress.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Mobile Actions */}
                  <div className="flex flex-col sm:hidden gap-2">
                    <div className="flex gap-2">
                      {/* View Mode Toggle Mobile */}
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-1">
                        <Button
                          size="sm"
                          variant={viewMode === 'table' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('table')}
                          className="h-8 px-2 flex-1 text-xs"
                          data-testid="button-table-view"
                        >
                          <Table className="h-3 w-3 mr-1" />
                          Table
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('kanban')}
                          className="h-8 px-2 flex-1 text-xs"
                          data-testid="button-kanban-view"
                        >
                          <Kanban className="h-3 w-3 mr-1" />
                          Kanban
                        </Button>
                      </div>
                      <Button 
                        className="btn-primary h-8 px-3 font-semibold bg-green-600 hover:bg-green-700 text-white text-xs" 
                        data-testid="button-new-order"
                        onClick={() => setLocation('/orders/new')}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-8 px-3 font-semibold text-xs w-full"
                      onClick={handleExportOrders}
                      disabled={orders.length === 0}
                      data-testid="button-export-orders"
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Export Orders
                    </Button>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
                    {/* Export Orders Button */}
                    <Button 
                      variant="outline" 
                      className="h-9 px-4 font-semibold text-sm"
                      onClick={handleExportOrders}
                      disabled={orders.length === 0}
                      data-testid="button-export-orders-desktop"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Export Orders
                    </Button>

                    {/* View Mode Toggle Desktop */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('table')}
                        className="h-8 px-3 text-sm"
                        data-testid="button-table-view-desktop"
                      >
                        <Table className="h-4 w-4 mr-2" />
                        Table
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('kanban')}
                        className="h-8 px-3 text-sm"
                        data-testid="button-kanban-view-desktop"
                      >
                        <Kanban className="h-4 w-4 mr-2" />
                        Kanban
                      </Button>
                    </div>

                    {/* New Order Button Desktop */}
                    <Button 
                      className="btn-primary h-9 px-4 font-semibold bg-green-600 hover:bg-green-700 text-white text-sm" 
                      data-testid="button-new-order-desktop"
                      onClick={() => setLocation('/orders/new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Order
                    </Button>
                  </div>
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