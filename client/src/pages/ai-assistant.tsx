import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageCircle, Send, Bot, User, Settings, Zap, TrendingUp, Package, Users, FileText, Camera, BarChart3, Brain, Sparkles, DollarSign } from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    context?: any;
    tools_used?: string[];
  };
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  enabled: boolean;
  category: 'business' | 'production' | 'customer' | 'analytics' | 'creative';
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context: any }) => {
      const response = await apiRequest("POST", "/api/ai/message", { message, context });
      return response.json();
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          intent: response.intent,
          confidence: response.confidence,
          context: response.context,
          tools_used: response.tools_used,
        },
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        metadata: {
          intent: 'error',
          confidence: 0,
        },
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to process AI request",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const capabilities: AICapability[] = [
    {
      id: 'business-manager',
      name: 'Business Manager',
      description: 'Analyze business performance, suggest improvements, and provide strategic insights',
      icon: TrendingUp,
      enabled: true,
      category: 'business',
    },
    {
      id: 'production-manager',
      name: 'Production Manager',
      description: 'Optimize production workflow, manage schedules, and track progress',
      icon: Package,
      enabled: true,
      category: 'production',
    },
    {
      id: 'customer-advisor',
      name: 'Customer Advisor',
      description: 'Provide framing recommendations, pricing, and customer service support',
      icon: Users,
      enabled: true,
      category: 'customer',
    },
    {
      id: 'financial-analyst',
      name: 'Financial Analyst',
      description: 'Track expenses, analyze profitability, and provide financial forecasts',
      icon: DollarSign,
      enabled: true,
      category: 'analytics',
    },
    {
      id: 'design-consultant',
      name: 'Design Consultant',
      description: 'Suggest frame styles, mat colors, and design combinations',
      icon: Sparkles,
      enabled: true,
      category: 'creative',
    },
    {
      id: 'content-creator',
      name: 'Content Creator',
      description: 'Generate marketing content, blog posts, and social media updates',
      icon: FileText,
      enabled: true,
      category: 'creative',
    },
    {
      id: 'quality-inspector',
      name: 'Quality Inspector',
      description: 'Analyze artwork quality, detect issues, and ensure standards',
      icon: Camera,
      enabled: true,
      category: 'production',
    },
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      description: 'Analyze trends, generate reports, and provide business intelligence',
      icon: BarChart3,
      enabled: true,
      category: 'analytics',
    },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          content: `Hello ${user?.firstName || 'there'}! I'm your AI Assistant for FrameCraft. I can help you with:\n\n• Business analysis and strategy\n• Production optimization\n• Customer service and recommendations\n• Financial tracking and forecasting\n• Content creation and marketing\n• Quality control and inspection\n\nWhat would you like to work on today?`,
          timestamp: new Date(),
          metadata: {
            intent: 'greeting',
            confidence: 1.0,
            context: 'initialization',
          },
        },
      ]);
    }
  }, [user, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const context = {
      user: user,
      businessMetrics: dashboardData,
      frameData: orders?.slice(-10) || [],
      currentCapability: selectedCapability,
      conversationHistory: messages.slice(-5),
      timestamp: new Date().toISOString(),
    };

    sendMessageMutation.mutate({ message: inputMessage, context });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectCapability = (capabilityId: string) => {
    setSelectedCapability(capabilityId);
    setShowCapabilities(false);
    
    const capability = capabilities.find(c => c.id === capabilityId);
    if (capability) {
      const contextMessage: Message = {
        id: Date.now().toString() + '_context',
        type: 'assistant',
        content: `I'm now in ${capability.name} mode. ${capability.description}. How can I help you with this?`,
        timestamp: new Date(),
        metadata: {
          intent: 'capability_switch',
          confidence: 1.0,
          context: capabilityId,
        },
      };
      setMessages(prev => [...prev, contextMessage]);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const renderMessage = (message: Message) => (
    <div key={message.id} className={`message ${message.type}`}>
      <div className="flex items-start space-x-3">
        <div className="message-avatar">
          {message.type === 'user' ? (
            <User size={20} />
          ) : (
            <Bot size={20} />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {message.type === 'user' ? user?.firstName || 'You' : 'AI Assistant'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          </div>
          <div className="message-content">
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.metadata?.tools_used && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Tools used:</span>
                {message.metadata.tools_used.map((tool, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCapabilityGrid = () => (
    <div className="capabilities-grid">
      {capabilities.map(capability => {
        const Icon = capability.icon;
        return (
          <Card
            key={capability.id}
            className={`capability-card cursor-pointer transition-colors hover:bg-accent/10 ${
              selectedCapability === capability.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => selectCapability(capability.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{capability.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{capability.description}</p>
                  <Badge 
                    variant={capability.enabled ? "default" : "secondary"}
                    className="mt-2 text-xs"
                  >
                    {capability.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <div className="ai-assistant flex-1 flex flex-col">
          {/* AI Assistant Header */}
          <div className="ai-assistant-header">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedCapability 
                    ? `${capabilities.find(c => c.id === selectedCapability)?.name} Mode`
                    : 'General Business Assistant'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCapabilities(!showCapabilities)}
              >
                <Zap size={16} className="mr-2" />
                Capabilities
              </Button>
              <Button variant="ghost" size="icon">
                <Settings size={16} />
              </Button>
            </div>
          </div>

          {/* Capabilities Section */}
          {showCapabilities && (
            <div className="border-b border-border p-6 bg-muted/30">
              <h3 className="text-lg font-semibold mb-4">Available AI Capabilities</h3>
              {renderCapabilityGrid()}
            </div>
          )}

          {/* Chat Container */}
          <div className="chat-container flex-1 flex flex-col">
            {/* Messages */}
            <div className="messages-container flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="message assistant">
                  <div className="flex items-start space-x-3">
                    <div className="message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">AI Assistant</span>
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Container */}
            <div className="input-container">
              <div className="input-wrapper">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your business, orders, customers, or how I can help optimize your operations..."
                  className="message-input"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="send-button"
                >
                  <Send size={16} />
                </Button>
              </div>
              
              {/* Input Suggestions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("What's my business performance this month?")}
                >
                  📈 Business Performance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Help me optimize my production workflow")}
                >
                  ⚙️ Production Optimization
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Generate content for my social media")}
                >
                  📱 Marketing Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Analyze my customer trends")}
                >
                  👥 Customer Analysis
                </Button>
              </div>
            </div>
          </div>

          {/* AI Stats */}
          <div className="flex items-center justify-center space-x-8 py-4 border-t border-border bg-muted/30">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{messages.length}</div>
              <div className="text-xs text-muted-foreground">Messages Today</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {messages.length > 0 
                  ? Math.round((messages.filter(m => m.metadata?.confidence && m.metadata.confidence > 0.8).length / messages.length) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">AI Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {capabilities.filter(c => c.enabled).length}
              </div>
              <div className="text-xs text-muted-foreground">Active Capabilities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
