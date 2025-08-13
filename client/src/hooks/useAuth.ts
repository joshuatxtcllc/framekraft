import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // If we get a 401, redirect to login
  if (error && (error as any)?.status === 401) {
    window.location.href = '/api/login';
    return { user: null, isLoading: true, isAuthenticated: false };
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
