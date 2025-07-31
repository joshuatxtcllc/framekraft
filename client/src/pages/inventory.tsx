
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import InventoryForm from "@/components/inventory/InventoryForm";
import StockAdjustmentDialog from "@/components/inventory/StockAdjustmentDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, Search, TrendingDown, Boxes, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import type { Inventory } from "../../../shared/schema";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  // Fetch inventory data
  const { data: inventory = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast.success("Inventory item deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete inventory item");
    },
  });

  const filteredInventory = inventory.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => (item.quantity || 0) <= (item.minQuantity || 0));
  const totalValue = inventory.reduce((sum, item) => sum + ((item.quantity || 0) * parseFloat(item.unitCost || "0")), 0);
  const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frames': return Package;
      case 'mats': return Boxes;
      case 'glazing': return Package;
      default: return Package;
    }
  };

  const handleDelete = (id: number, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col flex-1">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div>Loading inventory...</div>
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
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
                    Inventory Management
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track stock levels, manage suppliers, and monitor inventory costs
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Button variant="outline">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <InventoryForm />
                </div>
              </div>

              {/* Inventory Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalItems}</div>
                    <p className="text-xs text-muted-foreground">Items in stock</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">At cost value</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
                    <p className="text-xs text-muted-foreground">Items need reorder</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">SKUs</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventory.length}</div>
                    <p className="text-xs text-muted-foreground">Unique products</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="all-items" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all-items">All Items</TabsTrigger>
                  <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
                  <TabsTrigger value="categories">By Category</TabsTrigger>
                </TabsList>

                <TabsContent value="all-items" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Items</CardTitle>
                      <CardDescription>Complete inventory list with stock levels</CardDescription>
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, supplier, or category..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredInventory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {inventory.length === 0 ? "No inventory items yet. Add your first item to get started." : "No items match your search."}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredInventory.map((item) => {
                            const Icon = getCategoryIcon(item.category);
                            const isLowStock = (item.quantity || 0) <= (item.minQuantity || 0);
                            
                            return (
                              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                  <Icon className="w-8 h-8 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{item.itemName}</div>
                                    <div className="text-sm text-muted-foreground capitalize">{item.category}</div>
                                    {item.supplier && (
                                      <div className="text-sm text-muted-foreground">Supplier: {item.supplier}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right space-y-1">
                                    <div className="font-semibold">
                                      Stock: {item.quantity || 0}
                                      {isLowStock && (
                                        <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Min: {item.minQuantity || 0} | Cost: ${parseFloat(item.unitCost || "0").toFixed(2)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Value: ${((item.quantity || 0) * parseFloat(item.unitCost || "0")).toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="flex flex-col space-y-2">
                                    <StockAdjustmentDialog item={item} />
                                    <div className="flex space-x-2">
                                      <InventoryForm item={item} />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(item.id, item.itemName)}
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="low-stock" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                        Low Stock Items
                      </CardTitle>
                      <CardDescription>Items that need to be reordered</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {lowStockItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Great! No items are currently low on stock.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {lowStockItems.map((item) => {
                            const Icon = getCategoryIcon(item.category);
                            
                            return (
                              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg border-orange-200">
                                <div className="flex items-center space-x-4">
                                  <Icon className="w-8 h-8 text-orange-600" />
                                  <div>
                                    <div className="font-medium">{item.itemName}</div>
                                    <div className="text-sm text-muted-foreground capitalize">{item.category}</div>
                                    {item.supplier && (
                                      <div className="text-sm text-muted-foreground">Supplier: {item.supplier}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right space-y-1">
                                    <Badge variant="destructive">
                                      {item.quantity || 0} / {item.minQuantity || 0} threshold
                                    </Badge>
                                    <div className="text-sm text-muted-foreground">
                                      Suggested reorder: {(item.minQuantity || 0) * 2} units
                                    </div>
                                  </div>
                                  <StockAdjustmentDialog item={item} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['frames', 'mats', 'glazing', 'hardware', 'supplies', 'other'].map((category) => {
                      const categoryItems = inventory.filter(item => item.category === category);
                      const categoryValue = categoryItems.reduce((sum, item) => sum + ((item.quantity || 0) * parseFloat(item.unitCost || "0")), 0);
                      const categoryStock = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
                      const Icon = getCategoryIcon(category);
                      
                      if (categoryItems.length === 0) return null;
                      
                      return (
                        <Card key={category}>
                          <CardHeader>
                            <CardTitle className="flex items-center capitalize">
                              <Icon className="w-5 h-5 mr-2" />
                              {category}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Items:</span>
                                <span className="font-medium">{categoryItems.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Stock:</span>
                                <span className="font-medium">{categoryStock}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Value:</span>
                                <span className="font-medium">${categoryValue.toFixed(2)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
