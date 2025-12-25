import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  login as loginAction,
  register as registerAction,
  logout as logoutAction,
  fetchCurrentUser,
  clearError,
} from '@/app/slices/authSlice';
import type { LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await dispatch(loginAction(credentials));
      return result;
    },
    [dispatch]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const result = await dispatch(registerAction(data));
      return result;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutAction());
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    if (isAuthenticated && !user) {
      await dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Check auth on mount if token exists but no user
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearAuthError,
  };
}

export default useAuth;
