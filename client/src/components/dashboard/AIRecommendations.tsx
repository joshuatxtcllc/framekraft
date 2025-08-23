
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Frame, AlertTriangle, ArrowRight, X, Lightbulb, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface BusinessInsight {
  type: 'revenue_opportunity' | 'efficiency_improvement' | 'customer_retention' | 'inventory_alert';
  title: string;
  description: string;
  action_items: string[];
  impact_score: number;
  confidence: number;
}

export default function AIRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  // Get business data for AI analysis
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Generate business insights
  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-business-insights'],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/ai/business-insights", {
        businessData: {
          recentOrders: Array.isArray(orders) ? orders.slice(-50) : [],
          monthlyRevenue: (dashboardData as any)?.totalRevenue || 0,
          customerCount: (dashboardData as any)?.totalCustomers || 0,
          averageOrderValue: (dashboardData as any)?.averageOrderValue || 0,
          popularFrames: (dashboardData as any)?.popularFrames || [],
          seasonalData: (dashboardData as any)?.seasonalTrends || {}
        }
      });
      return response.json();
    },
    enabled: !!dashboardData && !!orders,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const dismissInsight = (title: string) => {
    setDismissedInsights(prev => [...prev, title]);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'revenue_opportunity':
        return <DollarSign className="h-4 w-4" />;
      case 'efficiency_improvement':
        return <TrendingUp className="h-4 w-4" />;
      case 'customer_retention':
        return <Frame className="h-4 w-4" />;
      case 'inventory_alert':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'revenue_opportunity':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'efficiency_improvement':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'customer_retention':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'inventory_alert':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Unable to generate insights</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeInsights = Array.isArray(insights) 
    ? insights.filter((insight: BusinessInsight) => !dismissedInsights.includes(insight.title))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Business Insights
          </div>
          <Button onClick={() => refetch()} variant="ghost" size="sm">
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeInsights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No new insights available</p>
            <p className="text-sm text-muted-foreground mt-2">
              AI is analyzing your business data for optimization opportunities
            </p>
          </div>
        ) : (
          activeInsights.slice(0, 3).map((insight: BusinessInsight, index: number) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                  <Button
                    onClick={() => dismissInsight(insight.title)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm mb-3 opacity-90">{insight.description}</p>
              
              <div className="space-y-1">
                <p className="text-xs font-medium opacity-75">Action Items:</p>
                <ul className="text-xs space-y-1">
                  {insight.action_items.slice(0, 2).map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <Badge variant="outline" className="text-xs">
                  Impact: {insight.impact_score}/10
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={() => {
                    // Navigate to AI assistant with context
                    window.location.href = `/ai-assistant?insight=${encodeURIComponent(insight.title)}`;
                  }}
                >
                  Learn More
                </Button>
              </div>
            </div>
          ))
        )}
        
        {activeInsights.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm">
              View All {activeInsights.length} Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
