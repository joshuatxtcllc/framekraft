import { useState } from "react";
import { Search, Bell, Brain, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Frame, LayoutDashboard, ShoppingBag, Users, Package, DollarSign, Settings, BarChart3, Building2, FileText, Database } from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'API Explorer', href: '/api-explorer', icon: Database },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Price Structure', href: '/pricing', icon: DollarSign },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Wholesalers', href: '/wholesalers', icon: Building2 },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <div className="relative z-10 flex-shrink-0 flex h-16 bg-card shadow-sm border-b border-border">
        {/* Mobile menu button */}
        <button
          className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="flex-1 px-4 flex justify-between">
        {/* Search */}
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="relative w-full text-muted-foreground focus-within:text-foreground">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <Search className="h-5 w-5" />
              </div>
              <Input
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-0 focus:border-transparent sm:text-sm"
                placeholder="Search orders, customers, or products..."
                type="search"
              />
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-4 flex items-center md:ml-6 space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* AI Assistant Quick Access */}
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="icon"
          >
            <Brain className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black opacity-25"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile menu */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-wood-600 shadow-xl">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Logo */}
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
              <nav className="mt-5 flex-1 px-2 pb-4 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-wood-100 hover:bg-wood-700 hover:text-white group flex items-center px-2 py-2 text-base font-medium rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="text-wood-200 mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}