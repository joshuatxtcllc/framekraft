import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const [, setLocation] = useLocation();
  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      // Extract user from the response
      return data.user || data;
    },
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

  // Don't redirect on 401 errors - let the router handle it

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        credentials: 'include'
      });
      if (!response.ok && response.status !== 302) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      // Clear the user query cache
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Redirect to login page
      setLocation('/login');
    }
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: authData,
    isLoading,
    isAuthenticated: !!authData && authData.id !== undefined,
    refetch,
    logout,
  };
}
