import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Sparkles, TrendingUp, Package, Users, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  color: string;
}

export default function AIQuickChat() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [quickMessage, setQuickMessage] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'revenue',
      label: 'Revenue Tips',
      icon: DollarSign,
      prompt: 'Give me 3 quick tips to increase revenue this week',
      color: 'text-green-600'
    },
    {
      id: 'efficiency',
      label: 'Efficiency',
      icon: TrendingUp,
      prompt: 'How can I improve order processing efficiency today?',
      color: 'text-blue-600'
    },
    {
      id: 'customer',
      label: 'Customer Ideas',
      icon: Users,
      prompt: 'Suggest customer engagement ideas for this month',
      color: 'text-purple-600'
    },
    {
      id: 'inventory',
      label: 'Stock Check',
      icon: Package,
      prompt: 'What inventory items should I focus on?',
      color: 'text-orange-600'
    }
  ];

  const sendQuickMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          message,
          context: { capability: 'business-manager' }
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data) => {
      setLastResponse(data.content);
      setQuickMessage('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleQuickAction = (prompt: string) => {
    sendQuickMessage.mutate(prompt);
  };

  const handleSendMessage = () => {
    if (quickMessage.trim()) {
      sendQuickMessage.mutate(quickMessage);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Quick Assistant
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Claude 3.5
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/ai-assistant')}
          >
            Full Chat →
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="justify-start h-auto py-2"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={sendQuickMessage.isPending}
              >
                <Icon className={`h-4 w-4 mr-2 ${action.color}`} />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Quick Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask a quick business question..."
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !sendQuickMessage.isPending) {
                handleSendMessage();
              }
            }}
            disabled={sendQuickMessage.isPending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!quickMessage.trim() || sendQuickMessage.isPending}
          >
            {sendQuickMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Response Display */}
        {sendQuickMessage.isPending && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        )}

        {lastResponse && !sendQuickMessage.isPending && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 mt-1 text-primary" />
              <div className="flex-1">
                <p className="text-sm whitespace-pre-wrap">{lastResponse}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 p-0 h-auto"
                  onClick={() => {
                    // Navigate to full AI assistant with context
                    setLocation(`/ai-assistant?message=${encodeURIComponent(lastResponse.substring(0, 100))}`);
                  }}
                >
                  Continue in full chat →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Powered by Claude AI</span>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs"
              onClick={() => setLocation('/ai-assistant')}
            >
              Open Full Assistant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}