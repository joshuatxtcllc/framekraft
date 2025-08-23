import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Package, Users, ShoppingBag, FileText, Boxes, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  type: 'order' | 'customer' | 'product' | 'invoice' | 'inventory';
  title: string;
  subtitle: string;
  meta: any;
  url: string;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ className, placeholder, autoFocus }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=8`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!searchResults?.results?.all?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.results.all.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.results.all.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.results.all[selectedIndex]) {
          handleResultClick(searchResults.results.all[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [searchResults, selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    setLocation(result.url);
    setQuery("");
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'invoice':
        return <FileText className="w-4 h-4" />;
      case 'inventory':
        return <Boxes className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'customer':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'product':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'invoice':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'inventory':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatMoney = (amount: any) => {
    const value = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const hasResults = searchResults?.results?.all?.length > 0;

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder || "Search orders, customers, products..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "block w-full h-full pl-8 pr-3 py-2 border-transparent text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-0 focus:border-transparent sm:text-sm",
            className
          )}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-70 transition-opacity"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[480px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Search Header */}
          <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-primary/10">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Quick Search</h3>
                    {query && (
                      <p className="text-xs text-muted-foreground">
                        Results for "<span className="font-medium text-foreground">{query}</span>"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isLoading && searchResults?.results?.totalResults > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {searchResults.results.totalResults} results
                    </span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded"
                    title="Close (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Filters */}
            {!isLoading && searchResults?.results && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {['orders', 'customers', 'products', 'invoices', 'inventory'].map(type => {
                  const count = searchResults.results[type]?.length || 0;
                  if (count === 0) return null;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        // Scroll to the section
                        const element = document.querySelector(`[data-section="${type}"]`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="text-xs px-2 py-1 rounded-md bg-background/80 hover:bg-accent transition-colors capitalize flex items-center gap-1"
                    >
                      {getIcon(type)}
                      <span>{type}</span>
                      <span className="text-muted-foreground">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scrollable Results Area */}
          <div className="max-h-[380px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm font-medium">Searching...</p>
              <p className="text-xs mt-1 text-muted-foreground">Looking through your data</p>
            </div>
          ) : hasResults ? (
            <div className="py-1">
              {/* Group results by type */}
              {['orders', 'customers', 'products', 'invoices', 'inventory'].map(type => {
                const typeResults = searchResults.results[type];
                if (!typeResults?.length) return null;

                return (
                  <div key={type} className="" data-section={type}>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0 backdrop-blur-sm border-t first:border-t-0">
                      <div className="flex items-center gap-2">
                        {getIcon(type)}
                        <span>{type}</span>
                        <span className="text-[10px] font-normal">({typeResults.length})</span>
                      </div>
                    </div>
                    {typeResults.map((result: SearchResult, idx: number) => {
                      const globalIndex = searchResults.results.all.findIndex((r: SearchResult) => r.id === result.id);
                      const isSelected = selectedIndex === globalIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full px-4 py-3 flex items-start gap-3 hover:bg-accent/50 transition-all duration-150",
                            isSelected && "bg-accent"
                          )}
                        >
                          <div className={cn("p-2 rounded-md", getTypeColor(result.type))}>
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-foreground">{result.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</div>
                            {result.meta && (
                              <div className="flex gap-2 mt-1.5">
                                {result.meta.status && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    {result.meta.status}
                                  </span>
                                )}
                                {result.meta.amount && (
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {formatMoney(result.meta.amount)}
                                  </span>
                                )}
                                {result.meta.quantity !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    Stock: {result.meta.quantity}
                                    {result.meta.lowStock && (
                                      <span className="text-destructive ml-1 font-medium">• Low</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Show total results */}
              <div className="px-4 py-3 text-xs text-muted-foreground border-t bg-muted/20 flex items-center justify-between">
                <span>Found {searchResults.results.totalResults} results for "{query}"</span>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded">↑↓</kbd>
                  <span className="text-xs">Navigate</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded">↵</kbd>
                  <span className="text-xs">Select</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">
                Try searching with different keywords or check your spelling
              </p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}