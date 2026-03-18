"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoomOption {
  roomID: string;
  roomNumber: string;
}

interface StaffOption {
  staff_id: string;
  staff_name: string;
  role?: string;
}

interface FormData {
  room_id: string;
  staff_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  cleaning_type: string;
  status: string;
  remarks: string;
}

const emptyForm: FormData = {
  room_id: "",
  staff_id: "",
  schedule_date: "",
  start_time: "",
  end_time: "",
  cleaning_type: "regular",
  status: "pending",
  remarks: "",
};

interface Props {
  initialData?: Partial<FormData>;
  editingId?: number | string | null;
}

export default function HousekeepingScheduleForm({
  initialData,
  editingId = null,
}: Props) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
  type: "success" | "error";
  text: string;
} | null>(null);

  const [form, setForm] = useState<FormData>({
    ...emptyForm,
    ...initialData,
  });

useEffect(() => {
  const loadData = async () => {
    try {
      const [roomsRes, staffsRes] = await Promise.all([
        fetch("/api/rooms", { cache: "no-store" }),
        fetch("/api/staff", { cache: "no-store" }),
      ]);

      const roomsData = await roomsRes.json();
      const staffsData = await staffsRes.json();

      setRooms(Array.isArray(roomsData) ? (roomsData as RoomOption[]) : []);

      const allStaffs: StaffOption[] = Array.isArray(staffsData.staff)
        ? staffsData.staff
        : [];

      setStaffs(
        allStaffs.filter(
          (staff: StaffOption) =>
            staff.role?.toLowerCase() === "housekeeping"
        )
      );
    } catch (error) {
      console.error("Failed to load form data:", error);
    }
  };

  loadData();
}, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (
    !form.room_id ||
    !form.staff_id ||
    !form.schedule_date ||
    !form.start_time ||
    !form.end_time ||
    !form.cleaning_type
  ) {
    alert("Please fill all required fields.");
    return;
  }

  if (form.start_time >= form.end_time) {
    alert("End time must be later than start time.");
    return;
  }

  setLoading(true);

  try {
    const url = editingId
      ? `/api/housekeeping-schedules/${editingId}`
      : "/api/housekeeping-schedules";

    const method = editingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to save schedule.");
      return;
    }

    alert(
      editingId
        ? "Housekeeping schedule updated successfully."
        : "Housekeeping schedule created successfully."
    );

    router.push("/housekeeping-schedules");
    router.refresh();
  } catch (error) {
    console.error("Failed to save housekeeping schedule:", error);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
};
  

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Schedule" : "Create Schedule"}
        </h2>
        <button
          type="button"
          onClick={() => router.push("/housekeeping-schedules")}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Back
        </button>
      </div>
    


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Room</label>
          <select
            name="room_id"
            value={form.room_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2"
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.roomID} value={room.roomID}>
                {room.roomNumber} ({room.roomID})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Staff</label>
          <select
            name="staff_id"
            value={form.staff_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2"
          >
            <option value="">Select staff</option>
            {staffs.map((staff) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.staff_name} ({staff.staff_id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Schedule Date</label>
          <input
            type="date"
            name="schedule_date"
            value={form.schedule_date}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Start Time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Cleaning Type</label>
          <select
            name="cleaning_type"
            value={form.cleaning_type}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2"
          >
            <option value="regular">Regular</option>
            <option value="checkout">Checkout</option>
            <option value="deep_cleaning">Deep Cleaning</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Remarks</label>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-2"
            placeholder="Optional note"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
        </button>
      </form>
    </div>
  );
}