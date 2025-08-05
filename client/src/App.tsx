import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
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


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/customers" component={Customers} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/wholesalers" component={Wholesalers} />
          <Route path="/communication" component={Communication} />
          <Route path="/api-explorer" component={APIExplorer} />
          <Route path="/integration-settings" component={IntegrationSettings} />
          <Route path="/vendor-catalog" component={VendorCatalog} />
          <Route path="/virtual-frame-designer" component={VirtualFrameDesigner} />
          <Route path="/settings" component={Settings} />
          <Route path="/stripe-test" component={StripeTestPage} />
        </>
      )}
      <Route component={NotFound} />
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