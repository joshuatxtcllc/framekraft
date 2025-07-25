import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Frame, AlertTriangle, ArrowRight, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/ai/insights"],
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/generate-insights", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights"] });
      toast({
        title: "Success",
        description: "New AI insights generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      });
    },
  });

  const markActionTakenMutation = useMutation({
    mutationFn: async (insightId: number) => {
      const response = await apiRequest("PUT", `/api/ai/insights/${insightId}/action-taken`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights"] });
      toast({
        title: "Success",
        description: "Insight marked as actioned",
      });
    },
  });

  const deleteInsightMutation = useMutation({
    mutationFn: async (insightId: number) => {
      const response = await apiRequest("DELETE", `/api/ai/insights/${insightId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights"] });
      toast({
        title: "Success",
        description: "AI recommendation deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete recommendation",
        variant: "destructive",
      });
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'revenue_opportunity':
        return TrendingUp;
      case 'efficiency_improvement':
        return Frame;
      case 'inventory_alert':
        return AlertTriangle;
      default:
        return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'revenue_opportunity':
        return 'text-green-600';
      case 'efficiency_improvement':
        return 'text-blue-600';
      case 'inventory_alert':
        return 'text-yellow-600';
      default:
        return 'text-primary';
    }
  };

  const mockInsights = [
    {
      id: 1,
      type: 'business_insight',
      title: 'Increase Wedding Season Revenue',
      description: 'Based on historical data, consider promoting wedding packages in March. You could increase revenue by an estimated 23%.',
      confidence: '0.85',
      actionTaken: false,
      metadata: {
        type: 'revenue_opportunity',
        actionItems: ['Create wedding package pricing', 'Launch targeted marketing campaign'],
        impactScore: 8
      }
    },
    {
      id: 2,
      type: 'business_insight',
      title: 'Popular Frame Alert',
      description: 'The "Modern Walnut" frame has 89% customer satisfaction. Consider recommending it for new orders.',
      confidence: '0.92',
      actionTaken: false,
      metadata: {
        type: 'efficiency_improvement',
        actionItems: ['Update recommendation system', 'Train staff on benefits'],
        impactScore: 7
      }
    },
    {
      id: 3,
      type: 'business_insight',
      title: 'Restock Reminder',
      description: 'Oak frame molding (2") is running low. Based on current orders, you\'ll need more by next week.',
      confidence: '0.95',
      actionTaken: false,
      metadata: {
        type: 'inventory_alert',
        actionItems: ['Contact supplier', 'Place order for oak molding'],
        impactScore: 6
      }
    }
  ];

  const displayInsights = insights || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>AI Recommendations</CardTitle>
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-primary" />
              <Badge variant="outline" className="text-primary border-primary">
                AI Powered
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            variant="outline"
            size="sm"
          >
            {generateInsightsMutation.isPending ? "Generating..." : "Refresh Insights"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayInsights.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No AI insights available</p>
                  <Button
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                    className="mt-2"
                    variant="outline"
                  >
                    Generate Insights
                  </Button>
                </div>
                {/* Show sample insights when no real data exists */}
                {(!insights || insights.length === 0) && mockInsights.map((insight: any) => {
                  const Icon = getInsightIcon(insight.metadata?.type || 'general');
                  const iconColor = getInsightColor(insight.metadata?.type || 'general');
                  
                  return (
                    <div
                      key={`mock-${insight.id}`}
                      className="border border-wood-200 rounded-lg p-4 bg-wood-50/50 opacity-75"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Icon className={`w-5 h-5 ${iconColor} mt-1`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-foreground">
                                {insight.title} <span className="text-xs text-muted-foreground">(Sample)</span>
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {insight.description}
                              </p>
                              {insight.metadata?.actionItems && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">Suggested actions:</p>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                                    {insight.metadata.actionItems.slice(0, 2).map((action: string, index: number) => (
                                      <li key={index}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {insight.confidence && (
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(parseFloat(insight.confidence) * 100)}% confidence
                                </Badge>
                              )}
                              {insight.metadata?.impactScore && (
                                <Badge variant="outline" className="text-xs">
                                  Impact: {insight.metadata.impactScore}/10
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="outline" className="text-xs">
                              Sample Insight
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              displayInsights.map((insight: any) => {
                const Icon = getInsightIcon(insight.metadata?.type || 'general');
                const iconColor = getInsightColor(insight.metadata?.type || 'general');
                
                return (
                  <div
                    key={insight.id}
                    className="border border-wood-200 rounded-lg p-4 bg-wood-50 hover:bg-wood-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Icon className={`w-5 h-5 ${iconColor} mt-1`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              {insight.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {insight.description}
                            </p>
                            {insight.metadata?.actionItems && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Suggested actions:</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                  {insight.metadata.actionItems.slice(0, 2).map((action: string, index: number) => (
                                    <li key={index}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {insight.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(parseFloat(insight.confidence) * 100)}% confidence
                              </Badge>
                            )}
                            {insight.metadata?.impactScore && (
                              <Badge variant="outline" className="text-xs">
                                Impact: {insight.metadata.impactScore}/10
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {insight.actionTaken ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Action Taken
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Pending Action
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!insight.actionTaken && (
                              <Button
                                onClick={() => markActionTakenMutation.mutate(insight.id)}
                                disabled={markActionTakenMutation.isPending}
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                              >
                                Apply suggestion
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteInsightMutation.mutate(insight.id)}
                              disabled={deleteInsightMutation.isPending}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
