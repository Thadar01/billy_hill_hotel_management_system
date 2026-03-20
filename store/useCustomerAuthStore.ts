import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomerUser {
  customerID: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  points: number;
}

interface CustomerAuthState {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (customer: CustomerUser) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: (customer) =>
        set({
          customer,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          customer: null,
          isAuthenticated: false,
        }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "customer-auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);