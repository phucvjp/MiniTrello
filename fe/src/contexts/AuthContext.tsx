import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  AuthContextType,
  LoginCredentials,
  RegisterCredentials,
} from "../types";
import toast from "react-hot-toast";
import { apiService } from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid by fetching current user
          const response = await apiService.getCurrentUser();
          setUser(response.user);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear stored data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);

      if (response.success) {
        // Check if user is verified
        if (!response.user.isEmailVerified) {
          // Don't set user/token, just return error for unverified users
          throw new Error("Please verify your email before logging in");
        }

        setUser(response.user);
        setToken(response.token);

        // Store in localStorage
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      toast.error("Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      const response = await apiService.register(credentials);

      if (response.success) {
        setUser(response.user);
        setToken(response.token);

        // Store in localStorage
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if user is authenticated
      if (token) {
        await apiService.logout();
      }
    } catch (error) {
      toast.error("Logout failed");
      // Continue with logout even if API call fails
    } finally {
      // Clear state and localStorage
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  const loginWithGitHub = () => {
    // Redirect to backend GitHub OAuth route
    const backendUrl =
      process.env.REACT_APP_API_URL || "http://localhost:3001/api";
    window.location.href = `${backendUrl}/auth/github`;
  };

  const handleOAuthCallback = async (token: string, provider: string) => {
    try {
      setLoading(true);

      // Store the token
      localStorage.setItem("token", token);
      setToken(token);

      // Fetch user data with the token
      const response = await apiService.getCurrentUser();
      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
    } catch (error) {
      toast.error("OAuth authentication failed");
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    loginWithGitHub,
    handleOAuthCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
