import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  DollarSign,
  Building2,
  MessageCircle,
  Bot,
  Settings,
  Calculator,
  CreditCard,
  BarChart3,
  Palette,
  Menu,
  X,
  AlertTriangle,
  ChevronLeft,
  Frame
} from "lucide-react";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  urgency?: 'normal' | 'high' | 'critical';
  description?: string;
}

const navigationSections = [
  {
    title: "Dashboard & Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Business overview and metrics" },
      { label: "Analytics", href: "/analytics", icon: BarChart3, description: "Sales reports and insights" }
    ] as NavigationItem[]
  },
  {
    title: "Orders & Customers", 
    items: [
      { label: "Orders", href: "/orders", icon: Package, description: "Manage all custom frame orders" },
      { label: "Customers", href: "/customers", icon: Users, description: "Customer database and history" },
      { label: "Kanban Board", href: "/kanban", icon: LayoutDashboard, description: "Visual order workflow" }
    ] as NavigationItem[]
  },
  {
    title: "Financial Management",
    items: [
      { label: "Receivables", href: "/receivables", icon: CreditCard, description: "Track outstanding payments" },
      { label: "Invoices", href: "/invoices", icon: FileText, description: "Generate and manage invoices" },
      { label: "Pricing", href: "/pricing", icon: Calculator, description: "Frame pricing calculator" }
    ] as NavigationItem[]
  },
  {
    title: "Tools & Design",
    items: [
      { label: "Frame Designer", href: "/virtual-frame-designer", icon: Frame, description: "3D frame visualization" },
      { label: "AI Assistant", href: "/ai-assistant", icon: Bot, description: "Business insights and automation" },
      { label: "Communication", href: "/communication", icon: MessageCircle, description: "Customer contact tools" }
    ] as NavigationItem[]
  },
  {
    title: "Inventory & Suppliers",
    items: [
      { label: "Inventory", href: "/inventory", icon: Package, description: "Stock management" },
      { label: "Wholesalers", href: "/wholesalers", icon: Building2, description: "Supplier management" },
      { label: "Vendor Catalog", href: "/vendor-catalog", icon: Palette, description: "Frame and mat options" }
    ] as NavigationItem[]
  },
  {
    title: "Settings & Integration",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, description: "Business configuration" },
      { label: "Integrations", href: "/integration-settings", icon: Settings, description: "API and service setup" },
      { label: "API Explorer", href: "/api-explorer", icon: BarChart3, description: "Development tools" }
    ] as NavigationItem[]
  }
];

interface MainNavigationProps {
  className?: string;
}

export function MainNavigation({ className }: MainNavigationProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch metrics to get receivables data
  const { data: metrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getBadgeVariant = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      default: return 'secondary';
    }
  };

  // Update receivables badge based on actual data
  const getReceivablesBadge = () => {
    if (!metrics?.totalOutstanding) return null;
    
    const amount = metrics.totalOutstanding;
    if (amount > 3000) return { text: `$${(amount/1000).toFixed(1)}k`, urgency: 'critical' as const };
    if (amount > 1000) return { text: `$${(amount/1000).toFixed(1)}k`, urgency: 'high' as const };
    if (amount > 0) return { text: `$${amount.toFixed(0)}`, urgency: 'normal' as const };
    return null;
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Frame className="h-6 w-6 text-primary" />
          {!isCollapsed && (
            <span className="font-bold text-lg">FrameCraft</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          data-testid="nav-toggle-collapse"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">
                  {section.title}
                </h4>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  // Dynamic badge for receivables
                  const receivablesBadge = item.label === "Receivables" ? getReceivablesBadge() : null;
                  const displayBadge = receivablesBadge || (item.badge ? { text: item.badge, urgency: item.urgency } : null);

                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent group cursor-pointer",
                        isActive && "bg-accent text-accent-foreground font-medium"
                      )} data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          item.urgency === 'critical' && "text-destructive",
                          item.urgency === 'high' && "text-orange-500"
                        )} />
                        {!isCollapsed && (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span>{item.label}</span>
                                {displayBadge && (
                                  <Badge variant={getBadgeVariant(displayBadge.urgency)} className="text-xs">
                                    {displayBadge.text}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-accent-foreground/80">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {sectionIndex < navigationSections.length - 1 && !isCollapsed && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Business Management Platform</span>
          </div>
        </div>
      )}
    </div>
  );
}