import { useState } from "react";
import { Brain, Menu, X, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import { Link } from "wouter";
import { Frame, LayoutDashboard, ShoppingBag, Package, DollarSign, Settings, BarChart3, Building2, FileText, Database, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'API Explorer', href: '/api-explorer', icon: Database },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Brain },
    { name: 'Virtual Frame Designer', href: '/virtual-frame-designer', icon: Frame },
    { name: 'Price Structure', href: '/pricing', icon: DollarSign },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Wholesalers', href: '/wholesalers', icon: Building2 },
    { name: 'Finance', href: '/finance', icon: BarChart3 },
    { name: 'Inventory', href: '/inventory', icon: Package },
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

        <div className="flex-1 px-4 flex justify-between items-center">
        {/* Search */}
        <div className="flex-1 flex items-center">
          <div className="w-full flex md:ml-0 max-w-2xl">
            <SearchBar className="w-full" />
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-4 flex items-center md:ml-6 space-x-2">
          {/* AI Assistant Quick Access */}
          <Link href="/ai-assistant">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="icon"
              title="AI Assistant"
            >
              <Brain className="h-5 w-5" />
            </Button>
          </Link>

          {/* User Profile Dropdown */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>
                      {user.firstName?.[0]?.toUpperCase() || "U"}
                      {user.lastName?.[0]?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/login"}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
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
                    <h1 className="text-xl font-bold text-white">Jay's Frames</h1>
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