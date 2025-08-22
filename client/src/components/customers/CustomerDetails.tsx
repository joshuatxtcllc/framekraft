import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Calendar, ShoppingBag, DollarSign, User } from "lucide-react";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  totalSpent: string;
  orderCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface CustomerDetailsProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerDetails({ customer, isOpen, onClose }: CustomerDetailsProps) {
  if (!customer) return null;

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getCustomerTier = (totalSpent: number, orderCount: number) => {
    if (totalSpent >= 1000 || orderCount >= 5) {
      return { label: "VIP", className: "bg-gold-100 text-gold-800" };
    } else if (totalSpent >= 500 || orderCount >= 3) {
      return { label: "Premium", className: "bg-primary/10 text-primary" };
    } else if (orderCount >= 1) {
      return { label: "Regular", className: "bg-blue-100 text-blue-800" };
    } else {
      return { label: "New", className: "bg-green-100 text-green-800" };
    }
  };

  const tier = getCustomerTier(
    parseFloat(customer.totalSpent || "0"),
    customer.orderCount
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Customer Details</span>
            <Badge className={`${tier.className} px-3 py-1 rounded-full text-xs font-medium`}>
              {tier.label} Customer
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="w-4 h-4 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
              </div>
              
              {customer.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    {customer.email}
                  </p>
                </div>
              )}
              
              {customer.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    {customer.phone}
                  </p>
                </div>
              )}
              
              {(customer.address || customer.city || customer.state || customer.zipCode) && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span>
                      {customer.address && <>{customer.address}<br /></>}
                      {customer.city && `${customer.city}, `}
                      {customer.state} {customer.zipCode}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{customer.orderCount}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{formatCurrency(customer.totalSpent || "0")}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </div>
              
              {customer.orderCount > 0 && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Order Value</span>
                    <span className="font-medium">
                      {formatCurrency((parseFloat(customer.totalSpent || "0") / customer.orderCount).toFixed(2))}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer Since</span>
                <span className="text-sm font-medium">{formatDate(customer.createdAt)}</span>
              </div>
              {customer.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{formatDate(customer.updatedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}