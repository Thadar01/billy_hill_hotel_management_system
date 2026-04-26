"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface RoomOption {
  roomID: string;
  roomNumber: string;
}

interface StaffOption {
  staff_id: string;
  staff_name: string;
  role: string;
}

interface FormData {
  room_id: string;
  staff_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  cleaning_type: "standard" | "deep" | "turn_down" | "check_out_cleaning";
  priority: "low" | "medium" | "high";
  remarks: string;
}

const emptyForm: FormData = {
  room_id: "",
  staff_id: "",
  schedule_date: new Date().toISOString().split("T")[0],
  start_time: "09:00",
  end_time: "10:00",
  cleaning_type: "standard",
  priority: "medium",
  remarks: "",
};

interface Props {
  editingId?: string;
  initialData?: Partial<FormData>;
}

export default function HouseKeepingScheduleForm({
  editingId,
  initialData,
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
          fetch("/api/rooms?admin=true", { cache: "no-store" }),
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

    if (!form.room_id) {
      alert("Please select the room first.");
      return;
    }
    if (!form.staff_id) {
      alert("Please select the housekeeping staff.");
      return;
    }
    if (!form.schedule_date) {
      alert("Please select the schedule date.");
      return;
    }
    if (!form.start_time) {
      alert("Please select the start time.");
      return;
    }
    if (!form.end_time) {
      alert("Please select the end time.");
      return;
    }
    if (!form.cleaning_type) {
      alert("Please select the cleaning type.");
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
      <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4 text-black">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Schedule" : "Create Schedule"}
        </h2>
      </div>



      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-black">Room</label>
          <select
            name="room_id"
            value={form.room_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2 text-black"
          >
            <option value="">Select Room</option>
            {rooms.map((room) => (
              <option key={room.roomID} value={room.roomID}>
                Room {room.roomNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-black">Housekeeper</label>
          <select
            name="staff_id"
            value={form.staff_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-2 text-black"
          >
            <option value="">Select Housekeeper</option>
            {staffs.map((staff) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.staff_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-black">Date</label>
            <input
              type="date"
              name="schedule_date"
              value={form.schedule_date}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2 text-black"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black">Start Time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2 text-black"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black">End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2 text-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-black">Cleaning Type</label>
            <select
              name="cleaning_type"
              value={form.cleaning_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2 text-black"
            >
              <option value="standard">Standard Cleaning</option>
              <option value="deep">Deep Cleaning</option>
              <option value="turn_down">Turn Down Service</option>
              <option value="check_out_cleaning">Check Out Cleaning</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black">Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2 text-black"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-black">Remarks</label>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-2 text-black"
            placeholder="Any special instructions..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/housekeeping-schedules")}
            className="flex-1 rounded-lg border border-gray-300 py-2 font-medium hover:bg-gray-50 text-black"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}