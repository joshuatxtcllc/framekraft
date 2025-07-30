
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
import { Phone, Mail, MessageSquare, Settings, Save } from "lucide-react";

export default function Communication() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/communication/settings"],
  });

  const { data: callLogs } = useQuery({
    queryKey: ["/api/communication/call-logs"],
  });

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
      setIsConfiguring(false);
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
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/communication/test-call", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Call Initiated",
        description: "Test call has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate test call",
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

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
                    Customer Communication
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage automated calls, emails, and SMS notifications for order updates.
                  </p>
                </div>
                <div className="mt-4 flex items-center space-x-3 md:mt-0 md:ml-4">
                  <Button
                    onClick={() => setIsConfiguring(!isConfiguring)}
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Communication Settings */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                      ) : (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveSettings(new FormData(e.currentTarget));
                        }}>
                          <div className="space-y-6">
                            {/* Twilio Voice Calls */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-base font-medium">
                                  <Phone className="h-4 w-4 inline mr-2" />
                                  Automated Voice Calls
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Enable automated status update calls via Twilio
                                </p>
                              </div>
                              <Switch
                                name="twilioEnabled"
                                defaultChecked={settings?.twilioEnabled}
                                disabled={!isConfiguring}
                              />
                            </div>

                            {/* Email Notifications */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-base font-medium">
                                  <Mail className="h-4 w-4 inline mr-2" />
                                  Email Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Send email updates for order status changes
                                </p>
                              </div>
                              <Switch
                                name="emailEnabled"
                                defaultChecked={settings?.emailEnabled}
                                disabled={!isConfiguring}
                              />
                            </div>

                            {/* SMS Notifications */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-base font-medium">
                                  <MessageSquare className="h-4 w-4 inline mr-2" />
                                  SMS Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Send SMS updates for order status changes
                                </p>
                              </div>
                              <Switch
                                name="smsEnabled"
                                defaultChecked={settings?.smsEnabled}
                                disabled={!isConfiguring}
                              />
                            </div>

                            {/* Auto Calls on Status Change */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-base font-medium">
                                  Automatic Kanban Calls
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Trigger calls when orders move in kanban board
                                </p>
                              </div>
                              <Switch
                                name="autoCallsEnabled"
                                defaultChecked={settings?.autoCallsEnabled}
                                disabled={!isConfiguring}
                              />
                            </div>

                            {/* Call Script */}
                            <div className="space-y-2">
                              <Label htmlFor="callScript">Voice Call Script Template</Label>
                              <Textarea
                                id="callScript"
                                name="callScript"
                                placeholder="Hello {customerName}, this is Jay's Frames. Your order #{orderNumber} status has been updated to {status}. {statusMessage}"
                                defaultValue={settings?.callScript}
                                disabled={!isConfiguring}
                                className="min-h-[100px]"
                              />
                              <p className="text-xs text-muted-foreground">
                                Available variables: {"{customerName}"}, {"{orderNumber}"}, {"{status}"}, {"{statusMessage}"}
                              </p>
                            </div>

                            {/* Test Phone Number */}
                            <div className="space-y-2">
                              <Label htmlFor="notificationPhone">Test/Notification Phone Number</Label>
                              <Input
                                id="notificationPhone"
                                name="notificationPhone"
                                placeholder="+1234567890"
                                defaultValue={settings?.notificationPhone}
                                disabled={!isConfiguring}
                              />
                            </div>

                            {isConfiguring && (
                              <div className="flex gap-2">
                                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Settings
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsConfiguring(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>

                  {/* Test Call Section */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Test Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Send a test communication to verify your settings are working correctly.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => testCallMutation.mutate({ type: 'voice' })}
                            disabled={testCallMutation.isPending}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Test Voice Call
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => testCallMutation.mutate({ type: 'sms' })}
                            disabled={testCallMutation.isPending}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Test SMS
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Communication Activity */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {callLogs && callLogs.length > 0 ? (
                          callLogs.slice(0, 5).map((log: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{log.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.recipient} • {new Date(log.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                                {log.status}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No communication activity yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Communication Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Calls Today</span>
                          <span className="text-sm font-medium">
                            {callLogs ? callLogs.filter((log: any) => 
                              new Date(log.createdAt).toDateString() === new Date().toDateString()
                            ).length : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate</span>
                          <span className="text-sm font-medium">
                            {callLogs && callLogs.length > 0 ? 
                              Math.round((callLogs.filter((log: any) => log.status === 'completed').length / callLogs.length) * 100) : 0
                            }%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
