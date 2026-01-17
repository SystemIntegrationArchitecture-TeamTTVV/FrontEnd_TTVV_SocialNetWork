import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../apis/auth';

// Import AuthResponse type inline to avoid ESM issues
type AuthResponse = {
  token: string;
  username: string;
  role: string;
  userId: string;
  fullName: string;
  avatar: string;
};

interface User {
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
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const savedUser = authApi.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authApi.login({ username, password });
      
      setUser({
        id: response.userId,
        username: response.username,
        fullName: response.fullName,
        avatar: response.avatar,
        role: response.role,
      });

      // Use window.location instead of navigate since we're outside Router
      window.location.href = '/home';
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

      // Use window.location instead of navigate since we're outside Router
      window.location.href = '/home';
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

