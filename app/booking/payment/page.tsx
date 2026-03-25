"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserLayout from "../../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";
import { useBookingStore } from "@/store/useBookingStore";
import { CreditCard, Smartphone, Building2, Banknote, CheckCircle2 } from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const { customer, isAuthenticated } = useCustomerAuthStore();
  const { tempBooking, clearTempBooking } = useBookingStore();

  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "kbzpay" | "wavepay"
  >("card");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Dummy Card Info (Not stored)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Pay Info
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [isMobileConnected, setIsMobileConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setIsMobileConnected(false);
    setIsConnecting(false);
  }, [paymentMethod]);

  useEffect(() => {
    if (!tempBooking) {
      router.push("/booking");
      return;
    }
    setPaymentAmount(tempBooking.minDeposit);
  }, [tempBooking, router]);

  if (!tempBooking) return null;

  const handleSubmit = async () => {
    try {
      if (!isAuthenticated) {
        alert("Please log in to complete your booking.");
        return;
      }

      if (paymentAmount < tempBooking.minDeposit) {
        alert(`Minimum deposit of $${tempBooking.minDeposit.toFixed(2)} is required.`);
        return;
      }

      // Add validation before submitting
      if (paymentMethod === "card") {
        if (!cardName || !cardNumber || !expiry || !cvv) {
          alert("Please fill in all card details.");
          return;
        }
      } else if (paymentMethod === "kbzpay" || paymentMethod === "wavepay") {
        if (!isMobileConnected) {
          alert(`Please connect your ${paymentMethod === 'kbzpay' ? 'KBZPay' : 'WavePay'} account first.`);
          return;
        }
      }

      setSubmitting(true);

      const payload = {
        customerID: customer?.customerID,
        checkInDate: tempBooking.checkInDate,
        checkOutDate: tempBooking.checkOutDate,
        checkInTime: tempBooking.checkInTime,
        checkOutTime: tempBooking.checkOutTime,
        specialRequest: tempBooking.specialRequest,
        pointsToUse: tempBooking.pointsToUse,
        taxAmount: tempBooking.taxAmount,
        rooms: tempBooking.rooms.map(room => ({
            roomID: room.roomID,
            adults: room.adults,
            children: room.children
        })),
        services: tempBooking.services.map((s) => ({
          premiumServiceId: s.premiumServiceId,
          pricingType: s.pricingType,
          quantity: s.quantity,
          personCount: s.personCount,
        })),
        payment: {
          amount: Number(paymentAmount),
          paymentMethod,
          paymentType: "deposit",
          paymentStatus: "paid",
        },
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
         throw new Error("Server returned invalid response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      alert("Booking & Payment successful!");
      clearTempBooking();
      router.push("/my-bookings");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectMobile = () => {
    if (!phoneNumber) {
      alert("Please enter your mobile phone number first.");
      return;
    }
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsMobileConnected(true);
    }, 1500);
  };

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 text-black bg-gray-50/30 min-h-screen">
        <h1 className="text-4xl font-bold mb-10 text-center">Finalize Your Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Summary */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-black p-6">
                 <h2 className="text-xl font-bold text-white">Booking Summary</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <div className="text-gray-500">Stay Period</div>
                    <div className="text-right">
                       <div className="font-semibold">{tempBooking.checkInDate}</div>
                       <div className="text-xs text-gray-400">to {tempBooking.checkOutDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-lg">
                    <div className="text-gray-600">Total Amount</div>
                    <div className="font-bold text-2xl">${tempBooking.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50">
                  <div className="flex justify-between items-center text-blue-800">
                    <span className="font-medium">Mandatory Deposit (30%)</span>
                    <span className="font-bold text-xl">${tempBooking.minDeposit.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-blue-600/80 mt-2 font-medium bg-white/50 p-2 rounded-lg">
                    Secure your reservation with a down payment today.
                    The remaining balance can be settled at the hotel.
                  </p>
                </div>
              </div>
            </div>
            
            <button 
                onClick={() => router.back()}
                className="w-full py-3 text-gray-500 hover:text-black transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
                ← Edit booking details
            </button>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-8 text-black">Select Payment Method</h2>
              
              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
                  { id: "kbzpay", label: "KBZPay", icon: Smartphone },
                  { id: "wavepay", label: "WavePay", icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all duration-300 group ${
                      paymentMethod === method.id 
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]" 
                        : "border-gray-100 bg-white text-gray-500 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                    }`}
                  >
                    <method.icon size={32} className={`mb-3 transition-colors ${paymentMethod === method.id ? "text-blue-600" : "group-hover:text-blue-500"}`} />
                    <span className="text-sm font-bold tracking-wide">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Amount to Pay Now</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-5 text-gray-500 font-bold text-xl">$</span>
                    <input
                        type="number"
                        min={tempBooking.minDeposit}
                        max={tempBooking.totalAmount}
                        value={paymentAmount}
                        step="0.01"
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-4 text-xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px]">
                     <span className="text-blue-600 font-bold uppercase">Min: ${tempBooking.minDeposit.toFixed(2)}</span>
                     <span className="text-gray-400">Total: ${tempBooking.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                    {/* Card Fields */}
                    {paymentMethod === "card" && (
                    <div className="space-y-5 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Cardholder Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Full Name as on Card" 
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Card Number</label>
                                <input 
                                    type="text" 
                                    placeholder="0000 0000 0000 0000" 
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Expiry Date</label>
                                <input 
                                    type="text" 
                                    placeholder="MM / YY" 
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">CVV</label>
                                <input 
                                    type="text" 
                                    placeholder="123" 
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all" 
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl flex gap-3 items-center border border-gray-100">
                            <CheckCircle2 className="text-green-500 shrink-0" size={16} />
                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                We prioritize your privacy. Card data is only used for session validation and is 
                                <span className="text-black font-bold"> never stored </span> 
                                on our database servers.
                            </p>
                        </div>
                    </div>
                    )}

                    {/* Mobile Pay Fields */}
                    {(paymentMethod === "kbzpay" || paymentMethod === "wavepay") && (
                    <div className="space-y-5 animate-in slide-in-from-top-4 duration-300">
                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center gap-4 border border-blue-100">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <Smartphone className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-blue-900 uppercase">Mobile Payment Mode</div>
                                <p className="text-xs text-blue-700 opacity-80 uppercase font-bold tracking-tighter">Please transfer to: 09-123456789</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Mobile Phone Number</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="09..." 
                                        value={phoneNumber}
                                        onChange={(e) => { setPhoneNumber(e.target.value); setIsMobileConnected(false); }}
                                        className="w-full flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all" 
                                        disabled={isMobileConnected}
                                    />
                                    <button 
                                        onClick={handleConnectMobile}
                                        disabled={isConnecting || isMobileConnected || !phoneNumber}
                                        className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                                            isMobileConnected 
                                              ? 'bg-green-500 text-white border-green-600 disabled:bg-green-500 disabled:text-white disabled:border-green-600 disabled:opacity-100' 
                                              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 border-blue-700'
                                        }`}
                                    >
                                        {isConnecting ? '...' : isMobileConnected ? 'Connected ✓' : `Connect`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-black text-white rounded-2xl py-5 font-bold mt-12 hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {submitting ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Processing...
                    </div>
                ) : (
                  <>
                    <CheckCircle2 size={24} />
                    Confirm & Complete Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
