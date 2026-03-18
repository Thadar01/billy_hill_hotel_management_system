"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  staff_id: number;
  staff_name: string;
  staff_gmail: string;
  role_id: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
        });

        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setHasHydrated: (value) =>
        set({
          hasHydrated: value,
        }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);