import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi, type AuthResponse } from '../apis/auth';
import { usersApi } from '../apis/users';

export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, captchaToken: string, captchaText: string) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  /** Đồng bộ user từ API + localStorage — gọi sau khi sửa profile/ảnh bìa để Navbar khớp trang profile */
  refreshSessionUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  country?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSessionUser = useCallback(async () => {
    const stored = authApi.getCurrentUser();
    if (!stored?.id || !authApi.isAuthenticated()) return;
    try {
      const u = await usersApi.getUserById(stored.id);
      const next: User = {
        id: u.id ?? stored.id,
        username: u.username ?? stored.username,
        fullName: u.fullName ?? stored.fullName,
        avatar: u.avatar ?? '',
        role: u.role ?? stored.role,
      };
      localStorage.setItem('user', JSON.stringify(next));
      setUser(next);
    } catch (e) {
      console.warn('[Auth] refreshSessionUser failed', e);
    }
  }, []);

  // Load user từ localStorage rồi đồng bộ từ API (avatar/cover cập nhật trên server)
  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const hasSession = authApi.isAuthenticated();
      if (!hasSession) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // If access token is expired but refresh token exists, refresh before any protected calls.
      if (authApi.isAccessTokenExpired()) {
        const ok = await authApi.ensureValidAccessToken();
        if (!ok) {
          authApi.logout();
          if (!cancelled) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
      }

      const savedUser = authApi.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
      }
      setIsLoading(false);

      if (savedUser?.id) {
        try {
          const u = await usersApi.getUserById(savedUser.id);
          if (cancelled) return;
          const next: User = {
            id: u.id ?? savedUser.id,
            username: u.username ?? savedUser.username,
            fullName: u.fullName ?? savedUser.fullName,
            avatar: u.avatar ?? '',
            role: u.role ?? savedUser.role,
          };
          localStorage.setItem('user', JSON.stringify(next));
          setUser(next);
        } catch {
          /* giữ savedUser */
        }
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username: string, password: string, captchaToken: string, captchaText: string): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.login({ username, password, captchaToken, captchaText });

      setUser({
        id: response.userId,
        username: response.username,
        fullName: response.fullName,
        avatar: response.avatar,
        role: response.role,
      });
      return response;
    } catch (error: unknown) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.register(userData);
      
      setUser({
        id: response.userId,
        username: response.username,
        fullName: response.fullName,
        avatar: response.avatar,
        role: response.role,
      });
    } catch (error: unknown) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    // Use window.location instead of navigate since we're outside Router
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSessionUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During Vite HMR, context may temporarily disconnect.
    // Return safe defaults instead of crashing the entire app.
    console.warn('[useAuth] AuthContext is undefined — likely a HMR reload. Returning safe defaults.');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async () => { throw new Error('AuthProvider not mounted'); },
      register: async () => { throw new Error('AuthProvider not mounted'); },
      logout: () => { window.location.href = '/auth/login'; },
      refreshSessionUser: async () => {},
    } as ReturnType<typeof useContext<typeof AuthContext>> & NonNullable<ReturnType<typeof useContext<typeof AuthContext>>>;
  }
  return context;
}

