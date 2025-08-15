import { ReactNode } from "react";
import { MainNavigation } from "./MainNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <MainNavigation className="h-full" />
        </div>
        
        {/* Main Content */}
        <main className={cn("flex-1 overflow-auto", className)}>
          {children}
        </main>
      </div>
      
      {/* Mobile Content (full screen) */}
      <div className="md:hidden flex-1 overflow-auto">
        <main className={cn("h-full", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}