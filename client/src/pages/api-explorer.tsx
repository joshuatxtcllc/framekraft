
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showQuickRef, setShowQuickRef] = useState(false);
  
  const { toast } = useToast();

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint => {
    const categoryMatch = selectedCategory === 'all' || endpoint.category === selectedCategory;
    const searchMatch = searchTerm === '' || 
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.method.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

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
        // First, get the response as text
        const responseText = await result.text();
        
        if (!responseText) {
          data = "Empty response";
        } else {
          try {
            // Try to parse the text as JSON
            data = JSON.parse(responseText);
          } catch (jsonError) {
            // If it's not JSON, return the raw text
            data = responseText;
          }
        }
      } catch (error) {
        data = { 
          error: "Could not read response", 
          details: error.message 
        };
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

  const renderFormattedResponse = (data: any): JSX.Element => {
    if (typeof data === 'string') {
      return <div className="text-sm">{data}</div>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <div className="text-sm text-muted-foreground italic">No data available</div>;
      }

      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-blue-600">
            Found {data.length} {data.length === 1 ? 'item' : 'items'}:
          </div>
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="border rounded-lg p-3 bg-muted/20">
              {renderObjectView(item, index + 1)}
            </div>
          ))}
          {data.length > 10 && (
            <div className="text-sm text-muted-foreground italic">
              ... and {data.length - 10} more items
            </div>
          )}
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      return (
        <div className="border rounded-lg p-3 bg-muted/20">
          {renderObjectView(data)}
        </div>
      );
    }

    return <div className="text-sm">{String(data)}</div>;
  };

  const renderObjectView = (obj: any, itemNumber?: number): JSX.Element => {
    const entries = Object.entries(obj);
    
    return (
      <div className="space-y-2">
        {itemNumber && (
          <div className="text-sm font-semibold text-primary">
            Item #{itemNumber}
          </div>
        )}
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
            </div>
            <div className="md:col-span-2 text-sm">
              {renderValue(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderValue = (value: any): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not set</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono">{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      // Handle dates
      if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
        return <span>{new Date(value).toLocaleString()}</span>;
      }
      
      // Handle status values
      if (['pending', 'completed', 'in_progress', 'cancelled'].includes(value.toLowerCase())) {
        const statusColors = {
          'pending': 'bg-yellow-500',
          'completed': 'bg-green-500',
          'in_progress': 'bg-blue-500',
          'cancelled': 'bg-red-500'
        };
        return (
          <Badge className={statusColors[value.toLowerCase() as keyof typeof statusColors] || 'bg-gray-500'}>
            {value.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      }
      
      // Handle email addresses
      if (value.includes('@')) {
        return <span className="text-blue-600">{value}</span>;
      }
      
      // Handle phone numbers
      if (value.match(/^\+?[\d\s\-\(\)]+$/) && value.length > 7) {
        return <span className="font-mono">{value}</span>;
      }
      
      // Handle currency values
      if (value.match(/^\d+\.\d{2}$/)) {
        return <span className="font-mono text-green-600">${value}</span>;
      }
      
      return <span>{value}</span>;
    }
    
    if (typeof value === 'object') {
      return (
        <details className="text-xs">
          <summary className="cursor-pointer text-blue-600">View details</summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs">
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      );
    }
    
    return <span>{String(value)}</span>;
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuickRef(true)}
                  className="text-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Quick Reference
                </Button>
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
                  <div className="space-y-2">
                    <Input
                      placeholder="Search endpoints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm"
                    />
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
                  </div>
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
                            <Tabs defaultValue="formatted" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="formatted">Formatted View</TabsTrigger>
                                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="formatted" className="mt-4">
                                <ScrollArea className="h-64 w-full rounded-md border bg-background">
                                  <div className="p-4">
                                    {renderFormattedResponse(response.data)}
                                  </div>
                                </ScrollArea>
                              </TabsContent>
                              
                              <TabsContent value="raw" className="mt-4">
                                <ScrollArea className="h-64 w-full rounded-md border bg-muted/50">
                                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                                    {JSON.stringify(response.data, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </TabsContent>
                            </Tabs>
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

            {/* How to Use Section */}
            <Card className="mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5" />
                  How the API Explorer Works
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-blue-600">🔧 Use the API Explorer Page</h3>
                    <p className="text-sm text-muted-foreground mb-2">Go to <code className="bg-muted px-1 py-0.5 rounded">/api-explorer</code> in your FrameCraft app (click "API Explorer" in the sidebar)</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-green-600">📡 Make API Calls from the Interface</h3>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Select an endpoint from the list (like "GET /api/orders")</li>
                      <li>• Click "Send Request"</li>
                      <li>• View the response data right in the interface</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-purple-600">🎯 The Data Shows Up in Your App Pages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-muted/50 p-3 rounded">
                        <strong>Orders data</strong> → Shows up on <code>/orders</code> page
                      </div>
                      <div className="bg-muted/50 p-3 rounded">
                        <strong>Customers data</strong> → Shows up on <code>/customers</code> page
                      </div>
                      <div className="bg-muted/50 p-3 rounded">
                        <strong>Dashboard metrics</strong> → Shows up on <code>/dashboard</code> page
                      </div>
                      <div className="bg-muted/50 p-3 rounded">
                        <strong>Inventory data</strong> → Shows up on <code>/inventory</code> page
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-orange-600">📍 Where to See Your Data</h3>
                    <p className="text-sm text-muted-foreground mb-2">When you call <code className="bg-muted px-1 py-0.5 rounded">GET /api/orders</code>, the order data appears in these places in your app:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• <strong>Orders Page</strong> (<code>/orders</code>) - Full table with all orders</li>
                      <li>• <strong>Dashboard</strong> (<code>/dashboard</code>) - Recent orders widget</li>
                      <li>• <strong>API Explorer</strong> (<code>/api-explorer</code>) - Raw JSON response</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800">📋 Example Workflow</h4>
                    <ol className="text-sm space-y-1 text-blue-700">
                      <li>1. Go to <strong>API Explorer</strong> → Select <code>GET /api/orders</code> → Click "Send Request"</li>
                      <li>2. Go to <strong>Orders page</strong> → See the same data in a user-friendly table</li>
                      <li>3. Go to <strong>Dashboard</strong> → See recent orders in the dashboard widget</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            {/* Quick Reference Dialog */}
            <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${showQuickRef ? '' : 'hidden'}`}>
              <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">API Quick Reference</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowQuickRef(false)}>
                      ✕
                    </Button>
                  </div>
                  
                  <div className="grid gap-6">
                    <div>
                      <h3 className="font-semibold mb-2 text-blue-600">🧑‍🤝‍🧑 Customer Management</h3>
                      <div className="text-sm space-y-1 ml-4">
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/customers</code> - List all customers</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/customers/1</code> - Get customer by ID</div>
                        <div><code className="bg-muted px-2 py-1 rounded">POST /api/customers</code> - Create new customer</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 text-green-600">📋 Order Management</h3>
                      <div className="text-sm space-y-1 ml-4">
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/orders</code> - List all orders</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/orders/1</code> - Get order by ID</div>
                        <div><code className="bg-muted px-2 py-1 rounded">POST /api/orders</code> - Create new order</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/orders/1/steps</code> - Get project steps</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 text-purple-600">📊 Dashboard & Analytics</h3>
                      <div className="text-sm space-y-1 ml-4">
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/dashboard/metrics</code> - Get business metrics</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/ai/insights</code> - Get AI insights</div>
                        <div><code className="bg-muted px-2 py-1 rounded">POST /api/ai/generate-insights</code> - Generate new insights</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 text-orange-600">💰 Invoices & Pricing</h3>
                      <div className="text-sm space-y-1 ml-4">
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/invoices</code> - List all invoices</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/pricing/structure</code> - Get pricing structure</div>
                        <div><code className="bg-muted px-2 py-1 rounded">POST /api/pricing/structure</code> - Add pricing item</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 text-red-600">🏪 Wholesalers & Inventory</h3>
                      <div className="text-sm space-y-1 ml-4">
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/wholesalers</code> - List wholesalers</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/inventory</code> - View inventory</div>
                        <div><code className="bg-muted px-2 py-1 rounded">GET /api/inventory/low-stock</code> - Low stock items</div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">💡 Pro Tips:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Use the search box to quickly find endpoints</li>
                        <li>• Click any endpoint from the list to auto-fill the request builder</li>
                        <li>• Most GET endpoints don't require authentication in development</li>
                        <li>• Replace :id in paths with actual numbers (e.g., :id → 1)</li>
                        <li>• Check the Response tab to see what data comes back</li>
                      </ul>
                    </div>
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
