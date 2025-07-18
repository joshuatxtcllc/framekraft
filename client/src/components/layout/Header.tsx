import { useState } from "react";
import { Search, Bell, Brain, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-card shadow-sm border-b border-border">
      {/* Mobile menu button */}
      <button
        className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-6 w-6" />
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
  );
}
