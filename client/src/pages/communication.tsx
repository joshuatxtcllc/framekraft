import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Phone, Mail, MessageSquare, Settings, Save, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardDescription } from "@/components/ui/card";

export default function Communication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["/api/communication/settings"],
  });

  if (settingsError) {
    toast({
      title: "Error",
      description: (settingsError as any).message || "Failed to load communication settings",
      variant: "destructive",
    });
  }

  const { data: callLogs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ["/api/communication/call-logs"],
  });

  if (logsError) {
    toast({
      title: "Error",
      description: (logsError as any).message || "Failed to load communication logs",
      variant: "destructive",
    });
  }

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/communication/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication/settings"] });
      toast({
        title: "Settings Updated",
        description: "Communication settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const testCallMutation = useMutation({
    mutationFn: async (data: { type: 'voice' | 'sms', phoneNumber: string }) => {
      const response = await apiRequest("POST", "/api/communication/test-call", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Test Call Initiated",
        description: `Test ${variables.type} call to ${variables.phoneNumber} has been sent successfully.`,
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Error",
        description: error.message || `Failed to initiate test ${variables.type} call`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (formData: FormData) => {
    const data = {
      twilioEnabled: formData.get('twilioEnabled') === 'on',
      emailEnabled: formData.get('emailEnabled') === 'on',
      smsEnabled: formData.get('smsEnabled') === 'on',
      autoCallsEnabled: formData.get('autoCallsEnabled') === 'on',
      callScript: formData.get('callScript'),
      notificationPhone: formData.get('notificationPhone'),
    };
    updateSettingsMutation.mutate(data);
  };

  const handleTestCall = (type: 'voice' | 'sms') => {
    const phoneNumber = (document.getElementById('notificationPhone') as HTMLInputElement)?.value;
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a test phone number in the settings.",
        variant: "destructive",
      });
      return;
    }
    testCallMutation.mutate({ type, phoneNumber });
  };

  if (settingsLoading || logsLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />

        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Communication Settings</h1>
                <p className="text-muted-foreground">Configure automated customer notifications</p>
              </div>
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>

            {/* Twilio Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Twilio Configuration
                </CardTitle>
                <CardDescription>
                  Configure voice calls and SMS notifications using Twilio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSettings(new FormData(e.currentTarget));
                }}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        name="twilioEnabled"
                        defaultChecked={settings?.twilioEnabled}
                        disabled={updateSettingsMutation.isPending}
                      />
                      <Label>Enable Twilio Integration</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          name="smsEnabled"
                          defaultChecked={settings?.smsEnabled}
                          disabled={!settings?.twilioEnabled || updateSettingsMutation.isPending}
                        />
                        <Label>SMS Notifications</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          name="autoCallsEnabled"
                          defaultChecked={settings?.autoCallsEnabled}
                          disabled={!settings?.twilioEnabled || updateSettingsMutation.isPending}
                        />
                        <Label>Automated Voice Calls</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notificationPhone">Test Phone Number</Label>
                      <Input
                        id="notificationPhone"
                        name="notificationPhone"
                        placeholder="+1234567890"
                        defaultValue={settings?.notificationPhone}
                        disabled={updateSettingsMutation.isPending}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => handleTestCall('sms')}
                        disabled={!settings?.twilioEnabled || testCallMutation.isPending}
                        variant="outline"
                      >
                        Test SMS
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleTestCall('voice')}
                        disabled={!settings?.twilioEnabled || testCallMutation.isPending}
                        variant="outline"
                      >
                        Test Voice Call
                      </Button>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={updateSettingsMutation.isPending}>
                        {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Call Script Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Call Script</CardTitle>
                <CardDescription>
                  Customize the message for automated voice calls. Use variables: {'{customerName}'}, {'{orderNumber}'}, {'{status}'}, {'{statusMessage}'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateSettingsMutation.mutate({ ...settings, callScript: formData.get('callScript') });
                }}>
                  <Textarea
                    id="callScript"
                    name="callScript"
                    defaultValue={settings?.callScript}
                    rows={4}
                    placeholder="Enter your call script here..."
                    disabled={updateSettingsMutation.isPending}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Script"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Communication Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
                <CardDescription>Recent automated communications</CardDescription>
              </CardHeader>
              <CardContent>
                {callLogs && callLogs.length > 0 ? (
                  <div className="space-y-2">
                    {callLogs.slice(0, 10).map((log: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {log.type === 'voice' ? <Phone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          <span className="text-sm">{log.recipient}</span>
                          <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No communication history yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}