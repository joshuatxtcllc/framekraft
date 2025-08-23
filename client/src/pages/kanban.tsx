import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Printer, BarChart3, Table, Calculator, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    email?: string;
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quickQuoteOpen, setQuickQuoteOpen] = useState(false);
  const [stockCheckOpen, setStockCheckOpen] = useState(false);
  const [quickQuoteData, setQuickQuoteData] = useState({
    width: '',
    height: '',
    frameType: 'standard',
    matting: 'single',
    glazing: 'standard',
  });
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  const stages = [
    { id: 'pending', title: 'Pending', color: 'bg-blue-500', count: 0 },
    { id: 'measuring', title: 'Measuring', color: 'bg-orange-500', count: 0 },
    { id: 'designing', title: 'Designing', color: 'bg-purple-500', count: 0 },
    { id: 'cutting', title: 'Cutting', color: 'bg-indigo-500', count: 0 },
    { id: 'assembly', title: 'Assembly', color: 'bg-yellow-500', count: 0 },
    { id: 'completed', title: 'Completed', color: 'bg-green-500', count: 0 },
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

  // Handle printing work orders for all in-production orders
  const handlePrintWorkOrders = async () => {
    const productionOrders = orders.filter(order => 
      ['pending', 'measuring', 'designing', 'cutting', 'assembly'].includes(order.status)
    );
    
    if (productionOrders.length === 0) {
      toast({
        title: "No Active Orders",
        description: "There are no orders in production to print.",
        variant: "default",
      });
      return;
    }

    try {
      const { exportToPDF } = await import("@/lib/pdfExport");
      
      // Generate work orders for each production order
      for (const order of productionOrders) {
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
          depositAmount: 0,
          status: order.status,
          priority: order.priority,
          dueDate: order.dueDate || '',
          createdAt: order.createdAt,
          notes: ''
        };

        await exportToPDF(workOrderData, 'work-order');
      }
      
      toast({
        title: "Work Orders Generated",
        description: `Generated ${productionOrders.length} work order(s) for production.`,
      });
    } catch (error) {
      console.error('Error generating work orders:', error);
      toast({
        title: "Error",
        description: "Failed to generate work orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate quick quote estimate
  const calculateQuickQuote = () => {
    const width = parseFloat(quickQuoteData.width) || 0;
    const height = parseFloat(quickQuoteData.height) || 0;
    
    if (width === 0 || height === 0) return '0';
    
    const perimeter = (width + height) * 2;
    const area = width * height;
    
    // Base pricing logic
    let basePrice = 0;
    
    // Frame pricing (per linear inch)
    const framePrices = {
      standard: 0.80,
      premium: 1.50,
      metal: 1.20,
      custom: 2.00
    };
    basePrice += perimeter * (framePrices[quickQuoteData.frameType as keyof typeof framePrices] || 0.80);
    
    // Matting pricing
    const matPrices = {
      none: 0,
      single: 15,
      double: 25,
      triple: 35
    };
    basePrice += matPrices[quickQuoteData.matting as keyof typeof matPrices] || 0;
    
    // Glazing pricing (per square inch)
    const glazingPrices = {
      standard: 0.05,
      'non-glare': 0.08,
      museum: 0.15,
      acrylic: 0.04
    };
    basePrice += area * (glazingPrices[quickQuoteData.glazing as keyof typeof glazingPrices] || 0.05);
    
    // Add labor and overhead
    basePrice += 45; // Base labor
    
    const min = Math.round(basePrice * 0.9);
    const max = Math.round(basePrice * 1.1);
    
    return `${min} - ${max}`;
  };

  // Get filtered inventory for stock check
  const getFilteredInventory = () => {
    // Mock inventory data - in production this would come from API
    const mockInventory = [
      { id: 1, name: 'Wood Frame Molding - Oak', category: 'Frame', quantity: 120, minQuantity: 50, unit: 'ft' },
      { id: 2, name: 'Museum Glass', category: 'Glazing', quantity: 15, minQuantity: 20, unit: 'sheets' },
      { id: 3, name: 'White Mat Board', category: 'Matting', quantity: 45, minQuantity: 30, unit: 'sheets' },
      { id: 4, name: 'Black Mat Board', category: 'Matting', quantity: 8, minQuantity: 20, unit: 'sheets' },
      { id: 5, name: 'Metal Frame - Silver', category: 'Frame', quantity: 85, minQuantity: 40, unit: 'ft' },
      { id: 6, name: 'Corner Brackets', category: 'Hardware', quantity: 250, minQuantity: 100, unit: 'pcs' },
      { id: 7, name: 'Hanging Wire', category: 'Hardware', quantity: 500, minQuantity: 200, unit: 'ft' },
      { id: 8, name: 'Non-Glare Glass', category: 'Glazing', quantity: 22, minQuantity: 15, unit: 'sheets' },
    ];
    
    if (!stockSearchQuery) return mockInventory;
    
    return mockInventory.filter(item => 
      item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(stockSearchQuery.toLowerCase())
    );
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
      
      <div className="lg:pl-64 flex flex-col flex-1 w-full min-w-0">
        <Header />
        
        <main className="flex-1 w-full">
          <div className="p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-primary mb-2">Production Board</h1>
          <p className="text-muted-foreground">Drag orders between stages to update their status</p>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="bg-card rounded-lg border border-border min-w-0 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    {/* Column Header */}
                    <div className={`p-3 rounded-t-lg ${stage.color} text-white flex-shrink-0`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm">{stage.title}</h3>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                          {stage.count}
                        </span>
                      </div>
                    </div>

                    {/* Orders in this stage */}
                    <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                      {orders
                        .filter(order => order.status === stage.id)
                        .map((order) => (
                          <div
                            key={order.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, order)}
                            className={`bg-background border border-border border-l-4 ${getPriorityColor(order.priority)} p-2 rounded cursor-move hover:bg-muted/50 transition-all duration-200 hover:shadow-md`}
                            data-testid={`kanban-card-${order.id}`}
                          >
                            {/* Header with Order Number and Priority */}
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-foreground text-sm" data-testid={`order-number-${order.id}`}>
                                  {order.orderNumber}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  order.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                  order.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`} data-testid={`priority-${order.id}`}>
                                  {order.priority?.toUpperCase() || 'NORMAL'}
                                </span>
                                {isOverdue(order.dueDate) && (
                                  <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-xs font-medium">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-2">
                              <p className="font-semibold text-primary text-sm" data-testid={`customer-name-${order.id}`}>
                                {order.customer.firstName} {order.customer.lastName}
                              </p>
                              {order.customer.phone && (
                                <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                              )}
                            </div>

                            {/* Order Description */}
                            <div className="mb-2">
                              <p className="text-xs text-foreground line-clamp-2">{order.description}</p>
                            </div>

                            {/* Frame Details */}
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground truncate">
                                {order.dimensions} • {order.frameStyle}
                              </p>
                            </div>

                            {/* Due Date */}
                            {order.dueDate && (
                              <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="text-xs text-muted-foreground">Due</span>
                                <span className={`text-xs font-medium ${isOverdue(order.dueDate) ? 'text-red-400' : 'text-foreground'}`}>
                                  {new Date(order.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                      {/* Empty state for columns */}
                      {orders.filter(order => order.status === stage.id).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-xs">No orders</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 flex-wrap">
          <Button 
            className="bg-primary text-primary-foreground" 
            data-testid="button-new-order"
            onClick={() => setLocation('/orders/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
          
          <Button 
            variant="outline" 
            data-testid="button-print-orders"
            onClick={handlePrintWorkOrders}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Work Orders
          </Button>
          
          <Dialog open={quickQuoteOpen} onOpenChange={setQuickQuoteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-quick-quote">
                <Calculator className="w-4 h-4 mr-2" />
                Quick Quote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Quote Calculator</DialogTitle>
                <DialogDescription>
                  Get an instant estimate for a framing project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Width (inches)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 16"
                      value={quickQuoteData.width}
                      onChange={(e) => setQuickQuoteData({...quickQuoteData, width: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Height (inches)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 20"
                      value={quickQuoteData.height}
                      onChange={(e) => setQuickQuoteData({...quickQuoteData, height: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Frame Type</Label>
                  <Select 
                    value={quickQuoteData.frameType} 
                    onValueChange={(v) => setQuickQuoteData({...quickQuoteData, frameType: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Frame</SelectItem>
                      <SelectItem value="premium">Premium Wood</SelectItem>
                      <SelectItem value="metal">Metal Frame</SelectItem>
                      <SelectItem value="custom">Custom Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Matting</Label>
                  <Select 
                    value={quickQuoteData.matting} 
                    onValueChange={(v) => setQuickQuoteData({...quickQuoteData, matting: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Matting</SelectItem>
                      <SelectItem value="single">Single Mat</SelectItem>
                      <SelectItem value="double">Double Mat</SelectItem>
                      <SelectItem value="triple">Triple Mat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Glazing</Label>
                  <Select 
                    value={quickQuoteData.glazing} 
                    onValueChange={(v) => setQuickQuoteData({...quickQuoteData, glazing: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Glass</SelectItem>
                      <SelectItem value="non-glare">Non-Glare Glass</SelectItem>
                      <SelectItem value="museum">Museum Glass</SelectItem>
                      <SelectItem value="acrylic">Acrylic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Estimated Price Range</div>
                  <div className="text-2xl font-bold">
                    ${calculateQuickQuote()}
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    setLocation('/orders/new');
                    setQuickQuoteOpen(false);
                  }}
                >
                  Create Full Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={stockCheckOpen} onOpenChange={setStockCheckOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-check-stock">
                <Package className="w-4 h-4 mr-2" />
                Check Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inventory Stock Check</DialogTitle>
                <DialogDescription>
                  Search and check current inventory levels
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search inventory items..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                />
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {getFilteredInventory().map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            item.quantity < item.minQuantity ? "text-red-500" : "text-green-500"
                          )}>
                            {item.quantity} {item.unit}
                          </p>
                          {item.quantity < item.minQuantity && (
                            <p className="text-xs text-red-500">Low Stock</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    setLocation('/inventory');
                    setStockCheckOpen(false);
                  }}
                >
                  Manage Inventory
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Reference Legend */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Priority Levels</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                <span className="text-sm">High Priority - Rush orders, special clients</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded flex-shrink-0"></div>
                <span className="text-sm">Medium Priority - Standard turnaround</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded flex-shrink-0"></div>
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