import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Frame, LayoutDashboard, ShoppingBag, Users, Brain, Sparkles, Package, DollarSign, Settings, BarChart3, Building2, FileText, Database, Plus, Palette, ShoppingCart, TrendingUp, CheckCircle, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const activeOrdersCount = (orders as any[])?.filter((order: any) =>
    !['completed', 'cancelled'].includes(order.status)
  ).length || 0;

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: location === '/',
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
      current: location === '/orders',
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    {
      name: 'Production Board',
      href: '/kanban',
      icon: Kanban,
      current: location === '/kanban',
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      current: location === '/customers',
    },
    {
      name: 'AI Assistant',
      href: '/ai-assistant',
      icon: Brain,
      current: location === '/ai-assistant',
    },
    {
      name: 'Virtual Frame Designer',
      href: '/virtual-frame-designer',
      icon: Frame,
      current: location === '/virtual-frame-designer',
    },
  ];

  const businessTools = [
    {
      name: 'Receivables',
      href: '/receivables',
      icon: DollarSign,
      current: location === '/receivables',
    },
    {
      name: 'Price Structure',
      href: '/pricing',
      icon: DollarSign,
      current: location === '/pricing',
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: FileText,
      current: location === '/invoices',
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      current: location === '/inventory',
    },
    {
      name: 'Vendor Catalog',
      href: '/vendor-catalog',
      icon: Package,
      current: location === '/vendor-catalog',
    },
    {
      name: 'Wholesalers',
      href: '/wholesalers',
      icon: Building2,
      current: location === '/wholesalers',
    },
    {
      name: 'Finance',
      href: '/finance',
      icon: BarChart3,
      current: location === '/finance',
    },
    {
      name: 'API Explorer',
      href: '/api-explorer',
      icon: Database,
      current: location === '/api-explorer',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location === '/settings',
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-wood-600 overflow-y-auto">
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0 px-4 py-6 bg-wood-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-3">
              <Frame className="w-6 h-6 text-wood-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FrameCraft</h1>
              <p className="text-wood-200 text-sm">Business Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 px-2 pb-4 space-y-1">
          {/* Main Navigation */}
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "sidebar-nav-item",
                item.current
                  ? "sidebar-nav-item-active"
                  : "sidebar-nav-item-inactive"
              )}
            >
              <item.icon className="text-wood-200 mr-3 h-6 w-6" />
              {item.name}
              {item.badge && (
                <Badge className="ml-auto bg-accent text-wood-700" variant="secondary">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          {/* Quick Actions */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-wood-200 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="mt-2 space-y-1">
              <Link
                href="/orders"
                className="sidebar-nav-item sidebar-nav-item-inactive text-sm"
              >
                <Plus className="text-wood-200 mr-3 h-5 w-5" />
                New Order
              </Link>
              <Link
                href="/customers"
                className="sidebar-nav-item sidebar-nav-item-inactive text-sm"
              >
                <Users className="text-wood-200 mr-3 h-5 w-5" />
                Add Customer
              </Link>
            </div>
          </div>

          {/* Business Tools */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-wood-200 uppercase tracking-wider">
              Business Tools
            </h3>
            <div className="mt-2 space-y-1">
              {businessTools.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-nav-item",
                    item.current
                      ? "sidebar-nav-item-active"
                      : "sidebar-nav-item-inactive"
                  )}
                >
                  <item.icon className="text-wood-200 mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
              <Link
                href="/system-validation"
                className={cn(
                  "sidebar-nav-item",
                  location === "/system-validation"
                    ? "sidebar-nav-item-active"
                    : "sidebar-nav-item-inactive"
                )}
              >
                <CheckCircle className="text-wood-200 mr-3 h-6 w-6" />
                System Validation
              </Link>
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 flex bg-wood-700 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-sm font-medium text-wood-600">
                {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-xs font-medium text-wood-200">
                Business Owner
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}