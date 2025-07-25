
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Send, Eye, Database, Calendar, FileText, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: string;
  params?: string[];
  bodyExample?: any;
}

const API_ENDPOINTS: APIEndpoint[] = [
  // Customer endpoints
  { method: 'GET', path: '/api/customers', description: 'Get all customers', category: 'customers' },
  { method: 'GET', path: '/api/customers/:id', description: 'Get customer by ID', category: 'customers', params: ['id'] },
  { method: 'POST', path: '/api/customers', description: 'Create new customer', category: 'customers', 
    bodyExample: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '123-456-7890' } },
  { method: 'PUT', path: '/api/customers/:id', description: 'Update customer', category: 'customers', params: ['id'] },
  
  // Order endpoints
  { method: 'GET', path: '/api/orders', description: 'Get all orders', category: 'orders' },
  { method: 'GET', path: '/api/orders/:id', description: 'Get order by ID', category: 'orders', params: ['id'] },
  { method: 'POST', path: '/api/orders', description: 'Create new order', category: 'orders',
    bodyExample: { customerId: 1, description: 'Custom frame', totalAmount: '150.00', status: 'pending' } },
  { method: 'PUT', path: '/api/orders/:id', description: 'Update order', category: 'orders', params: ['id'] },
  
  // Project tracking
  { method: 'GET', path: '/api/orders/:id/steps', description: 'Get project steps', category: 'projects', params: ['id'] },
  { method: 'PUT', path: '/api/project-steps/:id', description: 'Update project step', category: 'projects', params: ['id'] },
  
  // Invoice endpoints
  { method: 'GET', path: '/api/invoices', description: 'Get all invoices', category: 'invoices' },
  { method: 'GET', path: '/api/invoices/:id', description: 'Get invoice by ID', category: 'invoices', params: ['id'] },
  { method: 'POST', path: '/api/invoices', description: 'Create new invoice', category: 'invoices' },
  
  // Wholesaler endpoints
  { method: 'GET', path: '/api/wholesalers', description: 'Get all wholesalers', category: 'wholesalers' },
  { method: 'GET', path: '/api/wholesalers/:id/products', description: 'Get wholesaler products', category: 'wholesalers', params: ['id'] },
  { method: 'GET', path: '/api/wholesalers/products/search', description: 'Search wholesaler products', category: 'wholesalers' },
  
  // Dashboard & Analytics
  { method: 'GET', path: '/api/dashboard/metrics', description: 'Get dashboard metrics', category: 'analytics' },
  { method: 'GET', path: '/api/ai/insights', description: 'Get AI insights', category: 'analytics' },
  { method: 'POST', path: '/api/ai/generate-insights', description: 'Generate new AI insights', category: 'analytics' },
  
  // Inventory
  { method: 'GET', path: '/api/inventory', description: 'Get inventory items', category: 'inventory' },
  { method: 'GET', path: '/api/inventory/low-stock', description: 'Get low stock items', category: 'inventory' },
  
  // Pricing
  { method: 'GET', path: '/api/pricing/structure', description: 'Get price structure', category: 'pricing' },
  { method: 'POST', path: '/api/pricing/structure', description: 'Create price item', category: 'pricing' },
];

const CATEGORY_ICONS = {
  customers: Users,
  orders: FileText,
  projects: Package,
  invoices: FileText,
  wholesalers: Database,
  analytics: Eye,
  inventory: Package,
  pricing: Database,
};

const CATEGORY_COLORS = {
  customers: 'bg-blue-500',
  orders: 'bg-green-500',
  projects: 'bg-purple-500',
  invoices: 'bg-orange-500',
  wholesalers: 'bg-red-500',
  analytics: 'bg-indigo-500',
  inventory: 'bg-yellow-500',
  pricing: 'bg-pink-500',
};

export default function APIExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { toast } = useToast();

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint => 
    selectedCategory === 'all' || endpoint.category === selectedCategory
  );

  const categories = ['all', ...Array.from(new Set(API_ENDPOINTS.map(e => e.category)))];

  const handleEndpointSelect = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setRequestBody(JSON.stringify(endpoint.bodyExample || {}, null, 2));
    setParams({});
    setResponse(null);
  };

  const executeRequest = async () => {
    if (!path) return;

    setIsLoading(true);
    setResponse(null); // Clear previous response
    
    try {
      let finalPath = path;
      
      // Replace path parameters
      Object.entries(params).forEach(([key, value]) => {
        finalPath = finalPath.replace(`:${key}`, value);
      });

      let requestOptions: any = {};
      if (method !== 'GET' && requestBody.trim()) {
        try {
          requestOptions.body = JSON.parse(requestBody);
        } catch (e) {
          toast({
            title: "Invalid JSON",
            description: "Please check your request body format",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      console.log(`Making ${method} request to ${finalPath}`, requestOptions.body);
      
      const result = await apiRequest(method as any, finalPath, requestOptions.body);
      let data;
      
      try {
        const responseText = await result.text();
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        data = { parseError: "Could not parse response as JSON" };
      }
      
      const responseObj = {
        status: result.status,
        statusText: result.statusText,
        data: data,
        headers: Object.fromEntries(result.headers.entries()),
        timestamp: new Date().toISOString(),
      };
      
      console.log('API Response:', responseObj);
      setResponse(responseObj);

      toast({
        title: "Request Successful",
        description: `${method} ${finalPath} - ${result.status}`,
      });

    } catch (error: any) {
      console.error('API Request Error:', error);
      
      const errorResponse = {
        status: error.status || 500,
        statusText: error.statusText || 'Error',
        data: { 
          error: error.message,
          details: error.toString()
        },
        headers: {},
        timestamp: new Date().toISOString(),
      };
      
      setResponse(errorResponse);

      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-2 lg:space-y-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">API Explorer</h1>
                <p className="text-sm lg:text-base text-muted-foreground">Test and interact with your FrameCraft APIs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* API Endpoints List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Database className="w-4 h-4 lg:w-5 lg:h-5" />
                    API Endpoints
                  </CardTitle>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="px-3 lg:px-4">
                  <ScrollArea className="h-[300px] lg:h-[500px] xl:h-[600px]">
                    <div className="space-y-2 pr-2 lg:pr-4">
                      {filteredEndpoints.map((endpoint, index) => {
                        const Icon = CATEGORY_ICONS[endpoint.category] || Database;
                        const colorClass = CATEGORY_COLORS[endpoint.category] || 'bg-gray-500';
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                              selectedEndpoint === endpoint ? 'border-primary bg-accent' : ''
                            }`}
                            onClick={() => handleEndpointSelect(endpoint)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'} className="text-xs">
                                {endpoint.method}
                              </Badge>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="text-sm font-mono text-muted-foreground mb-1 break-all">
                              {endpoint.path}
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              {endpoint.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Request Builder */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                    Request Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-4">
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 lg:mb-6">
                      <TabsTrigger value="request" className="text-sm">Request</TabsTrigger>
                      <TabsTrigger value="response" className="text-sm">Response</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="request" className="space-y-4 lg:space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4">
                        <div className="lg:col-span-1">
                          <Label htmlFor="method" className="text-sm font-medium">Method</Label>
                          <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="lg:col-span-3">
                          <Label htmlFor="path" className="text-sm font-medium">Endpoint Path</Label>
                          <Input
                            id="path"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="/api/customers"
                            className="mt-1 font-mono text-xs lg:text-sm"
                          />
                        </div>
                      </div>

                      {/* Path Parameters */}
                      {selectedEndpoint?.params && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Path Parameters</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedEndpoint.params.map(param => (
                              <div key={param} className="space-y-1">
                                <Label htmlFor={param} className="text-sm">{param}</Label>
                                <Input
                                  id={param}
                                  value={params[param] || ''}
                                  onChange={(e) => setParams(prev => ({ ...prev, [param]: e.target.value }))}
                                  placeholder={`Enter ${param}`}
                                  className="text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {method !== 'GET' && (
                        <div className="space-y-2">
                          <Label htmlFor="body" className="text-sm font-medium">Request Body (JSON)</Label>
                          <Textarea
                            id="body"
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            placeholder='{"key": "value"}'
                            className="font-mono text-sm h-32 resize-none"
                          />
                        </div>
                      )}

                      <Button onClick={executeRequest} disabled={isLoading || !path} className="w-full py-3 text-base">
                        {isLoading ? 'Sending...' : 'Send Request'}
                      </Button>
                    </TabsContent>

                    <TabsContent value="response" className="space-y-4">
                      {response ? (
                        <>
                          <div className="flex items-center gap-4 flex-wrap">
                            <Badge variant={response.status < 400 ? 'default' : 'destructive'}>
                              {response.status} {response.statusText}
                            </Badge>
                            {response.timestamp && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(response.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Response
                            </Button>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Response Body</Label>
                            <ScrollArea className="h-64 w-full rounded-md border bg-muted/50">
                              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                                {JSON.stringify(response.data, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Response Headers</Label>
                            <ScrollArea className="h-32 w-full rounded-md border bg-muted/50">
                              <pre className="p-4 text-sm font-mono">
                                {JSON.stringify(response.headers, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>

                          {/* Debug Info */}
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            <strong>Debug:</strong> Request completed at {response.timestamp} with status {response.status}
                          </div>
                        </>
                      ) : isLoading ? (
                        <div className="text-center text-muted-foreground py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                          Sending request...
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <div className="mb-4">📡</div>
                          <p>No response yet. Send a request to see the response here.</p>
                          <p className="text-xs mt-2">Select an endpoint from the left panel or manually enter a path above.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <Button
                    variant="outline"
                    className="h-16 md:h-20 flex flex-col gap-1 md:gap-2 text-xs md:text-sm"
                    onClick={() => handleEndpointSelect(API_ENDPOINTS.find(e => e.path === '/api/orders')!)}
                  >
                    <FileText className="w-4 h-4 md:w-6 md:h-6" />
                    Check Orders
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 md:h-20 flex flex-col gap-1 md:gap-2 text-xs md:text-sm"
                    onClick={() => handleEndpointSelect(API_ENDPOINTS.find(e => e.path === '/api/customers')!)}
                  >
                    <Users className="w-4 h-4 md:w-6 md:h-6" />
                    View Customers
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 md:h-20 flex flex-col gap-1 md:gap-2 text-xs md:text-sm"
                    onClick={() => handleEndpointSelect(API_ENDPOINTS.find(e => e.path === '/api/dashboard/metrics')!)}
                  >
                    <Eye className="w-4 h-4 md:w-6 md:h-6" />
                    Dashboard Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 md:h-20 flex flex-col gap-1 md:gap-2 text-xs md:text-sm"
                    onClick={() => handleEndpointSelect(API_ENDPOINTS.find(e => e.path === '/api/wholesalers/products/search')!)}
                  >
                    <Database className="w-4 h-4 md:w-6 md:h-6" />
                    Search Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
