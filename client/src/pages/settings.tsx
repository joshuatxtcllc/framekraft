
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Bell, 
  Palette, 
  Shield, 
  DollarSign,
  Mail,
  Printer,
  Save,
  ExternalLink,
  Download,
  Key,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useLocation } from "wouter";

interface BusinessSettings {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  taxRate: number;
  defaultMarkup: number;
  laborRate: number;
  overheadCost: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  orderUpdates: boolean;
  paymentReminders: boolean;
  lowInventory: boolean;
  dailyReports: boolean;
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showPriceBreakdown: boolean;
  defaultCurrency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState("business");
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Business Settings
  const { data: businessSettings, isLoading: businessLoading } = useQuery({
    queryKey: ["/api/settings/business"],
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: Partial<BusinessSettings>) => {
      const response = await apiRequest("PUT", "/api/settings/business", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/business"] });
      toast({
        title: "Success",
        description: "Business settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business settings",
        variant: "destructive",
      });
    },
  });

  // Notification Settings
  const { data: notificationSettings, isLoading: notificationLoading } = useQuery({
    queryKey: ["/api/settings/notifications"],
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      const response = await apiRequest("PUT", "/api/settings/notifications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/notifications"] });
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    },
  });

  // Display Settings
  const { data: displaySettings, isLoading: displayLoading } = useQuery({
    queryKey: ["/api/settings/display"],
  });

  const updateDisplayMutation = useMutation({
    mutationFn: async (data: Partial<DisplaySettings>) => {
      const response = await apiRequest("PUT", "/api/settings/display", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/display"] });
      toast({
        title: "Success",
        description: "Display settings updated successfully",
      });
    },
  });

  const [businessForm, setBusinessForm] = useState<BusinessSettings>(() => ({
    companyName: "Jay's Frames",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    taxRate: 8.25,
    defaultMarkup: 3.5,
    laborRate: 38,
    overheadCost: 54,
  }));

  // Update form when data is loaded
  React.useEffect(() => {
    if (businessSettings) {
      setBusinessForm({
        companyName: businessSettings.companyName || "Jay's Frames",
        address: businessSettings.address || "",
        city: businessSettings.city || "",
        state: businessSettings.state || "",
        zipCode: businessSettings.zipCode || "",
        phone: businessSettings.phone || "",
        email: businessSettings.email || "",
        website: businessSettings.website || "",
        taxRate: businessSettings.taxRate || 8.25,
        defaultMarkup: businessSettings.defaultMarkup || 3.5,
        laborRate: businessSettings.laborRate || 38,
        overheadCost: businessSettings.overheadCost || 54,
      });
    }
  }, [businessSettings]);

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessMutation.mutate(businessForm);
  };

  const handleNotificationToggle = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    updateNotificationMutation.mutate(newSettings);
  };

  const handleDisplayChange = (key: keyof DisplaySettings, value: any) => {
    const newSettings = { ...displaySettings, [key]: value };
    updateDisplayMutation.mutate(newSettings);
  };

  // Account Actions Mutations
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PUT", "/api/auth/change-password", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setChangePasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/auth/download-data");
      if (!response.ok) throw new Error("Failed to download data");
      const blob = await response.blob();
      return blob;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `framecraft-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Your data has been downloaded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/delete-account");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      // Redirect to login page after a short delay
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation.toLowerCase() !== "delete my account") {
      toast({
        title: "Error",
        description: "Please type 'delete my account' to confirm",
        variant: "destructive",
      });
      return;
    }
    deleteAccountMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your business settings and preferences
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="business" className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Business</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="display" className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Display</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center space-x-2">
                  <SettingsIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
              </TabsList>

              {/* Business Settings */}
              <TabsContent value="business" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5" />
                      <span>Business Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleBusinessSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={businessForm.companyName}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, companyName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={businessForm.phone}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={businessForm.address}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={businessForm.city}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={businessForm.state}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, state: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={businessForm.zipCode}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, zipCode: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={businessForm.email}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={businessForm.website}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, website: e.target.value }))}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxRate">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            step="0.01"
                            value={businessForm.taxRate}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="defaultMarkup">Default Markup</Label>
                          <Input
                            id="defaultMarkup"
                            type="number"
                            step="0.1"
                            value={businessForm.defaultMarkup}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, defaultMarkup: parseFloat(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="laborRate">Labor Rate ($)</Label>
                          <Input
                            id="laborRate"
                            type="number"
                            value={businessForm.laborRate}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, laborRate: parseFloat(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="overheadCost">Overhead Cost ($)</Label>
                          <Input
                            id="overheadCost"
                            type="number"
                            value={businessForm.overheadCost}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, overheadCost: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={updateBusinessMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Business Settings
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive general email notifications
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings?.emailNotifications || false}
                        onCheckedChange={(checked) => handleNotificationToggle('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Order Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when orders change status
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings?.orderUpdates || false}
                        onCheckedChange={(checked) => handleNotificationToggle('orderUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payment Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Remind customers about overdue payments
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings?.paymentReminders || false}
                        onCheckedChange={(checked) => handleNotificationToggle('paymentReminders', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Low Inventory Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get alerted when inventory is running low
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings?.lowInventory || false}
                        onCheckedChange={(checked) => handleNotificationToggle('lowInventory', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Daily Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive daily business summary reports
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings?.dailyReports || false}
                        onCheckedChange={(checked) => handleNotificationToggle('dailyReports', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Display Settings */}
              <TabsContent value="display" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>Display Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Price Breakdown</Label>
                        <p className="text-sm text-muted-foreground">
                          Display detailed pricing calculations in orders
                        </p>
                      </div>
                      <Switch
                        checked={displaySettings?.showPriceBreakdown || false}
                        onCheckedChange={(checked) => handleDisplayChange('showPriceBreakdown', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Use a more compact interface layout
                        </p>
                      </div>
                      <Switch
                        checked={displaySettings?.compactMode || false}
                        onCheckedChange={(checked) => handleDisplayChange('compactMode', checked)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Default Currency</Label>
                        <Input
                          value={displaySettings?.defaultCurrency || "USD"}
                          onChange={(e) => handleDisplayChange('defaultCurrency', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Input
                          value={displaySettings?.dateFormat || "MM/DD/YYYY"}
                          onChange={(e) => handleDisplayChange('dateFormat', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Integrations */}
              <TabsContent value="integrations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Integration Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base">Advanced Integration Settings</Label>
                        <p className="text-sm text-muted-foreground">
                          Manage API integrations, circuit breakers, and external services
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/integration-settings'}
                        className="flex items-center space-x-2"
                      >
                        <span>Open Integration Settings</span>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <SettingsIcon className="w-5 h-5" />
                      <span>Account Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={`${user?.firstName || ''} ${user?.lastName || ''}`} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user?.email || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>User ID</Label>
                        <Input value={user?.id || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Status</Label>
                        <div className="pt-2">
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Key className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Change Password</p>
                                <p className="text-sm text-muted-foreground">Update your account password</p>
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => setChangePasswordDialogOpen(true)}
                              >
                                Change Password
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Download className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Download Your Data</p>
                                <p className="text-sm text-muted-foreground">Export all your data in JSON format</p>
                              </div>
                              <Button 
                                variant="outline"
                                onClick={() => downloadDataMutation.mutate()}
                                disabled={downloadDataMutation.isPending}
                              >
                                {downloadDataMutation.isPending ? "Downloading..." : "Download Data"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-destructive">Delete Account</p>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                              </div>
                              <Button 
                                variant="destructive"
                                onClick={() => setDeleteAccountDialogOpen(true)}
                              >
                                Delete Account
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setChangePasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>Delete Account</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all of your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground mt-1">
                All your data including customers, orders, invoices, and settings will be permanently deleted.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-mono font-semibold">delete my account</span> to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete my account"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteAccountDialogOpen(false);
                setDeleteConfirmation("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
