"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import { AuthContext } from "@/lib/authContext";
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAccessCookie,
  setRefreshCookie,
} from "@/lib/authCookie";
import { ApiError } from "@/lib/errors";
import { registerSessionHooks } from "@/lib/refreshSession";
import { showError } from "@/lib/toast";
import type { AuthState, LoginResult, User } from "@/lib/types";

interface AuthProviderProps {
  initialAccessToken: string | null;
  initialRefreshToken: string | null;
  children: React.ReactNode;
}

/** Provides authentication state, cookie persistence, and session restoration. */
export function AuthProvider({
  initialAccessToken,
  initialRefreshToken,
  children,
}: AuthProviderProps) {
  const router = useRouter();
  const hasInitialToken = Boolean(initialAccessToken || initialRefreshToken);

  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: initialAccessToken,
    refreshToken: initialRefreshToken,
    status: hasInitialToken ? "loading" : "anonymous",
  });

  const clearStateToAnonymous = useCallback(() => {
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "anonymous",
    });
  }, []);

  useEffect(() => {
    registerSessionHooks({
      onRefreshed(newAccessToken) {
        setState((prev) => ({ ...prev, accessToken: newAccessToken }));
      },
      onExpired() {
        clearStateToAnonymous();
        router.push("/login");
      },
    });
  }, [clearStateToAnonymous, router]);

  useEffect(() => {
    if (!initialAccessToken && !initialRefreshToken) {
      return;
    }

    let cancelled = false;
    apiRequest<User>("/api/users/me")
      .then((user) => {
        if (cancelled) {
          return;
        }
        setState({
          user,
          accessToken: getAccessToken(),
          refreshToken: getRefreshToken(),
          status: "authenticated",
        });
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.statusCode === 401) {
          clearAuthCookies();
          clearStateToAnonymous();
          router.push("/login");
          return;
        }
        // Network error or 5xx: keep cookies, leave user unset
        setState((prev) => ({
          ...prev,
          user: null,
          status: "anonymous",
        }));
        const message =
          err instanceof ApiError && err.statusCode === 0
            ? "Could not reach the server. Please try again."
            : "Something went wrong restoring your session.";
        showError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [clearStateToAnonymous, initialAccessToken, initialRefreshToken, router]);

  const login = useCallback((result: LoginResult) => {
    setAccessCookie(result.access_token, result.expires_in);
    setRefreshCookie(result.refresh_token, result.refresh_expires_in);
    setState({
      user: result.user,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      status: "authenticated",
    });
  }, []);

  const logout = useCallback(() => {
    clearAuthCookies();
    clearStateToAnonymous();
    router.push("/login");
  }, [clearStateToAnonymous, router]);

  const updateUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const setAccessToken = useCallback((accessToken: string) => {
    setState((prev) => ({ ...prev, accessToken }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      updateUser,
      setAccessToken,
    }),
    [state, login, logout, updateUser, setAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
