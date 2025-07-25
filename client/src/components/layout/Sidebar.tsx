import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Frame, LayoutDashboard, ShoppingBag, Users, Brain, Sparkles, Package, DollarSign, Settings, BarChart3, Building2, FileText, Database } from "lucide-react";
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
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
    },
    {
      name: 'API Explorer',
      href: '/api-explorer',
      icon: Database,
    },
    {
      name: 'Integrations',
      href: '/integration-settings',
      icon: Settings,
    },
  ];

  const aiTools = [
    {
      name: 'AI Assistant',
      href: '/ai-assistant',
      icon: Brain,
    },
    {
      name: 'Frame Recommender',
      href: '/frame-recommender',
      icon: Sparkles,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      name: 'Price Structure',
      href: '/pricing',
      icon: DollarSign,
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: FileText,
    },
    {
      name: 'Wholesalers',
      href: '/wholesalers',
      icon: Building2,
    },
  ];

  const businessTools = [
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
    },
    {
      name: 'Finance',
      href: '/finance',
      icon: DollarSign,
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
          {navigationItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "sidebar-nav-item",
                isActive
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
          );
        })}

          {/* AI Tools Section */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-wood-200 uppercase tracking-wider">
              AI Tools
            </h3>
            <div className="mt-2 space-y-1">
              {aiTools.map((item) => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-nav-item",
                    isActive
                      ? "sidebar-nav-item-active"
                      : "sidebar-nav-item-inactive"
                  )}
                >
                  <item.icon className="text-wood-200 mr-3 h-6 w-6" />
                  {item.name}
                </Link>
                );
              })}
            </div>
          </div>

          {/* Business Tools */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-wood-200 uppercase tracking-wider">
              Business
            </h3>
            <div className="mt-2 space-y-1">
              {businessTools.map((item) => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-nav-item",
                    isActive
                      ? "sidebar-nav-item-active"
                      : "sidebar-nav-item-inactive"
                  )}
                >
                  <item.icon className="text-wood-200 mr-3 h-6 w-6" />
                  {item.name}
                </Link>
                );
              })}
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