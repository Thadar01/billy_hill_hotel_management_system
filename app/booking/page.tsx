"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserLayout from "../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";
import { useBookingStore } from "@/store/useBookingStore";

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
  const { setTempBooking } = useBookingStore();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<PremiumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestPoints, setLatestPoints] = useState<number>(0);

  const today = new Date().toISOString().split("T")[0];

  // Maximum check-in date is 30 days from now
  const maxCheckInDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }, []);

  const initialCheckIn = searchParams.get("checkIn") || "";
  const initialCheckOut = searchParams.get("checkOut") || "";

  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [checkInTime, setCheckInTime] = useState("12:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [specialRequest, setSpecialRequest] = useState("");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );

  useEffect(() => {
    fetchInitialData();
  }, [checkInDate, checkOutDate]);

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
      const roomsUrl = `/api/rooms${checkInDate && checkOutDate ? `?checkIn=${checkInDate}&checkOut=${checkOutDate}` : ""}`;
      
      const fetchPromises: Promise<Response>[] = [
        fetch(roomsUrl),
        fetch("/api/premium-services"),
      ];

      if (customer?.customerID) {
        fetchPromises.push(fetch(`/api/customers/${customer.customerID}`));
      }

      const responses = await Promise.all(fetchPromises);
      const roomsRes = responses[0];
      const servicesRes = responses[1];
      const customerRes = responses[2];

      const roomsText = await roomsRes.text();
      const servicesText = await servicesRes.text();

      if (!roomsRes.ok) throw new Error(`Failed to fetch rooms: ${roomsText}`);
      if (!servicesRes.ok) throw new Error(`Failed to fetch services: ${servicesText}`);

      const roomsData = roomsText ? JSON.parse(roomsText) : [];
      const servicesData = servicesText ? JSON.parse(servicesText) : [];

      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);

      if (customerRes && customerRes.ok) {
        const customerData = await customerRes.json();
        setLatestPoints(Number(customerData.customer?.points || 0));
      } else {
        setLatestPoints(Number(customer?.points || 0));
      }
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
    // service subtotal / 1000 = max points needed to cover premium services only
    return Math.floor(serviceSubtotal / 1000);
  }, [serviceSubtotal]);

  const maxPointsUsable = useMemo(() => {
    const customerPoints = Number(latestPoints || 0);
    return Math.max(0, Math.min(customerPoints, maxPointsByAmount));
  }, [latestPoints, maxPointsByAmount]);

  const totalAmount = useMemo(() => {
    const safePoints = Math.min(Number(pointsToUse || 0), maxPointsUsable);
    const pointsDiscount = safePoints * 1000;
    const total =
      roomSubtotal + serviceSubtotal - pointsDiscount + Number(taxAmount || 0);
    return total > 0 ? total : 0;
  }, [roomSubtotal, serviceSubtotal, pointsToUse, taxAmount, maxPointsUsable]);

  const minDeposit = useMemo(() => {
    return Number((totalAmount * 0.3).toFixed(2));
  }, [totalAmount]);

  useEffect(() => {
    // We don't need to auto-set paymentAmount here anymore
  }, [minDeposit]);

  const addRoom = (roomID: string) => {
    if (!roomID) return;
    if (selectedRooms.some((room) => room.roomID === roomID)) return;
    
    if (selectedRooms.length >= 3) {
      alert("You can only select up to 3 rooms per booking.");
      return;
    }

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

    if (checkInDate > maxCheckInDate) {
      alert("Check-in date must be within 30 days from today.");
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

    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateBooking()) return;

    setTempBooking({
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      specialRequest,
      pointsToUse: Number(pointsToUse) || 0,
      taxAmount: Number(taxAmount) || 0,
      rooms: selectedRooms,
      services: selectedServices,
      roomSubtotal,
      serviceSubtotal,
      totalAmount,
      minDeposit,
    });

    router.push("/booking/payment");
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
                    max={maxCheckInDate}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bookings can be made up to 30 days in advance.</p>
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
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Check-out Time</label>
                  <input
                    type="time"
                    value={checkOutTime}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600">Total nights: {nights}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">Selected Rooms</h2>

              <div className="mb-4">
                {selectedRooms.length >= 3 ? (
                  <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-2">
                    You have reached the maximum limit of 3 rooms per booking.
                  </div>
                ) : null}
                <select
                  onChange={(e) => {
                    addRoom(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                  defaultValue=""
                  disabled={selectedRooms.length >= 3}
                >
                  <option value="" disabled>
                    {selectedRooms.length >= 3 ? "Maximum rooms selected" : "Add a room"}
                  </option>
                  {rooms
                    .filter(
                      (room) =>
                        room.roomStatus !== "maintenance" &&
                        room.roomStatus !== "occupied" &&
                        !selectedRooms.some((selected) => selected.roomID === room.roomID)
                    )
                    .map((room) => (
                      <option key={room.roomID} value={room.roomID}>
                        {room.roomNumber} - {room.roomType} - MMK{" "}
                        {Number(room.finalPrice).toFixed(0)}
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
                            MMK {Number(room.finalPrice).toFixed(0)} / night
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
                      {service.serviceName} - MMK {Number(service.price).toFixed(0)}
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
                          Base price: MMK {Number(service.price).toFixed(0)}
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
                <span>MMK {roomSubtotal.toFixed(0)}</span>
              </div>

              <div className="flex justify-between">
                <span>Service subtotal</span>
                <span>MMK {serviceSubtotal.toFixed(0)}</span>
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
                  1 Point = 1,000 MMK | Available: {maxPointsUsable}
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
                <span>MMK {totalAmount.toFixed(0)}</span>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium hover:bg-gray-800 transition-colors"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}