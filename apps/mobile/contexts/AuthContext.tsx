/**
 * Mobile Auth Context
 * ENHANCEMENT FIRST: Simple authentication context for mobile app
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  uid: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load user from storage on mount
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("@voisss_user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const signIn = async (userId: string) => {
    const newUser: User = { uid: userId };
    setUser(newUser);
    setIsAuthenticated(true);
    
    try {
      await AsyncStorage.setItem("@voisss_user", JSON.stringify(newUser));
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsAuthenticated(false);
    
    try {
      await AsyncStorage.removeItem("@voisss_user");
    } catch (error) {
      console.error("Failed to remove user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
