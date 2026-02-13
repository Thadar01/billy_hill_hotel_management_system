import { create } from "zustand";

interface User {
  staff_id: number;
  staff_name: string;
  staff_gmail: string;
  role_id: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

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
}));
