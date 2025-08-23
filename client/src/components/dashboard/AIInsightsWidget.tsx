import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, TrendingUp, Users, Package, DollarSign, 
  AlertTriangle, Sparkles, ChevronRight, BarChart3 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface Metric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
}

export default function AIInsightsWidget() {
  const [, setLocation] = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState('Initializing AI...');

  const analysisSteps = [
    'Analyzing revenue patterns...',
    'Evaluating customer behavior...',
    'Checking inventory levels...',
    'Identifying growth opportunities...',
    'Generating recommendations...'
  ];

  useEffect(() => {
    // Simulate AI analysis progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsAnalyzing(false);
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 800);

    // Update analysis text
    const textInterval = setInterval(() => {
      setCurrentAnalysis(prev => {
        const currentIndex = analysisSteps.indexOf(prev);
        if (currentIndex < analysisSteps.length - 1) {
          return analysisSteps[currentIndex + 1];
        }
        clearInterval(textInterval);
        return prev;
      });
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  const metrics: Metric[] = [
    {
      label: 'AI Confidence',
      value: '94%',
      change: 5,
      trend: 'up',
      icon: Brain
    },
    {
      label: 'Opportunities Found',
      value: 7,
      change: 3,
      trend: 'up',
      icon: Sparkles
    },
    {
      label: 'Predicted Revenue',
      value: '+$2,450',
      change: 12,
      trend: 'up',
      icon: DollarSign
    },
    {
      label: 'Risk Alerts',
      value: 2,
      change: -1,
      trend: 'down',
      icon: AlertTriangle
    }
  ];

  const insights = [
    {
      type: 'opportunity',
      title: 'High-Value Customer Segment',
      description: 'Corporate clients show 40% higher order values',
      action: 'Target corporate marketing',
      impact: 'high'
    },
    {
      type: 'efficiency',
      title: 'Production Bottleneck',
      description: 'Tuesday afternoons have 30% slower processing',
      action: 'Optimize scheduling',
      impact: 'medium'
    },
    {
      type: 'trend',
      title: 'Seasonal Trend Detected',
      description: 'Holiday framing orders increasing 25% weekly',
      action: 'Stock premium materials',
      impact: 'high'
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            AI Analysis in Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentAnalysis}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-background rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Business Intelligence
            <Badge variant="secondary" className="ml-2">
              Live
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/ai-assistant')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}
                  >
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
                <div className="text-lg font-semibold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </div>
            );
          })}
        </div>

        {/* Key Insights */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Key Insights
          </h4>
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setLocation(`/ai-assistant?insight=${encodeURIComponent(insight.title)}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-medium">{insight.title}</h5>
                    <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <ChevronRight className="h-3 w-3" />
                    {insight.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => setLocation('/ai-assistant')}
        >
          <Brain className="h-4 w-4 mr-2" />
          Get Personalized Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}