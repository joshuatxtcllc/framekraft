import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Frame
} from "lucide-react";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  urgency?: 'normal' | 'high' | 'critical';
}

const mobileNavItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Receivables", href: "/receivables", icon: CreditCard, badge: "Critical", urgency: 'critical' },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Kanban", href: "/kanban", icon: LayoutDashboard },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Pricing", href: "/pricing", icon: Calculator },
  { label: "Frame Designer", href: "/virtual-frame-designer", icon: Frame },
  { label: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { label: "Communication", href: "/communication", icon: MessageCircle },
  { label: "Wholesalers", href: "/wholesalers", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function MobileNavigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const getBadgeVariant = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="md:hidden">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center space-x-2">
          <Frame className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">FrameCraft</span>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="mobile-nav-toggle">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Frame className="h-5 w-5 text-primary" />
                FrameCraft Navigation
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 py-6">
              <div className="space-y-2">
                {mobileNavItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div 
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent cursor-pointer",
                          isActive && "bg-accent text-accent-foreground font-medium"
                        )}
                        onClick={() => setIsOpen(false)}
                        data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          item.urgency === 'critical' && "text-destructive",
                          item.urgency === 'high' && "text-orange-500"
                        )} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant={getBadgeVariant(item.urgency)} className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}