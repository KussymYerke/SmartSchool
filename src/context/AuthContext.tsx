// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { UserRole } from "../types/auth";

type AuthContextValue = {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [role, setRole] = useState<UserRole | null>(null);

  const value: AuthContextValue = {
    role,
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
