import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import SignUp from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import NewOrder from "@/pages/order-new";
import EditOrder from "@/pages/order-edit";
import Customers from "@/pages/customers";
import Pricing from "@/pages/pricing";
import Invoices from "@/pages/invoices";
import Wholesalers from "@/pages/wholesalers";
import Settings from "./pages/settings";
import VendorCatalog from "./pages/vendor-catalog";
import Communication from "@/pages/communication";
import APIExplorer from "@/pages/api-explorer";
import IntegrationSettings from "@/pages/integration-settings";
import StripeTestPage from "./pages/stripe-test";
import VirtualFrameDesigner from "./pages/virtual-frame-designer";
import AIAssistant from "./pages/ai-assistant";
import Cart from "./pages/cart";
import Receivables from "./pages/receivables";
import KanbanBoard from "./pages/kanban";
import CustomerPortal from "./pages/customer-portal";
import OrderTracking from "./pages/order-tracking";
import SystemValidation from "@/pages/system-validation";
import Inventory from "@/pages/inventory";
import Finance from "@/pages/finance";
function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Protected routes that require authentication
  const protectedPaths = [
    '/', '/dashboard', '/orders', '/orders/new', '/orders/edit', '/customers', '/pricing', '/invoices', 
    '/wholesalers', '/communication', '/api-explorer', '/ai-assistant',
    '/cart', '/integration-settings', '/vendor-catalog', '/virtual-frame-designer',
    '/receivables', '/kanban', '/settings', '/stripe-test', '/system-validation', '/inventory', '/finance'
  ];

  // Public routes that don't require authentication
  const publicPaths = ['/login', '/signup', '/customer-portal', '/order-tracking', '/landing'];

  // Check if current path is protected and user is not authenticated
  useEffect(() => {
    if (!isLoading) {
      const isProtectedPath = protectedPaths.some(path => 
        location === path || location.startsWith(path + '/')
      );
      const isPublicPath = publicPaths.some(path => 
        location === path || location.startsWith(path + '/')
      );
      
      // If on a protected path and not authenticated, redirect to landing
      if (isProtectedPath && !isAuthenticated) {
        // Redirect root path to landing, others to login
        if (location === '/') {
          setLocation('/landing');
        } else {
          setLocation('/login');
        }
      }
      // If authenticated and on landing or root, redirect to dashboard
      else if (isAuthenticated && (location === '/landing' || location === '/')) {
        setLocation('/dashboard');
      }
    }
  }, [location, isAuthenticated, isLoading]);

  // Show loading only on initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/landing" component={Landing} />
      <Route path="/customer-portal" component={CustomerPortal} />
      <Route path="/order-tracking" component={OrderTracking} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignUp} />
      
      {/* Protected routes - require authentication */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/orders/new" component={NewOrder} />
          <Route path="/orders/edit/:id" component={EditOrder} />
          <Route path="/customers" component={Customers} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/finance" component={Finance} />
          <Route path="/wholesalers" component={Wholesalers} />
          <Route path="/communication" component={Communication} />
          <Route path="/api-explorer" component={APIExplorer} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/cart" component={Cart} />
          <Route path="/integration-settings" component={IntegrationSettings} />
          <Route path="/vendor-catalog" component={VendorCatalog} />
          <Route path="/virtual-frame-designer" component={VirtualFrameDesigner} />
          <Route path="/receivables" component={Receivables} />
          <Route path="/kanban" component={KanbanBoard} />
          <Route path="/settings" component={Settings} />
          <Route path="/stripe-test" component={StripeTestPage} />
          <Route path="/system-validation" component={SystemValidation} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          {/* Default route for non-authenticated users */}
          <Route path="/" component={Landing} />
          {/* 404 for non-authenticated users trying to access protected routes */}
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;