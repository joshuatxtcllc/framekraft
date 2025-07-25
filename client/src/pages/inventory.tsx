
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, Search, Plus, TrendingDown, Boxes } from "lucide-react";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock inventory data - in real app this would come from API
  const mockInventory = [
    { id: 1, name: "Black Wood Frame - 1\"", category: "frames", sku: "BWF001", stock: 25, lowStockThreshold: 10, cost: 8.50, retailPrice: 15.99, supplier: "FrameCo" },
    { id: 2, name: "White Mat Board - 32x40", category: "mats", sku: "WMB32", stock: 3, lowStockThreshold: 5, cost: 12.00, retailPrice: 25.00, supplier: "MatSupply" },
    { id: 3, name: "Museum Glass - 16x20", category: "glass", sku: "MG1620", stock: 8, lowStockThreshold: 3, cost: 35.00, retailPrice: 75.00, supplier: "GlassPro" },
    { id: 4, name: "Gold Ornate Frame - 2\"", category: "frames", sku: "GOF002", stock: 12, lowStockThreshold: 8, cost: 22.00, retailPrice: 45.99, supplier: "LuxFrames" },
    { id: 5, name: "Cream Mat Board - 32x40", category: "mats", sku: "CMB32", stock: 15, lowStockThreshold: 10, cost: 12.00, retailPrice: 25.00, supplier: "MatSupply" },
    { id: 6, name: "Regular Glass - 11x14", category: "glass", sku: "RG1114", stock: 20, lowStockThreshold: 15, cost: 8.00, retailPrice: 18.00, supplier: "GlassPro" },
  ];

  const filteredInventory = mockInventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = mockInventory.filter(item => item.stock <= item.lowStockThreshold);
  const totalValue = mockInventory.reduce((sum, item) => sum + (item.stock * item.cost), 0);
  const totalItems = mockInventory.reduce((sum, item) => sum + item.stock, 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frames': return Package;
      case 'mats': return Boxes;
      case 'glass': return Package;
      default: return Package;
    }
  };

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
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
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
                    <div className="text-2xl font-bold">{mockInventory.length}</div>
                    <p className="text-xs text-muted-foreground">Unique products</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="all-items" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all-items">All Items</TabsTrigger>
                  <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
                  <TabsTrigger value="categories">By Category</TabsTrigger>
                  <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                </TabsList>

                <TabsContent value="all-items" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Items</CardTitle>
                      <CardDescription>Complete inventory list with stock levels</CardDescription>
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or SKU..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredInventory.map((item) => {
                          const Icon = getCategoryIcon(item.category);
                          const isLowStock = item.stock <= item.lowStockThreshold;
                          
                          return (
                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Icon className="w-8 h-8 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                                  <div className="text-sm text-muted-foreground">Supplier: {item.supplier}</div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="font-semibold">
                                  Stock: {item.stock}
                                  {isLowStock && (
                                    <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Cost: ${item.cost} | Retail: ${item.retailPrice}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Value: ${(item.stock * item.cost).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                                    <div className="text-sm text-muted-foreground">Supplier: {item.supplier}</div>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <Badge variant="destructive">
                                    {item.stock} / {item.lowStockThreshold} threshold
                                  </Badge>
                                  <div className="text-sm text-muted-foreground">
                                    Suggested reorder: {item.lowStockThreshold * 2} units
                                  </div>
                                  <Button size="sm" className="mt-2">
                                    Reorder
                                  </Button>
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
                    {['frames', 'mats', 'glass'].map((category) => {
                      const categoryItems = mockInventory.filter(item => item.category === category);
                      const categoryValue = categoryItems.reduce((sum, item) => sum + (item.stock * item.cost), 0);
                      const categoryStock = categoryItems.reduce((sum, item) => sum + item.stock, 0);
                      const Icon = getCategoryIcon(category);
                      
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

                <TabsContent value="suppliers" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Supplier Summary</CardTitle>
                      <CardDescription>Inventory breakdown by supplier</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['FrameCo', 'MatSupply', 'GlassPro', 'LuxFrames'].map((supplier) => {
                          const supplierItems = mockInventory.filter(item => item.supplier === supplier);
                          const supplierValue = supplierItems.reduce((sum, item) => sum + (item.stock * item.cost), 0);
                          
                          return (
                            <div key={supplier} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-medium">{supplier}</div>
                                <div className="text-sm text-muted-foreground">
                                  {supplierItems.length} products
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${supplierValue.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">Inventory value</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
