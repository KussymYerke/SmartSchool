// src/context/AuthContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserRole } from "../types/auth";

type AuthState = {
  role: UserRole | null;
  className: string | null; // used for class teachers
  selectedSubject: string | null; // used for subject-mode views (teacher / class teacher)

  // Subject scope for teacher/class_teacher accounts
  subjects?: string[];

  // --- Optional account scope (demo login) ---
  accountId?: string | null;
  displayName?: string | null;
  email?: string | null;
  teachingClasses?: string[];
  homeroomClasses?: string[];
};

type AuthContextValue = AuthState & {
  setRole: (role: UserRole | null) => void;
  setClassName: (className: string | null) => void;
  setSelectedSubject: (code: string | null) => void;
  setAuth: (next: AuthState) => void;
  resetAuth: () => void;
};

const STORAGE_KEY = "school_admin_auth_v1";

function readStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { role: null, className: null, selectedSubject: null };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      role: (parsed.role ?? null) as UserRole | null,
      className: typeof parsed.className === "string" ? parsed.className : null,
      selectedSubject:
        typeof parsed.selectedSubject === "string" ? parsed.selectedSubject : null,
      subjects: Array.isArray(parsed.subjects)
        ? (parsed.subjects.filter((x) => typeof x === "string") as string[])
        : [],
      accountId: typeof parsed.accountId === "string" ? parsed.accountId : null,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : null,
      email: typeof parsed.email === "string" ? parsed.email : null,
      teachingClasses: Array.isArray(parsed.teachingClasses)
        ? (parsed.teachingClasses.filter((x) => typeof x === "string") as string[])
        : [],
      homeroomClasses: Array.isArray(parsed.homeroomClasses)
        ? (parsed.homeroomClasses.filter((x) => typeof x === "string") as string[])
        : [],
    };
  } catch {
    return { role: null, className: null, selectedSubject: null };
  }
}

function writeStoredAuth(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    // localStorage exists in browser; during build it's fine because useState initializer runs client-side
    if (typeof window === "undefined") return { role: null, className: null, selectedSubject: null };
    return readStoredAuth();
  });

  const value = useMemo<AuthContextValue>(() => {
    const setAuth = (next: AuthState) => {
      setState(next);
      if (typeof window !== "undefined") writeStoredAuth(next);
    };

    const setRole = (role: UserRole | null) => {
      setAuth({
        ...state,
        role,
        className: role === "class_teacher" ? state.className : null,
      });
    };

    const setClassName = (className: string | null) => {
      setAuth({ ...state, className });
    };

    const setSelectedSubject = (code: string | null) => {
      setAuth({ ...state, selectedSubject: code });
    };

    const resetAuth = () =>
      setAuth({
        role: null,
        className: null,
        selectedSubject: null,
        subjects: [],
        accountId: null,
        displayName: null,
        email: null,
        teachingClasses: [],
        homeroomClasses: [],
      });

    return {
      role: state.role,
      className: state.className,
      selectedSubject: state.selectedSubject,
      subjects: state.subjects ?? [],
      accountId: state.accountId ?? null,
      displayName: state.displayName ?? null,
      email: state.email ?? null,
      teachingClasses: state.teachingClasses ?? [],
      homeroomClasses: state.homeroomClasses ?? [],
      setRole,
      setClassName,
      setSelectedSubject,
      setAuth,
      resetAuth,
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
