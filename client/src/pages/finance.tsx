
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, AlertCircle } from "lucide-react";

export default function Finance() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
    initialData: []
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    initialData: []
  });

  // Calculate financial metrics
  const totalRevenue = invoices.reduce((sum: number, invoice: any) => 
    sum + parseFloat(invoice.amount || 0), 0
  );

  const paidInvoices = invoices.filter((invoice: any) => invoice.status === 'paid');
  const unpaidInvoices = invoices.filter((invoice: any) => invoice.status === 'pending');
  
  const paidAmount = paidInvoices.reduce((sum: number, invoice: any) => 
    sum + parseFloat(invoice.amount || 0), 0
  );
  
  const outstandingAmount = unpaidInvoices.reduce((sum: number, invoice: any) => 
    sum + parseFloat(invoice.amount || 0), 0
  );

  const pendingOrders = orders.filter((order: any) => 
    ['pending', 'in_progress'].includes(order.status)
  );

  const projectedRevenue = pendingOrders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount || 0), 0
  );

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
                    Financial Overview
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track revenue, invoices, and financial performance
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Collected</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{paidInvoices.length} paid invoices</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">${outstandingAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{unpaidInvoices.length} pending invoices</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projected</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">${projectedRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{pendingOrders.length} pending orders</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue Breakdown</TabsTrigger>
                  <TabsTrigger value="reports">Financial Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Invoices</CardTitle>
                      <CardDescription>Track invoice status and payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No invoices found. Create your first invoice from an order.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {invoices.slice(0, 10).map((invoice: any) => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-medium">Invoice #{invoice.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(invoice.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${parseFloat(invoice.amount || 0).toFixed(2)}</div>
                                <Badge 
                                  variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                  className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {invoice.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="revenue" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Analysis</CardTitle>
                      <CardDescription>Revenue breakdown and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2">Payment Status</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Collected Revenue</span>
                              <span className="font-medium text-green-600">${paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Outstanding Invoices</span>
                              <span className="font-medium text-orange-600">${outstandingAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Projected from Orders</span>
                              <span className="font-medium text-blue-600">${projectedRevenue.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Collection Rate</h4>
                          <div className="text-2xl font-bold">
                            {totalRevenue > 0 ? ((paidAmount / totalRevenue) * 100).toFixed(1) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">Of total invoiced amount collected</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Reports</CardTitle>
                      <CardDescription>Generate and export financial reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col">
                          <FileText className="w-6 h-6 mb-2" />
                          Monthly P&L Statement
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col">
                          <CreditCard className="w-6 h-6 mb-2" />
                          Payment Summary
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col">
                          <TrendingUp className="w-6 h-6 mb-2" />
                          Revenue Trends
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col">
                          <AlertCircle className="w-6 h-6 mb-2" />
                          Outstanding Report
                        </Button>
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
