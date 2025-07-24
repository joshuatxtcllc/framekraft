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
import AIAssistant from "@/pages/ai-assistant";
import APIExplorer from "@/pages/api-explorer";
import Pricing from "@/pages/pricing";
import Invoices from "@/pages/invoices";
import Wholesalers from "@/pages/wholesalers";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/customers" component={Customers} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/wholesalers" component={Wholesalers} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/api-explorer" element={<APIExplorer />} />
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