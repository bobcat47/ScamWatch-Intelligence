import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } = options ?? {};
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [localUser, setLocalUser] = useState<{ id: number; name: string; email: string; avatar?: string } | null>(null);

  // Check for local auth token on mount
  useEffect(() => {
    const token = localStorage.getItem("local_auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setLocalUser({
          id: payload.userId,
          name: payload.name,
          email: payload.email,
        });
      } catch {
        localStorage.removeItem("local_auth_token");
      }
    }
  }, []);

  // Kimi OAuth user query
  const {
    data: kimiUser,
    isLoading: kimiLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
    },
  });

  const logout = useCallback(() => {
    // Clear local auth
    localStorage.removeItem("local_auth_token");
    setLocalUser(null);
    // Clear Kimi auth (via mutation)
    logoutMutation.mutate();
    // Reload to clear all state
    window.location.href = "/";
  }, [logoutMutation]);

  // Use whichever user is available
  const user = kimiUser ?? localUser;
  const isLoading = kimiLoading;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isAuthenticated, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
