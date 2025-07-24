
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle, Zap, Mail, CreditCard, Search, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function IntegrationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/settings/integrations"],
  });

  const { data: healthData } = useQuery({
    queryKey: ["/api/health/integrations"],
    refetchInterval: 30000, // Check health every 30 seconds
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await apiRequest("PUT", "/api/settings/integrations", newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health/integrations"] });
      toast({
        title: "Success",
        description: "Integration settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (service: string, enabled: boolean) => {
    const currentSettings = settingsData?.settings || {};
    const newSettings = {
      ...currentSettings,
      [service]: {
        ...currentSettings[service],
        enabled
      }
    };
    updateSettingsMutation.mutate(newSettings);
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'gmail': return Mail;
      case 'openai': return Brain;
      case 'stripe': return CreditCard;
      case 'googleSearch': return Search;
      default: return Zap;
    }
  };

  const getStatusColor = (health: any) => {
    if (!health?.configured) return "destructive";
    if (!health?.enabled) return "secondary";
    if (health?.circuitBreaker?.state === "OPEN") return "destructive";
    return "default";
  };

  const getStatusIcon = (health: any) => {
    if (!health?.configured) return XCircle;
    if (!health?.enabled) return AlertTriangle;
    if (health?.circuitBreaker?.state === "OPEN") return XCircle;
    return CheckCircle;
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Integration Settings</h1>
              <p className="text-muted-foreground">
                Manage your API integrations with safety controls and circuit breakers
              </p>
            </div>

            <div className="grid gap-6">
              {/* Gmail Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-6 h-6 text-blue-600" />
                      <div>
                        <CardTitle>Gmail Integration</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Send invoices and order status updates via email
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusColor(healthData?.gmail)}>
                        {healthData?.gmail?.configured ? "Configured" : "Not Configured"}
                      </Badge>
                      <Switch
                        checked={settingsData?.settings?.gmail?.enabled || false}
                        onCheckedChange={(enabled) => handleToggle('gmail', enabled)}
                        disabled={!healthData?.gmail?.configured || updateSettingsMutation.isPending}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center space-x-2">
                        {healthData?.gmail && (() => {
                          const StatusIcon = getStatusIcon(healthData.gmail);
                          return <StatusIcon className="w-4 h-4" />;
                        })()}
                        <span className="text-sm">
                          {healthData?.gmail?.circuitBreaker?.state === "OPEN" 
                            ? "Circuit breaker open - temporarily disabled"
                            : healthData?.gmail?.enabled 
                              ? "Active" 
                              : "Disabled"
                          }
                        </span>
                      </div>
                    </div>
                    {healthData?.gmail?.circuitBreaker?.failures > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Failures: {healthData.gmail.circuitBreaker.failures}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* OpenAI Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-6 h-6 text-green-600" />
                      <div>
                        <CardTitle>OpenAI Integration</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Enhanced AI capabilities with GPT models
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusColor(healthData?.openai)}>
                        {healthData?.openai?.configured ? "Configured" : "Not Configured"}
                      </Badge>
                      <Switch
                        checked={settingsData?.settings?.openai?.enabled || false}
                        onCheckedChange={(enabled) => handleToggle('openai', enabled)}
                        disabled={!healthData?.openai?.configured || updateSettingsMutation.isPending}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center space-x-2">
                        {healthData?.openai && (() => {
                          const StatusIcon = getStatusIcon(healthData.openai);
                          return <StatusIcon className="w-4 h-4" />;
                        })()}
                        <span className="text-sm">
                          {settingsData?.settings?.openai?.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      <div>
                        <CardTitle>Stripe Payments</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Process payments and manage invoices
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusColor(healthData?.stripe)}>
                        {healthData?.stripe?.configured ? "Configured" : "Not Configured"}
                      </Badge>
                      <Switch
                        checked={settingsData?.settings?.stripe?.enabled || false}
                        onCheckedChange={(enabled) => handleToggle('stripe', enabled)}
                        disabled={!healthData?.stripe?.configured || updateSettingsMutation.isPending}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center space-x-2">
                        {healthData?.stripe && (() => {
                          const StatusIcon = getStatusIcon(healthData.stripe);
                          return <StatusIcon className="w-4 h-4" />;
                        })()}
                        <span className="text-sm">
                          {settingsData?.settings?.stripe?.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google Search Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Search className="w-6 h-6 text-red-600" />
                      <div>
                        <CardTitle>Google Search</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Market research and competitor analysis
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={getStatusColor(healthData?.googleSearch)}>
                        {healthData?.googleSearch?.configured ? "Configured" : "Not Configured"}
                      </Badge>
                      <Switch
                        checked={settingsData?.settings?.googleSearch?.enabled || false}
                        onCheckedChange={(enabled) => handleToggle('googleSearch', enabled)}
                        disabled={!healthData?.googleSearch?.configured || updateSettingsMutation.isPending}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center space-x-2">
                        {healthData?.googleSearch && (() => {
                          const StatusIcon = getStatusIcon(healthData.googleSearch);
                          return <StatusIcon className="w-4 h-4" />;
                        })()}
                        <span className="text-sm">
                          {settingsData?.settings?.googleSearch?.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Safety Features</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Circuit breakers automatically disable failing services</li>
                <li>• All integrations have retry limits and cooldown periods</li>
                <li>• Core app functionality continues even if integrations fail</li>
                <li>• Real-time health monitoring and status reporting</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
