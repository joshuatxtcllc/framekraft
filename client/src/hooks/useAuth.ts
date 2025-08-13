import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Don't retry on 401s, but retry other errors up to 2 times
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Check URL for auth success parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Force refetch user data
      refetch();
    }
  }, [refetch]);

  // If we get a 401, redirect to login but not in a loop
  useEffect(() => {
    if (error && (error as any)?.status === 401 && !isLoading) {
      // Only redirect if we're not already on login page and no auth in progress
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/api/') && !window.location.search.includes('auth=')) {
        window.location.href = '/api/login';
      }
    }
  }, [error, isLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user?.isAuthenticated,
    refetch,
  };
}
