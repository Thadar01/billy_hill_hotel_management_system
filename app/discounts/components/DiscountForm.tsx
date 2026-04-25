"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Room {
  roomID: string;
  roomNumber: string;
  roomType: string;
}

interface DiscountFormData {
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
  roomIDs: string[];
}

interface Props {
  initialData?: Partial<DiscountFormData>;
  editingId?: number | string | null;
}

const emptyForm: DiscountFormData = {
  discountName: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  description: "",
  isActive: true,
  roomIDs: [],
};

export default function DiscountForm({
  initialData,
  editingId = null,
}: Props) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [form, setForm] = useState<DiscountFormData>({
    ...emptyForm,
    ...initialData,
  });

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await fetch("/api/rooms", { cache: "no-store" });
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load rooms:", error);
      }
    };

    loadRooms();
  }, []);

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const target = e.target;
  const { name } = target;

  setForm((prev) => ({
    ...prev,
    [name]:
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value,
  }));
};

  const handleRoomToggle = (roomID: string) => {
    setForm((prev) => ({
      ...prev,
      roomIDs: prev.roomIDs.includes(roomID)
        ? prev.roomIDs.filter((id) => id !== roomID)
        : [...prev.roomIDs, roomID],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (
      !form.discountName ||
      !form.discountType ||
      !form.discountValue ||
      !form.startDate ||
      !form.endDate ||
      form.roomIDs.length === 0
    ) {
      alert("Please Fill all the required fields");
      return;
    }

    if (new Date(form.startDate) >= new Date(form.endDate)) {
      alert("End date must be later than start date.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        discountName: form.discountName,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description || null,
        isActive: form.isActive,
        roomIDs: form.roomIDs,
      };

      const url = editingId ? `/api/discounts/${editingId}` : "/api/discounts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to save discount");
        return;
      }

      alert(editingId ? "Discount updated successfully" : "Discount created successfully");
      router.push("/discounts");
      router.refresh();
    } catch (error) {
      console.error("Failed to save discount:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Discount" : "Create Discount"}
        </h2>

        <button
          type="button"
          onClick={() => router.push("/discounts")}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !form.discountName ? "text-red-500" : "text-gray-500 text-xs"}`}>
            Discount Name <span className="text-[10px] font-normal opacity-70">(required)</span>
          </label>
          <input
            type="text"
            name="discountName"
            value={form.discountName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !form.discountName ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            placeholder="Summer Sale"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold uppercase text-gray-500 text-xs tracking-wider mb-2">Discount Type</label>
            <select
              name="discountType"
              value={form.discountType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-black transition-all"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>

          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !form.discountValue ? "text-red-500" : "text-gray-500 text-xs"}`}>
              Discount Value <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="discountValue"
              value={form.discountValue}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !form.discountValue ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder={form.discountType === "percentage" ? "10" : "20"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !form.startDate ? "text-red-500" : "text-gray-500 text-xs"}`}>
              Start Date <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={form.startDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !form.startDate ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !form.endDate ? "text-red-500" : "text-gray-500 text-xs"}`}>
              End Date <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={form.endDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !form.endDate ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>
        </div>

     

        <div>
          <label className="block font-bold uppercase text-gray-500 text-xs tracking-wider mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-black transition-all"
            placeholder="Optional description"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleInputChange}
            className="h-4 w-4"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active
          </label>
        </div>

        <div>
          <label className={`block font-bold uppercase tracking-wider mb-3 ${attemptedSubmit && form.roomIDs.length === 0 ? "text-red-500" : "text-gray-500 text-xs"}`}>
            Assign Rooms <span className="text-[10px] font-normal opacity-70">(required)</span>
          </label>
          <div className={`max-h-64 space-y-2 overflow-y-auto rounded-xl border p-3 transition-all ${attemptedSubmit && form.roomIDs.length === 0 ? "border-red-500 bg-red-50" : "border-gray-200"}`}>
            {rooms.length === 0 ? (
              <div className="text-sm text-gray-500">No rooms found.</div>
            ) : (
              rooms.map((room) => (
                <label
                  key={room.roomID}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.roomIDs.includes(room.roomID)}
                    onChange={() => handleRoomToggle(room.roomID)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-sm">
                    <div className="font-bold text-black">
                      Room {room.roomNumber}
                    </div>
                    <div className="text-gray-500 text-xs">{room.roomType} • {room.roomID}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all"
        >
          {loading
            ? "Saving..."
            : editingId
            ? "Update Discount"
            : "Create Discount"}
        </button>
      </form>
    </div>
  );
}