import { useState, useEffect } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, Send, Eye, Database, FileText, Users, Package, 
  Shield, DollarSign, Settings, Brain, MessageSquare, Search, 
  Activity, Globe, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle, Info, Loader2, RefreshCw, Download,
  Upload, Key, Lock, Unlock, ShoppingCart, AlertTriangle,
  User, UserCheck, ShieldAlert, ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  subcategory?: string;
  params?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyExample?: any;
  headers?: Record<string, string>;
  authentication?: boolean;
  accessLevel: 'public' | 'user' | 'owner' | 'admin';
  scopeDescription?: string;
  responseExample?: any;
  notes?: string;
  userDataOnly?: boolean;
}

// User-accessible endpoints with proper scoping
const API_ENDPOINTS: APIEndpoint[] = [
  // ============ PUBLIC ENDPOINTS (No auth required) ============
  { 
    method: 'POST', 
    path: '/api/auth/login', 
    description: 'Login to your account', 
    category: 'authentication',
    subcategory: 'Session',
    accessLevel: 'public',
    authentication: false,
    bodyExample: { 
      email: 'your-email@example.com', 
      password: 'your-password'
    },
    scopeDescription: 'Public endpoint - no authentication required'
  },
  { 
    method: 'POST', 
    path: '/api/auth/signup', 
    description: 'Create a new account', 
    category: 'authentication',
    subcategory: 'Registration',
    accessLevel: 'public',
    authentication: false,
    bodyExample: { 
      email: 'your-email@example.com', 
      password: 'secure-password',
      firstName: 'Your',
      lastName: 'Name',
      businessName: 'Your Business'
    },
    scopeDescription: 'Public endpoint - creates a new user account'
  },
  { 
    method: 'POST', 
    path: '/api/auth/check-email', 
    description: 'Check if email is available', 
    category: 'authentication',
    subcategory: 'Validation',
    accessLevel: 'public',
    authentication: false,
    bodyExample: { email: 'check@example.com' },
    scopeDescription: 'Public endpoint - validates email availability'
  },
  { 
    method: 'GET', 
    path: '/api/public/track-order', 
    description: 'Track an order without login', 
    category: 'public',
    subcategory: 'Tracking',
    accessLevel: 'public',
    authentication: false,
    queryParams: {
      orderNumber: 'Your order number',
      lastName: 'Customer last name for verification'
    },
    scopeDescription: 'Public endpoint - track orders with order number and last name'
  },
  { 
    method: 'GET', 
    path: '/api/search', 
    description: 'Search public catalog', 
    category: 'search',
    subcategory: 'Public Search',
    accessLevel: 'public',
    authentication: false,
    queryParams: {
      q: 'Search query',
      types: 'products,services',
      limit: '10'
    },
    scopeDescription: 'Public endpoint - search available products and services'
  },

  // ============ USER-SPECIFIC ENDPOINTS (Your data only) ============
  { 
    method: 'GET', 
    path: '/api/auth/user', 
    description: 'Get your profile information', 
    category: 'authentication',
    subcategory: 'Profile',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns YOUR profile information only'
  },
  { 
    method: 'PUT', 
    path: '/api/auth/change-password', 
    description: 'Change your password', 
    category: 'authentication',
    subcategory: 'Security',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: { 
      currentPassword: 'your-current-password',
      newPassword: 'your-new-password'
    },
    scopeDescription: 'Changes YOUR password only'
  },
  { 
    method: 'POST', 
    path: '/api/auth/logout', 
    description: 'Logout from your account', 
    category: 'authentication',
    subcategory: 'Session',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Ends YOUR current session'
  },
  { 
    method: 'GET', 
    path: '/api/auth/download-data', 
    description: 'Download your personal data', 
    category: 'authentication',
    subcategory: 'Data Export',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Downloads YOUR data only as JSON'
  },
  { 
    method: 'DELETE', 
    path: '/api/auth/delete-account', 
    description: 'Delete your account', 
    category: 'authentication',
    subcategory: 'Account',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    notes: 'This will permanently delete YOUR account and all associated data!',
    scopeDescription: 'Deletes YOUR account only - this action is irreversible'
  },

  // ============ CUSTOMER MANAGEMENT (Your customers only) ============
  { 
    method: 'GET', 
    path: '/api/customers', 
    description: 'Get your customers list', 
    category: 'customers',
    subcategory: 'List',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns customers created by YOUR account only'
  },
  { 
    method: 'GET', 
    path: '/api/customers/:id', 
    description: 'Get specific customer details', 
    category: 'customers',
    subcategory: 'Details',
    params: { id: 'Your customer ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns details for YOUR customers only'
  },
  { 
    method: 'POST', 
    path: '/api/customers', 
    description: 'Create a new customer', 
    category: 'customers',
    subcategory: 'Create',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: { 
      firstName: 'Customer', 
      lastName: 'Name', 
      email: 'customer@example.com', 
      phone: '555-0123',
      address: '123 Main St',
      notes: 'Customer notes'
    },
    scopeDescription: 'Creates a customer under YOUR account'
  },
  { 
    method: 'PUT', 
    path: '/api/customers/:id', 
    description: 'Update your customer information', 
    category: 'customers',
    subcategory: 'Update',
    params: { id: 'Your customer ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: { 
      email: 'newemail@example.com',
      phone: '555-9876'
    },
    scopeDescription: 'Updates YOUR customers only'
  },
  { 
    method: 'DELETE', 
    path: '/api/customers/:id', 
    description: 'Delete your customer', 
    category: 'customers',
    subcategory: 'Delete',
    params: { id: 'Your customer ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    notes: 'Cannot delete if customer has orders',
    scopeDescription: 'Deletes YOUR customers only (without orders)'
  },

  // ============ ORDER MANAGEMENT (Your orders only) ============
  { 
    method: 'GET', 
    path: '/api/orders', 
    description: 'Get your orders', 
    category: 'orders',
    subcategory: 'List',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    queryParams: {
      status: 'pending|completed|in_progress',
      customerId: 'Your customer ID',
      limit: 'Number of results',
      offset: 'Pagination offset'
    },
    scopeDescription: 'Returns orders created by YOUR account only'
  },
  { 
    method: 'GET', 
    path: '/api/orders/:id', 
    description: 'Get your order details', 
    category: 'orders',
    subcategory: 'Details',
    params: { id: 'Your order ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns details for YOUR orders only'
  },
  { 
    method: 'POST', 
    path: '/api/orders', 
    description: 'Create a new order', 
    category: 'orders',
    subcategory: 'Create',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: { 
      customerId: 'your-customer-id',
      description: 'Order description',
      artworkDescription: 'Artwork details',
      dimensions: '24x36',
      frameStyle: 'Modern Black',
      totalAmount: 250.00,
      status: 'pending',
      notes: 'Special instructions'
    },
    scopeDescription: 'Creates an order under YOUR account'
  },
  { 
    method: 'PUT', 
    path: '/api/orders/:id', 
    description: 'Update your order', 
    category: 'orders',
    subcategory: 'Update',
    params: { id: 'Your order ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Updates YOUR orders only'
  },
  { 
    method: 'GET', 
    path: '/api/orders/:id/steps', 
    description: 'Get your order progress', 
    category: 'orders',
    subcategory: 'Tracking',
    params: { id: 'Your order ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns progress for YOUR orders only'
  },

  // ============ INVOICE MANAGEMENT (Your invoices only) ============
  { 
    method: 'GET', 
    path: '/api/invoices', 
    description: 'Get your invoices', 
    category: 'invoices',
    subcategory: 'List',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns invoices for YOUR account only'
  },
  { 
    method: 'GET', 
    path: '/api/invoices/:id', 
    description: 'Get your invoice details', 
    category: 'invoices',
    subcategory: 'Details',
    params: { id: 'Your invoice ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns details for YOUR invoices only'
  },
  { 
    method: 'POST', 
    path: '/api/invoices', 
    description: 'Create an invoice', 
    category: 'invoices',
    subcategory: 'Create',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      customerId: 'your-customer-id',
      orderId: 'your-order-id',
      dueDate: '2024-02-15',
      items: [
        { description: 'Item', quantity: 1, unitPrice: 100, totalPrice: 100 }
      ],
      taxAmount: 10,
      discountAmount: 0
    },
    scopeDescription: 'Creates an invoice under YOUR account'
  },
  { 
    method: 'POST', 
    path: '/api/invoices/:id/send', 
    description: 'Email your invoice', 
    category: 'invoices',
    subcategory: 'Communication',
    params: { id: 'Your invoice ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      emailAddress: 'customer@example.com',
      customMessage: 'Thank you for your business!'
    },
    scopeDescription: 'Sends YOUR invoices only'
  },
  { 
    method: 'POST', 
    path: '/api/invoices/:id/mark-paid', 
    description: 'Mark your invoice as paid', 
    category: 'invoices',
    subcategory: 'Payments',
    params: { id: 'Your invoice ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      paymentMethod: 'cash',
      amount: 250.00,
      notes: 'Payment received'
    },
    scopeDescription: 'Updates payment status for YOUR invoices only'
  },

  // ============ BUSINESS SETTINGS (Your settings only) ============
  { 
    method: 'GET', 
    path: '/api/settings/business', 
    description: 'Get your business settings', 
    category: 'settings',
    subcategory: 'Business',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns YOUR business settings only'
  },
  { 
    method: 'PUT', 
    path: '/api/settings/business', 
    description: 'Update your business settings', 
    category: 'settings',
    subcategory: 'Business',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      companyName: "Your Business Name",
      address: 'Your Address',
      phone: 'Your Phone',
      email: 'your-email@example.com',
      taxRate: 8.25
    },
    scopeDescription: 'Updates YOUR business settings only'
  },
  { 
    method: 'GET', 
    path: '/api/settings/notifications', 
    description: 'Get your notification preferences', 
    category: 'settings',
    subcategory: 'Notifications',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns YOUR notification settings only'
  },
  { 
    method: 'PUT', 
    path: '/api/settings/notifications', 
    description: 'Update your notification preferences', 
    category: 'settings',
    subcategory: 'Notifications',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      emailNotifications: true,
      orderUpdates: true,
      paymentReminders: true
    },
    scopeDescription: 'Updates YOUR notification preferences only'
  },

  // ============ DASHBOARD & METRICS (Your data only) ============
  { 
    method: 'GET', 
    path: '/api/dashboard/metrics', 
    description: 'Get your business metrics', 
    category: 'analytics',
    subcategory: 'Dashboard',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns metrics for YOUR business only'
  },

  // ============ INVENTORY (Your inventory only) ============
  { 
    method: 'GET', 
    path: '/api/inventory', 
    description: 'Get your inventory', 
    category: 'inventory',
    subcategory: 'List',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns YOUR inventory items only'
  },
  { 
    method: 'GET', 
    path: '/api/inventory/low-stock', 
    description: 'Get your low stock alerts', 
    category: 'inventory',
    subcategory: 'Alerts',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns low stock alerts for YOUR inventory only'
  },
  { 
    method: 'POST', 
    path: '/api/inventory', 
    description: 'Add inventory item', 
    category: 'inventory',
    subcategory: 'Create',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      itemName: 'Item Name',
      category: 'frame_molding',
      quantity: 100,
      minQuantity: 20,
      unitCost: 5.50
    },
    scopeDescription: 'Adds item to YOUR inventory'
  },
  { 
    method: 'PUT', 
    path: '/api/inventory/:id', 
    description: 'Update your inventory item', 
    category: 'inventory',
    subcategory: 'Update',
    params: { id: 'Your inventory item ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Updates YOUR inventory items only'
  },
  { 
    method: 'PATCH', 
    path: '/api/inventory/:id/stock', 
    description: 'Update stock quantity', 
    category: 'inventory',
    subcategory: 'Stock',
    params: { id: 'Your inventory item ID' },
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: { quantity: 150 },
    scopeDescription: 'Updates stock for YOUR inventory items only'
  },

  // ============ AI FEATURES (Context-aware for your business) ============
  { 
    method: 'POST', 
    path: '/api/ai/frame-recommendations', 
    description: 'Get AI recommendations for your order', 
    category: 'ai',
    subcategory: 'Recommendations',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      artworkDescription: 'Description of the artwork',
      dimensions: '24x36',
      budget: 500
    },
    scopeDescription: 'Provides recommendations based on YOUR inventory and pricing'
  },
  { 
    method: 'POST', 
    path: '/api/ai/business-insights', 
    description: 'Get insights for your business', 
    category: 'ai',
    subcategory: 'Analytics',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      businessData: {
        period: 'last_month'
      }
    },
    scopeDescription: 'Analyzes YOUR business data only'
  },

  // ============ WHOLESALER CATALOG (Read-only public data) ============
  { 
    method: 'GET', 
    path: '/api/wholesalers', 
    description: 'View available wholesalers', 
    category: 'wholesalers',
    subcategory: 'Catalog',
    accessLevel: 'user',
    authentication: true,
    scopeDescription: 'View catalog of available wholesalers (read-only)'
  },
  { 
    method: 'GET', 
    path: '/api/wholesalers/:id/products', 
    description: 'View wholesaler products', 
    category: 'wholesalers',
    subcategory: 'Products',
    params: { id: 'Wholesaler ID' },
    accessLevel: 'user',
    authentication: true,
    scopeDescription: 'View products from wholesaler catalog (read-only)'
  },
  { 
    method: 'GET', 
    path: '/api/wholesalers/products/search', 
    description: 'Search wholesaler products', 
    category: 'wholesalers',
    subcategory: 'Search',
    accessLevel: 'user',
    authentication: true,
    queryParams: {
      q: 'Search query'
    },
    scopeDescription: 'Search available products in catalog (read-only)'
  },

  // ============ PRICING (Your pricing rules) ============
  { 
    method: 'GET', 
    path: '/api/pricing/structure', 
    description: 'Get your pricing structure', 
    category: 'pricing',
    subcategory: 'Structure',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    scopeDescription: 'Returns YOUR pricing structure only'
  },
  { 
    method: 'POST', 
    path: '/api/pricing/structure', 
    description: 'Add pricing rule', 
    category: 'pricing',
    subcategory: 'Create',
    accessLevel: 'user',
    authentication: true,
    userDataOnly: true,
    bodyExample: {
      category: 'frame',
      itemName: 'Item Name',
      basePrice: 12.00,
      retailPrice: 15.60
    },
    scopeDescription: 'Adds pricing rule to YOUR account'
  },
];

const CATEGORY_ICONS: Record<string, any> = {
  authentication: Shield,
  customers: Users,
  orders: FileText,
  invoices: DollarSign,
  wholesalers: ShoppingCart,
  analytics: Eye,
  ai: Brain,
  inventory: Package,
  pricing: DollarSign,
  settings: Settings,
  public: Globe,
  search: Search,
};

const CATEGORY_COLORS: Record<string, string> = {
  authentication: 'bg-purple-500',
  customers: 'bg-blue-500',
  orders: 'bg-green-500',
  invoices: 'bg-orange-500',
  wholesalers: 'bg-amber-500',
  analytics: 'bg-pink-500',
  ai: 'bg-violet-500',
  inventory: 'bg-yellow-500',
  pricing: 'bg-emerald-500',
  settings: 'bg-gray-500',
  public: 'bg-lime-500',
  search: 'bg-teal-500',
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500',
  POST: 'bg-green-500',
  PUT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500'
};

const ACCESS_LEVEL_INFO = {
  public: {
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Public',
    description: 'No authentication required'
  },
  user: {
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'User',
    description: 'Requires authentication - accesses your data only'
  },
  owner: {
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Owner',
    description: 'Business owner access required'
  },
  admin: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Admin',
    description: 'Administrator access only'
  }
};

export default function APIExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['authentication', 'customers', 'orders']));
  const [showOnlyUserEndpoints, setShowOnlyUserEndpoints] = useState(true);
  
  const { toast } = useToast();

  // Get current user info
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        const data = await response.json();
        return data.user;
      } catch (error) {
        return null;
      }
    }
  });

  // Filter endpoints based on user access
  const accessibleEndpoints = API_ENDPOINTS.filter(endpoint => {
    // Always show public endpoints
    if (endpoint.accessLevel === 'public') return true;
    
    // If user is logged in, show user endpoints
    if (currentUser && endpoint.accessLevel === 'user') return true;
    
    // Don't show owner/admin endpoints to regular users
    if (showOnlyUserEndpoints && (endpoint.accessLevel === 'owner' || endpoint.accessLevel === 'admin')) {
      return false;
    }
    
    return false;
  });

  // Group endpoints by category
  const groupedEndpoints = accessibleEndpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = {};
    }
    const subcategory = endpoint.subcategory || 'General';
    if (!acc[endpoint.category][subcategory]) {
      acc[endpoint.category][subcategory] = [];
    }
    acc[endpoint.category][subcategory].push(endpoint);
    return acc;
  }, {} as Record<string, Record<string, APIEndpoint[]>>);

  const filteredEndpoints = accessibleEndpoints.filter(endpoint => {
    const categoryMatch = selectedCategory === 'all' || endpoint.category === selectedCategory;
    const searchMatch = searchTerm === '' || 
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.category.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const categories = ['all', ...Object.keys(groupedEndpoints).sort()];

  const handleEndpointSelect = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setRequestBody(JSON.stringify(endpoint.bodyExample || {}, null, 2));
    
    // Set default params
    const newParams: Record<string, string> = {};
    if (endpoint.params) {
      Object.keys(endpoint.params).forEach(key => {
        newParams[key] = '';
      });
    }
    setParams(newParams);
    
    // Set default query params
    const newQueryParams: Record<string, string> = {};
    if (endpoint.queryParams) {
      Object.keys(endpoint.queryParams).forEach(key => {
        newQueryParams[key] = '';
      });
    }
    setQueryParams(newQueryParams);
    
    setResponse(null);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const executeRequest = async () => {
    if (!path) return;

    setIsLoading(true);
    setResponse(null);
    
    try {
      let finalPath = path;
      
      // Replace path parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          finalPath = finalPath.replace(`:${key}`, value);
        }
      });

      // Add query parameters
      const queryString = Object.entries(queryParams)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      if (queryString) {
        finalPath += `?${queryString}`;
      }

      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...requestHeaders
      };

      // Prepare request options
      const requestOptions: RequestInit = {
        method: method,
        headers: headers,
        credentials: 'include', // Include cookies for session-based auth
      };

      // Add body for non-GET requests
      if (method !== 'GET' && method !== 'DELETE' && requestBody.trim() && requestBody !== '{}') {
        try {
          const parsedBody = JSON.parse(requestBody);
          requestOptions.body = JSON.stringify(parsedBody);
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

      console.log(`Making ${method} request to ${finalPath}`, requestOptions);
      
      const startTime = Date.now();
      const result = await fetch(finalPath, requestOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Get response data
      let data;
      const contentType = result.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await result.json();
      } else if (contentType?.includes('text/')) {
        data = await result.text();
      } else {
        // Try to parse as JSON first, fallback to text
        const text = await result.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text || 'No response body';
        }
      }
      
      const responseObj = {
        status: result.status,
        statusText: result.statusText,
        data: data,
        headers: Object.fromEntries(result.headers.entries()),
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        success: result.ok
      };
      
      console.log('API Response:', responseObj);
      setResponse(responseObj);

      // Show appropriate toast
      if (result.ok) {
        toast({
          title: "Request Successful",
          description: `${method} ${finalPath} - ${result.status} (${responseTime}ms)`,
        });
      } else {
        toast({
          title: "Request Completed with Error",
          description: `${method} ${finalPath} - ${result.status} ${result.statusText}`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('API Request Error:', error);
      
      const errorResponse = {
        status: 0,
        statusText: 'Network Error',
        data: { 
          error: error.message,
          details: error.toString(),
          type: 'NetworkError'
        },
        headers: {},
        timestamp: new Date().toISOString(),
        responseTime: 0,
        success: false
      };
      
      setResponse(errorResponse);

      toast({
        title: "Request Failed",
        description: error.message || 'Network error occurred',
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

  const generateCurlCommand = () => {
    let curl = `curl -X ${method}`;
    
    // Add headers
    curl += ` -H "Content-Type: application/json"`;
    Object.entries(requestHeaders).forEach(([key, value]) => {
      if (value) {
        curl += ` -H "${key}: ${value}"`;
      }
    });
    
    // Add body for non-GET requests
    if (method !== 'GET' && requestBody.trim() && requestBody !== '{}') {
      curl += ` -d '${requestBody}'`;
    }
    
    // Build final URL
    let finalPath = path;
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        finalPath = finalPath.replace(`:${key}`, value);
      }
    });
    
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      finalPath += `?${queryString}`;
    }
    
    curl += ` "${window.location.origin}${finalPath}"`;
    
    return curl;
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-2 lg:space-y-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">API Explorer</h1>
                <p className="text-sm lg:text-base text-muted-foreground">
                  Test your API endpoints • {accessibleEndpoints.length} endpoints available
                </p>
              </div>
              <div className="flex items-center gap-4">
                {currentUser ? (
                  <Badge variant="outline" className="py-1">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Logged in as: {currentUser.email}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="py-1">
                    <Globe className="w-4 h-4 mr-2" />
                    Public Access Only
                  </Badge>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <Alert className="mb-6">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Secure API Access</AlertTitle>
              <AlertDescription>
                This API Explorer respects user permissions. You can only access:
                <ul className="list-disc list-inside mt-2">
                  <li>Public endpoints (no authentication required)</li>
                  {currentUser && <li>Your own data (customers, orders, invoices, etc.)</li>}
                  {!currentUser && <li>Login to access your business data</li>}
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Endpoints List */}
              <div className="xl:col-span-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="w-5 h-5" />
                      Available Endpoints
                    </CardTitle>
                    <div className="space-y-3 mt-3">
                      <Input
                        placeholder="Search endpoints..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm"
                      />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center gap-2">
                                {category !== 'all' && CATEGORY_ICONS[category] && (
                                  <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category]}`} />
                                )}
                                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3">
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2 pr-3">
                        {selectedCategory === 'all' ? (
                          // Show grouped view
                          Object.entries(groupedEndpoints).map(([category, subcategories]) => {
                            const Icon = CATEGORY_ICONS[category] || Database;
                            const isExpanded = expandedCategories.has(category);
                            const categoryEndpoints = Object.values(subcategories).flat();

                            return (
                              <Collapsible key={category} open={isExpanded}>
                                <CollapsibleTrigger
                                  className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-lg transition-colors"
                                  onClick={() => toggleCategory(category)}
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  <Icon className="w-4 h-4" />
                                  <span className="font-medium capitalize">{category}</span>
                                  <Badge variant="secondary" className="ml-auto">
                                    {categoryEndpoints.length}
                                  </Badge>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-6 space-y-1 mt-1">
                                  {Object.entries(subcategories).map(([subcategory, endpoints]) => (
                                    <div key={subcategory} className="space-y-1">
                                      {subcategory !== 'General' && (
                                        <div className="text-xs text-muted-foreground font-medium px-2 py-1">
                                          {subcategory}
                                        </div>
                                      )}
                                      {endpoints.map((endpoint, index) => {
                                        const accessInfo = ACCESS_LEVEL_INFO[endpoint.accessLevel];
                                        return (
                                          <div
                                            key={`${category}-${subcategory}-${index}`}
                                            className={`p-2 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                                              selectedEndpoint === endpoint ? 'border-primary bg-accent' : ''
                                            }`}
                                            onClick={() => handleEndpointSelect(endpoint)}
                                          >
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge 
                                                className={`${METHOD_COLORS[endpoint.method]} text-white text-xs`}
                                              >
                                                {endpoint.method}
                                              </Badge>
                                              {endpoint.userDataOnly && (
                                                <Badge variant="outline" className="text-xs">
                                                  <User className="w-3 h-3 mr-1" />
                                                  Your Data
                                                </Badge>
                                              )}
                                              {!endpoint.authentication && (
                                                <Badge variant="outline" className="text-xs">
                                                  <Unlock className="w-3 h-3 mr-1" />
                                                  Public
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-xs font-mono text-muted-foreground break-all">
                                              {endpoint.path}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                              {endpoint.description}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })
                        ) : (
                          // Show filtered flat view
                          filteredEndpoints.map((endpoint, index) => {
                            const Icon = CATEGORY_ICONS[endpoint.category] || Database;
                            const accessInfo = ACCESS_LEVEL_INFO[endpoint.accessLevel];
                            
                            return (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                                  selectedEndpoint === endpoint ? 'border-primary bg-accent' : ''
                                }`}
                                onClick={() => handleEndpointSelect(endpoint)}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    className={`${METHOD_COLORS[endpoint.method]} text-white text-xs`}
                                  >
                                    {endpoint.method}
                                  </Badge>
                                  {endpoint.userDataOnly && (
                                    <Badge variant="outline" className="text-xs">
                                      <User className="w-3 h-3 mr-1" />
                                      Your Data
                                    </Badge>
                                  )}
                                  <Icon className="w-4 h-4 ml-auto" />
                                </div>
                                <div className="text-sm font-mono text-muted-foreground mb-1 break-all">
                                  {endpoint.path}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {endpoint.description}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Request Builder */}
              <div className="xl:col-span-8">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Send className="w-5 h-5" />
                        Request Builder
                      </CardTitle>
                      {selectedEndpoint && (
                        <div className="flex items-center gap-2">
                          {selectedEndpoint.userDataOnly && (
                            <Badge variant="outline" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              Accesses Your Data Only
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4">
                    <Tabs defaultValue="request" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="request">Request</TabsTrigger>
                        <TabsTrigger value="response">
                          Response
                          {response && (
                            <Badge 
                              variant={response.success ? "default" : "destructive"} 
                              className="ml-2 h-4 px-1 text-xs"
                            >
                              {response.status}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="docs">Documentation</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="request" className="space-y-4">
                        {selectedEndpoint ? (
                          <>
                            {/* Access Level Info */}
                            {selectedEndpoint.scopeDescription && (
                              <Alert className={`${ACCESS_LEVEL_INFO[selectedEndpoint.accessLevel].borderColor} border`}>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Data Scope</AlertTitle>
                                <AlertDescription>
                                  {selectedEndpoint.scopeDescription}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Method and Path */}
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-2">
                                <Label htmlFor="method" className="text-sm">Method</Label>
                                <Select value={method} onValueChange={setMethod} disabled>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.keys(METHOD_COLORS).map(m => (
                                      <SelectItem key={m} value={m}>
                                        <Badge className={`${METHOD_COLORS[m]} text-white`}>
                                          {m}
                                        </Badge>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-10">
                                <Label htmlFor="path" className="text-sm">Endpoint Path</Label>
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    id="path"
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                    placeholder="/api/..."
                                    className="font-mono text-sm"
                                    readOnly
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => copyToClipboard(path)}
                                    disabled={!path}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Path Parameters */}
                            {selectedEndpoint?.params && Object.keys(selectedEndpoint.params).length > 0 && (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Path Parameters</Label>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                                  {Object.entries(selectedEndpoint.params).map(([key, description]) => (
                                    <div key={key} className="space-y-1">
                                      <Label htmlFor={key} className="text-xs">
                                        {key} <span className="text-muted-foreground">({description})</span>
                                      </Label>
                                      <Input
                                        id={key}
                                        value={params[key] || ''}
                                        onChange={(e) => setParams(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={`Enter ${key}`}
                                        className="text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Query Parameters */}
                            {selectedEndpoint?.queryParams && Object.keys(selectedEndpoint.queryParams).length > 0 && (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Query Parameters</Label>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                                  {Object.entries(selectedEndpoint.queryParams).map(([key, description]) => (
                                    <div key={key} className="space-y-1">
                                      <Label htmlFor={`query-${key}`} className="text-xs">
                                        {key} <span className="text-muted-foreground">({description})</span>
                                      </Label>
                                      <Input
                                        id={`query-${key}`}
                                        value={queryParams[key] || ''}
                                        onChange={(e) => setQueryParams(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={description}
                                        className="text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Request Body */}
                            {method !== 'GET' && method !== 'DELETE' && (
                              <div className="space-y-2">
                                <Label htmlFor="body" className="text-sm font-medium">Request Body (JSON)</Label>
                                <Textarea
                                  id="body"
                                  value={requestBody}
                                  onChange={(e) => setRequestBody(e.target.value)}
                                  placeholder='{}'
                                  className="font-mono text-sm h-40 resize-none"
                                />
                              </div>
                            )}

                            {/* cURL Command */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">cURL Command</Label>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <code className="text-xs break-all">{generateCurlCommand()}</code>
                              </div>
                            </div>

                            {/* Execute Button */}
                            <Button 
                              onClick={executeRequest} 
                              disabled={isLoading || !path || (selectedEndpoint.authentication && !currentUser)} 
                              className="w-full py-5"
                              size="lg"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Sending Request...
                                </>
                              ) : selectedEndpoint.authentication && !currentUser ? (
                                <>
                                  <Lock className="w-5 h-5 mr-2" />
                                  Login Required
                                </>
                              ) : (
                                <>
                                  <Send className="w-5 h-5 mr-2" />
                                  Send Request
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16">
                            <Database className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Select an endpoint to start</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="response" className="space-y-4">
                        {response ? (
                          <>
                            {/* Response Status */}
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {response.success ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                                <div>
                                  <div className="font-medium">
                                    {response.status} {response.statusText}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {response.responseTime}ms • {new Date(response.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                            
                            {/* Response Body */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Response Body</Label>
                              <ScrollArea className="h-96 w-full rounded-lg border bg-background">
                                <pre className="p-4 text-sm font-mono">
                                  {typeof response.data === 'object' 
                                    ? JSON.stringify(response.data, null, 2)
                                    : response.data}
                                </pre>
                              </ScrollArea>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16">
                            <Database className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-2">No response yet</p>
                            <p className="text-xs text-muted-foreground">
                              Send a request to see the response
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="docs" className="space-y-4">
                        {selectedEndpoint ? (
                          <div className="space-y-6">
                            {/* Endpoint Info */}
                            <div>
                              <h3 className="font-semibold mb-3">Endpoint Information</h3>
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-sm text-muted-foreground">Method:</div>
                                  <div className="col-span-2">
                                    <Badge className={`${METHOD_COLORS[selectedEndpoint.method]} text-white`}>
                                      {selectedEndpoint.method}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-sm text-muted-foreground">Path:</div>
                                  <div className="col-span-2 font-mono text-sm">{selectedEndpoint.path}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-sm text-muted-foreground">Access Level:</div>
                                  <div className="col-span-2">
                                    <Badge variant="outline" className={ACCESS_LEVEL_INFO[selectedEndpoint.accessLevel].color}>
                                      {(() => {
                                        const Icon = ACCESS_LEVEL_INFO[selectedEndpoint.accessLevel].icon;
                                        return Icon ? <Icon className="w-3 h-3 mr-1" /> : null;
                                      })()}
                                      {ACCESS_LEVEL_INFO[selectedEndpoint.accessLevel].label}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-sm text-muted-foreground">Description:</div>
                                  <div className="col-span-2 text-sm">{selectedEndpoint.description}</div>
                                </div>
                                {selectedEndpoint.scopeDescription && (
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-sm text-muted-foreground">Data Scope:</div>
                                    <div className="col-span-2 text-sm">{selectedEndpoint.scopeDescription}</div>
                                  </div>
                                )}
                                {selectedEndpoint.notes && (
                                  <Alert className="mt-3">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{selectedEndpoint.notes}</AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>

                            <Separator />

                            {/* Request Body Example */}
                            {selectedEndpoint.bodyExample && (
                              <div>
                                <h3 className="font-semibold mb-3">Request Body Example</h3>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <pre className="text-sm font-mono">
                                    {JSON.stringify(selectedEndpoint.bodyExample, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16">
                            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Select an endpoint to view documentation</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{accessibleEndpoints.length}</p>
                      <p className="text-xs text-muted-foreground">Available Endpoints</p>
                    </div>
                    <Database className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {accessibleEndpoints.filter(e => e.accessLevel === 'public').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Public Endpoints</p>
                    </div>
                    <Globe className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {accessibleEndpoints.filter(e => e.userDataOnly).length}
                      </p>
                      <p className="text-xs text-muted-foreground">User-Scoped</p>
                    </div>
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{Object.keys(groupedEndpoints).length}</p>
                      <p className="text-xs text-muted-foreground">Categories</p>
                    </div>
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}