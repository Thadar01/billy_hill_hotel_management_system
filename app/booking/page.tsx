"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserLayout from "../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";

interface ActiveDiscount {
  discountID: number;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Room {
  roomID: string;
  roomNumber: string;
  roomType: string;
  description: string;
  price: number;
  finalPrice: number;
  roomStatus: string;
  floor: number;
  roomSize: number;
  bed: number;
  person: number;
  bathroom: number;
  isPetAllowed: boolean;
  isBalcony: boolean;
  images: string[];
  activeDiscount: ActiveDiscount | null;
}

interface PremiumService {
  premiumServiceId: number;
  serviceName: string;
  description: string;
  price: number;
}

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

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoomID = searchParams.get("roomID");

  const { customer } = useCustomerAuthStore();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<PremiumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [specialRequest, setSpecialRequest] = useState("");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "kbzpay" | "wavepay" | "bank_transfer" | "card"
  >("cash");
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!initialRoomID || rooms.length === 0) return;

    const roomExists = selectedRooms.some((r) => r.roomID === initialRoomID);
    const roomFound = rooms.find((r) => r.roomID === initialRoomID);

    if (!roomExists && roomFound) {
      setSelectedRooms([
        {
          roomID: roomFound.roomID,
          adults: 1,
          children: 0,
        },
      ]);
    }
  }, [initialRoomID, rooms, selectedRooms]);

  const fetchInitialData = async () => {
    try {
      const [roomsRes, servicesRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/premium-services"),
      ]);

      const roomsText = await roomsRes.text();
      const servicesText = await servicesRes.text();

      if (!roomsRes.ok) {
        throw new Error(`Failed to fetch rooms: ${roomsText}`);
      }

      if (!servicesRes.ok) {
        throw new Error(`Failed to fetch services: ${servicesText}`);
      }

      const roomsData = roomsText ? JSON.parse(roomsText) : [];
      const servicesData = servicesText ? JSON.parse(servicesText) : [];

      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = end.getTime() - start.getTime();
    const result = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return result > 0 ? result : 0;
  }, [checkInDate, checkOutDate]);

  const roomSubtotal = useMemo(() => {
    return selectedRooms.reduce((sum, selected) => {
      const room = rooms.find((r) => r.roomID === selected.roomID);
      if (!room) return sum;
      return sum + Number(room.finalPrice) * nights;
    }, 0);
  }, [selectedRooms, rooms, nights]);

  const serviceSubtotal = useMemo(() => {
    return selectedServices.reduce((sum, service) => {
      if (service.pricingType === "unit") {
        return sum + service.price * service.quantity;
      }

      if (service.pricingType === "person") {
        return sum + service.price * service.personCount;
      }

      return sum + service.price * service.quantity * service.personCount;
    }, 0);
  }, [selectedServices]);

  const maxPointsByAmount = useMemo(() => {
    return Math.floor(roomSubtotal + serviceSubtotal + Number(taxAmount || 0));
  }, [roomSubtotal, serviceSubtotal, taxAmount]);

  const maxPointsUsable = useMemo(() => {
    const customerPoints = Number(customer?.points || 0);
    return Math.max(0, Math.min(customerPoints, maxPointsByAmount));
  }, [customer?.points, maxPointsByAmount]);

  const totalAmount = useMemo(() => {
    const safePoints = Math.min(Number(pointsToUse || 0), maxPointsUsable);
    const total =
      roomSubtotal + serviceSubtotal - safePoints + Number(taxAmount || 0);
    return total > 0 ? total : 0;
  }, [roomSubtotal, serviceSubtotal, pointsToUse, taxAmount, maxPointsUsable]);

  const addRoom = (roomID: string) => {
    if (!roomID) return;
    if (selectedRooms.some((room) => room.roomID === roomID)) return;

    setSelectedRooms((prev) => [
      ...prev,
      {
        roomID,
        adults: 1,
        children: 0,
      },
    ]);
  };

  const removeRoom = (roomID: string) => {
    setSelectedRooms((prev) => prev.filter((room) => room.roomID !== roomID));
  };

  const updateRoom = (
    roomID: string,
    field: "adults" | "children",
    value: number
  ) => {
    const safeValue = field === "adults" ? Math.max(1, value) : Math.max(0, value);

    setSelectedRooms((prev) =>
      prev.map((room) =>
        room.roomID === roomID ? { ...room, [field]: safeValue } : room
      )
    );
  };

  const addService = (serviceId: number) => {
    const found = services.find((s) => s.premiumServiceId === serviceId);
    if (!found) return;
    if (selectedServices.some((s) => s.premiumServiceId === serviceId)) return;

    setSelectedServices((prev) => [
      ...prev,
      {
        premiumServiceId: found.premiumServiceId,
        serviceName: found.serviceName,
        price: Number(found.price),
        pricingType: "unit",
        quantity: 1,
        personCount: 1,
      },
    ]);
  };

  const removeService = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.filter((service) => service.premiumServiceId !== serviceId)
    );
  };

  const updateService = (
    serviceId: number,
    field: "quantity" | "personCount" | "pricingType",
    value: number | "unit" | "person" | "unit_person"
  ) => {
    setSelectedServices((prev) =>
      prev.map((service) => {
        if (service.premiumServiceId !== serviceId) return service;

        if (field === "quantity" && typeof value === "number") {
          return { ...service, quantity: Math.max(1, value) };
        }

        if (field === "personCount" && typeof value === "number") {
          return { ...service, personCount: Math.max(1, value) };
        }

        return {
          ...service,
          [field]: value,
        };
      })
    );
  };

  const validateBooking = () => {
    if (!customer?.customerID) {
      alert("Please log in first");
      return false;
    }

    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates");
      return false;
    }

    if (!checkInTime || !checkOutTime) {
      alert("Please select check-in and check-out times");
      return false;
    }

    if (selectedRooms.length === 0) {
      alert("Please select at least one room");
      return false;
    }

    if (nights <= 0) {
      alert("Check-out date must be later than check-in date");
      return false;
    }

    for (const selected of selectedRooms) {
      const room = rooms.find((r) => r.roomID === selected.roomID);
      if (!room) continue;

      const totalGuests = Number(selected.adults) + Number(selected.children);

      if (totalGuests > Number(room.person)) {
        alert(
          `Room ${room.roomNumber} allows maximum ${room.person} guests`
        );
        return false;
      }
    }

    if (pointsToUse < 0) {
      alert("Points cannot be negative");
      return false;
    }

    if (pointsToUse > maxPointsUsable) {
      alert(`You can use up to ${maxPointsUsable} points`);
      return false;
    }

    if (paymentAmount < 0) {
      alert("Payment amount cannot be negative");
      return false;
    }

    if (paymentAmount > totalAmount) {
      alert("Payment amount cannot exceed total amount");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateBooking()) return;

      setSubmitting(true);

      const payload = {
        customerID: customer?.customerID,
        checkInDate,
        checkOutDate,
        checkInTime,
        checkOutTime,
        specialRequest,
        pointsToUse: Number(pointsToUse) || 0,
        taxAmount: Number(taxAmount) || 0,
        rooms: selectedRooms,
        services: selectedServices.map((service) => ({
          premiumServiceId: service.premiumServiceId,
          pricingType: service.pricingType,
          quantity: service.quantity,
          personCount: service.personCount,
        })),
        payment:
          paymentAmount > 0
            ? {
                amount: Number(paymentAmount),
                paymentMethod,
                paymentType: "deposit",
                paymentStatus: "paid",
              }
            : null,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      let data: Record<string, unknown> = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid JSON response from server: ${text}`);
      }

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to create booking"
        );
      }

      alert("Booking created successfully");
      router.push(`/my-bookings`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="min-h-screen flex items-center justify-center text-black">
          Loading booking page...
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 text-black">
        <h1 className="text-3xl font-bold mb-6">Book Your Stay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Stay Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Check-in Date</label>
                  <input
                    type="date"
                    min={today}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Check-out Date</label>
                  <input
                    type="date"
                    min={checkInDate || today}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Check-in Time</label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Check-out Time</label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600">Total nights: {nights}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Selected Rooms</h2>

              <div className="mb-4">
                <select
                  onChange={(e) => {
                    addRoom(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Add a room
                  </option>
                  {rooms
                    .filter(
                      (room) =>
                        room.roomStatus !== "maintenance" &&
                        room.roomStatus !== "occupied"
                    )
                    .map((room) => (
                      <option key={room.roomID} value={room.roomID}>
                        {room.roomNumber} - {room.roomType} - $
                        {Number(room.finalPrice).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-4">
                {selectedRooms.map((selected) => {
                  const room = rooms.find((r) => r.roomID === selected.roomID);
                  if (!room) return null;

                  const totalGuests =
                    Number(selected.adults) + Number(selected.children);
                  const overCapacity = totalGuests > Number(room.person);

                  return (
                    <div
                      key={selected.roomID}
                      className="border rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {room.roomNumber} - {room.roomType}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ${Number(room.finalPrice).toFixed(2)} / night
                          </p>
                          <p className="text-sm text-gray-600">
                            Max guests: {room.person}
                          </p>
                        </div>

                        <button
                          onClick={() => removeRoom(selected.roomID)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-1">Adults</label>
                          <input
                            type="number"
                            min={1}
                            value={selected.adults}
                            onChange={(e) =>
                              updateRoom(
                                selected.roomID,
                                "adults",
                                Number(e.target.value)
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm mb-1">Children</label>
                          <input
                            type="number"
                            min={0}
                            value={selected.children}
                            onChange={(e) =>
                              updateRoom(
                                selected.roomID,
                                "children",
                                Number(e.target.value)
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      </div>

                      {overCapacity && (
                        <p className="text-sm text-red-500">
                          Total guests exceed this room capacity.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Premium Services</h2>

              <div className="mb-4">
                <select
                  onChange={(e) => {
                    addService(Number(e.target.value));
                    e.target.value = "";
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Add a premium service
                  </option>
                  {services.map((service) => (
                    <option
                      key={service.premiumServiceId}
                      value={service.premiumServiceId}
                    >
                      {service.serviceName} - ${Number(service.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {selectedServices.map((service) => (
                  <div
                    key={service.premiumServiceId}
                    className="border rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{service.serviceName}</h3>
                        <p className="text-sm text-gray-600">
                          Base price: ${Number(service.price).toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeService(service.premiumServiceId)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Pricing Type</label>
                        <select
                          value={service.pricingType}
                          onChange={(e) =>
                            updateService(
                              service.premiumServiceId,
                              "pricingType",
                              e.target.value as "unit" | "person" | "unit_person"
                            )
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="unit">Unit</option>
                          <option value="person">Person</option>
                          <option value="unit_person">Unit x Person</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={service.quantity}
                          onChange={(e) =>
                            updateService(
                              service.premiumServiceId,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Person Count</label>
                        <input
                          type="number"
                          min={1}
                          value={service.personCount}
                          onChange={(e) =>
                            updateService(
                              service.premiumServiceId,
                              "personCount",
                              Number(e.target.value)
                            )
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Special Request</h2>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Any request for your stay..."
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Room subtotal</span>
                <span>${roomSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Service subtotal</span>
                <span>${serviceSubtotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="block mb-1 font-medium">Use Points</label>
                <input
                  type="number"
                  min={0}
                  max={maxPointsUsable}
                  value={pointsToUse}
                  onChange={(e) =>
                    setPointsToUse(
                      Math.max(
                        0,
                        Math.min(Number(e.target.value), maxPointsUsable)
                      )
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available to use: {maxPointsUsable}
                </p>
              </div>

              <div>
                <label className="block mb-1 font-medium">Tax</label>
                <input
                  type="number"
                  min={0}
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="border-t pt-3 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-3 space-y-3">
                <h3 className="font-semibold">Initial Payment</h3>

                <div>
                  <label className="block mb-1 font-medium">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as
                          | "cash"
                          | "kbzpay"
                          | "wavepay"
                          | "bank_transfer"
                          | "card"
                      )
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="kbzpay">KBZPay</option>
                    <option value="wavepay">WavePay</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Payment Amount</label>
                  <input
                    type="number"
                    min={0}
                    max={totalAmount}
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(
                        Math.max(0, Math.min(Number(e.target.value), totalAmount))
                      )
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}