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
    <Card className={`border-l-4 ${hasCritical ? 'border-l-red-500' : hasHighPriority ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-4 w-4 ${hasCritical ? 'text-red-600' : hasHighPriority ? 'text-orange-600' : 'text-yellow-600'}`} />
            Receivables Alert
          </CardTitle>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setLocation("/receivables")}
            className="h-8"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Manage Receivables
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(metrics.totalOutstanding || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Outstanding</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalReceivablesCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">Total Accounts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}