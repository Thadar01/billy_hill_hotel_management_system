import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedRoom {
  roomID: string;
  adults: number;
  children: number;
}

interface SelectedService {
  premiumServiceId: number;
  serviceName: string;
  price: number;
  pricingType: "unit" | "person" | "unit_person";
  quantity: number;
  personCount: number;
}

interface BookingData {
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  specialRequest: string;
  pointsToUse: number;
  taxAmount: number;
  rooms: SelectedRoom[];
  services: SelectedService[];
  roomSubtotal: number;
  serviceSubtotal: number;
  totalAmount: number;
  minDeposit: number;
}

interface BookingState {
  tempBooking: BookingData | null;
  setTempBooking: (data: BookingData | null) => void;
  clearTempBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      tempBooking: null,
      setTempBooking: (data) => set({ tempBooking: data }),
      clearTempBooking: () => set({ tempBooking: null }),
    }),
    {
      name: "booking-temp-storage",
    }
  )
);
