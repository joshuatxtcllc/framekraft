import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Calendar, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function ReceivablesAlert() {
  const [, setLocation] = useLocation();
  
  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!metrics || (metrics.criticalReceivablesCount === 0 && metrics.totalOutstanding === 0)) {
    return null;
  }

  const hasCritical = metrics.criticalReceivablesCount > 0;
  const hasHighPriority = metrics.highPriorityReceivablesCount > 0;

  return (
    <Card className={`border-l-4 ${hasCritical ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' : hasHighPriority ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className={`h-5 w-5 ${hasCritical ? 'text-red-600' : hasHighPriority ? 'text-orange-600' : 'text-yellow-600'}`} />
          Receivables Alert
          {hasCritical && <Badge variant="destructive">CRITICAL</Badge>}
          {!hasCritical && hasHighPriority && <Badge variant="secondary" className="bg-orange-100 text-orange-800">HIGH PRIORITY</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalOutstanding || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Outstanding</div>
          </div>
          
          {metrics.criticalReceivablesCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.criticalReceivablesCount}
              </div>
              <div className="text-sm text-muted-foreground">Critical (30+ days)</div>
            </div>
          )}
          
          {metrics.highPriorityReceivablesCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.highPriorityReceivablesCount}
              </div>
              <div className="text-sm text-muted-foreground">High Priority (14+ days)</div>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalReceivablesCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Accounts</div>
          </div>
        </div>

        {hasCritical && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Business Survival Alert
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              You have {metrics.criticalReceivablesCount} account(s) over 30 days past due totaling{" "}
              <strong>{formatCurrency(metrics.totalCriticalAmount || 0)}</strong>. 
              Immediate action required to maintain cash flow.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={() => setLocation("/receivables")}
            className={hasCritical ? "bg-red-600 hover:bg-red-700" : hasHighPriority ? "bg-orange-600 hover:bg-orange-700" : ""}
            data-testid="button-view-receivables"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Manage Receivables
          </Button>
          
          {hasCritical && (
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
              <Calendar className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}