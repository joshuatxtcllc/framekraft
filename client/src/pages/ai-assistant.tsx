import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageCircle, Send, Bot, User, Settings, Zap, TrendingUp, 
  Package, Users, FileText, Camera, BarChart3, Brain, Sparkles, 
  DollarSign, Plus, History, Trash2, Download, ChevronRight,
  Loader2
} from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

interface ChatSession {
  _id: string;
  sessionName: string;
  messages: Message[];
  context: string;
  totalTokens: number;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  category: 'business' | 'production' | 'customer' | 'analytics' | 'creative';
  prompt: string;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/ai/sessions'],
    enabled: !!user,
  });

  // Fetch AI usage stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/ai/stats'],
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { sessionName: string; context: string }) => {
      const response = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      setMessages([]);
      setShowNewSessionDialog(false);
      setNewSessionName('');
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions'] });
      toast({
        title: "New Chat Started",
        description: "Your new chat session has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new chat session.",
        variant: "destructive",
      });
    },
  });

  // Load session mutation
  const loadSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/ai/sessions/${sessionId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load session');
      return response.json();
    },
    onSuccess: (data) => {
      const session = data.session;
      setCurrentSessionId(session._id);
      setMessages(session.messages.filter((m: Message) => m.role !== 'system'));
      setShowHistory(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load chat session.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId, context }: { 
      message: string; 
      sessionId?: string | null;
      context?: any;
    }) => {
      const response = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, sessionId, context }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata,
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (!currentSessionId && response.sessionId) {
        setCurrentSessionId(response.sessionId);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process your message.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/ai/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions'] });
      toast({
        title: "Session Deleted",
        description: "The chat session has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete chat session.",
        variant: "destructive",
      });
    },
  });

  const capabilities: AICapability[] = [
    {
      id: 'business-manager',
      name: 'Business Manager',
      description: 'Analyze business performance and provide strategic insights',
      icon: TrendingUp,
      enabled: true,
      category: 'business',
      prompt: 'Analyze my business performance and suggest improvements',
    },
    {
      id: 'production-manager',
      name: 'Production Manager',
      description: 'Optimize production workflow and track progress',
      icon: Package,
      enabled: true,
      category: 'production',
      prompt: 'Help me optimize my production workflow',
    },
    {
      id: 'customer-advisor',
      name: 'Customer Advisor',
      description: 'Provide framing recommendations and customer service',
      icon: Users,
      enabled: true,
      category: 'customer',
      prompt: 'Give me customer service tips and framing recommendations',
    },
    {
      id: 'financial-analyst',
      name: 'Financial Analyst',
      description: 'Track expenses and provide financial forecasts',
      icon: DollarSign,
      enabled: true,
      category: 'analytics',
      prompt: 'Analyze my financial data and provide insights',
    },
    {
      id: 'design-consultant',
      name: 'Design Consultant',
      description: 'Suggest frame styles and design combinations',
      icon: Sparkles,
      enabled: true,
      category: 'creative',
      prompt: 'Suggest frame designs and color combinations',
    },
    {
      id: 'content-creator',
      name: 'Content Creator',
      description: 'Generate marketing content and social media updates',
      icon: FileText,
      enabled: true,
      category: 'creative',
      prompt: 'Help me create marketing content',
    },
    {
      id: 'quality-inspector',
      name: 'Quality Inspector',
      description: 'Ensure quality standards and detect issues',
      icon: Camera,
      enabled: true,
      category: 'production',
      prompt: 'Help me establish quality control processes',
    },
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      description: 'Analyze trends and provide business intelligence',
      icon: BarChart3,
      enabled: true,
      category: 'analytics',
      prompt: 'Analyze my business data and identify trends',
    },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !currentSessionId) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hello ${user?.firstName || 'there'}! I'm your AI Assistant for FrameCraft. I can help you with:

• Business analysis and strategy
• Production optimization
• Customer service and recommendations
• Financial tracking and forecasting
• Design consultation
• Marketing and content creation
• Quality control
• Data analysis and insights

What would you like to work on today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length, currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const context = {
      capability: selectedCapability,
    };

    sendMessageMutation.mutate({ 
      message: inputMessage, 
      sessionId: currentSessionId,
      context 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectCapability = (capability: AICapability) => {
    setSelectedCapability(capability.id);
    setShowCapabilities(false);
    setInputMessage(capability.prompt);
  };

  const startNewSession = () => {
    if (!newSessionName.trim()) {
      setNewSessionName(`Chat ${new Date().toLocaleDateString()}`);
    }
    createSessionMutation.mutate({
      sessionName: newSessionName || `Chat ${new Date().toLocaleDateString()}`,
      context: selectedCapability || 'general',
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(dateObj);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with History */}
          <div className={`w-64 border-r bg-muted/30 flex flex-col ${showHistory ? 'block' : 'hidden lg:block'}`}>
            <div className="p-4 border-b">
              <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="default">
                    <Plus size={16} className="mr-2" />
                    New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                    <DialogDescription>
                      Create a new chat session to keep your conversations organized.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-name">Session Name</Label>
                      <Input
                        id="session-name"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        placeholder={`Chat ${new Date().toLocaleDateString()}`}
                      />
                    </div>
                    <Button onClick={startNewSession} className="w-full">
                      Start Chat
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Recent Chats
                </h3>
                {sessionsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                ) : (sessionsData as any)?.sessions && Array.isArray((sessionsData as any).sessions) && (sessionsData as any).sessions.length > 0 ? (
                  (sessionsData as any).sessions.map((session: any) => (
                    <Card
                      key={session._id}
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                        currentSessionId === session._id ? 'bg-accent' : ''
                      }`}
                      onClick={() => loadSessionMutation.mutate(session._id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {session.sessionName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(session.lastActivity)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSessionMutation.mutate(session._id);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No chat history yet
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Stats Section */}
            {statsData && (
              <div className="p-4 border-t bg-muted/50">
                <h3 className="text-sm font-semibold mb-3">Usage Stats</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today's Chats</span>
                    <span className="font-medium">{(statsData as any).todaySessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="font-medium">{(statsData as any).totalSessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens Used</span>
                    <span className="font-medium">{((statsData as any).totalTokens || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-lg font-semibold">AI Assistant</h1>
                  <p className="text-xs text-muted-foreground">
                    Powered by Claude 3.5 Sonnet
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="lg:hidden"
                >
                  <History size={16} className="mr-2" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCapabilities(!showCapabilities)}
                >
                  <Zap size={16} className="mr-2" />
                  Capabilities
                </Button>
              </div>
            </div>

            {/* Capabilities Grid */}
            {showCapabilities && (
              <div className="p-6 border-b bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">AI Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {capabilities.map(capability => {
                    const Icon = capability.icon;
                    return (
                      <Card
                        key={capability.id}
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onClick={() => selectCapability(capability)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon size={20} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{capability.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {capability.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' ? 'bg-primary' : 'bg-muted'
                      }`}>
                        {message.role === 'user' ? (
                          <User size={16} className="text-primary-foreground" />
                        ) : (
                          <Bot size={16} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.metadata?.processingTime && (
                            <Badge variant="secondary" className="text-xs">
                              {(message.metadata.processingTime / 1000).toFixed(1)}s
                            </Badge>
                          )}
                        </div>
                        <Card className={message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                          <CardContent className="p-3">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {message.metadata?.tokens && (
                              <p className="text-xs mt-2 opacity-70">
                                Tokens: {message.metadata.tokens}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="animate-spin" size={16} />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-background p-4">
              <div className="flex items-end space-x-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your framing business..."
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("What's my business performance this month?")}
                  disabled={isLoading}
                >
                  📊 Performance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Suggest frame styles for a modern artwork")}
                  disabled={isLoading}
                >
                  🎨 Frame Design
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Help me optimize my pricing strategy")}
                  disabled={isLoading}
                >
                  💰 Pricing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage("Generate marketing ideas for social media")}
                  disabled={isLoading}
                >
                  📱 Marketing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}