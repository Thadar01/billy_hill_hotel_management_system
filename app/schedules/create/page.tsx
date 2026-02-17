"use client";
import { useState, useEffect } from "react";
import Layout from "../../components/Layout";

interface Staff {
  staff_id: string;
  staff_name: string;
}

// Helper function to get dates based on start date and selected weekdays
// Helper function to get dates based on start date and selected weekdays
function getDatesFromWeekdays(startDate: string, days: string[]): string[] {
  if (!startDate || days.length === 0) return [];
  
  const result: string[] = [];
  const start = new Date(startDate);
  const dayMap: { [key: string]: number } = {
    "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
  };
  
  // Convert selected day names to numbers
  const selectedDayNumbers = days.map(day => dayMap[day]);
  
  // CHANGE THIS: from 4 weeks to 1 week
  for (let week = 0; week < 1; week++) {
    for (const dayNum of selectedDayNumbers) {
      const date = new Date(start);
      // Calculate days to add to reach the next occurrence of the selected day
      const currentDay = date.getDay();
      let daysToAdd = dayNum - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      
      // Add weeks
      daysToAdd += week * 7;
      
      date.setDate(date.getDate() + daysToAdd);
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      result.push(`${year}-${month}-${day}`);
    }
  }
  
  // Sort dates and remove duplicates
  return [...new Set(result)].sort();
}

// Helper to determine shift type based on time
function getShiftTypeFromTime(time: string): "morning" | "evening" | "night" {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "evening";
  return "night";
}

export default function CreateSchedule() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    staff_ids: [] as string[],
    start_date: "",
    days: [] as string[],
    start_time: "",
    end_time: "",
    break_minutes: 60,
  });

  // Fetch staff to populate multi-select
  useEffect(() => {
    const fetchStaff = async () => {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setStaffList(data.staff || []);
    };
    fetchStaff();
  }, []);

  const toggleStaff = (id: string) => {
    setForm((prev) => ({
      ...prev,
      staff_ids: prev.staff_ids.includes(id)
        ? prev.staff_ids.filter((s) => s !== id)
        : [...prev.staff_ids, id],
    }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const submit = async () => {
    if (!form.start_date || form.staff_ids.length === 0) {
      alert("Please select staff and start date");
      return;
    }
    if (form.days.length === 0) {
      alert("Select at least one day");
      return;
    }
    if (!form.start_time || !form.end_time) {
      alert("Please select start and end time");
      return;
    }

    // Generate actual dates from weekdays
    const dates = getDatesFromWeekdays(form.start_date, form.days);
    
    if (dates.length === 0) {
      alert("No dates generated. Please check your selection.");
      return;
    }

    // Determine shift type based on start time
    const shift_type = getShiftTypeFromTime(form.start_time);

    // Prepare data in the format expected by the API
    const requestData = {
      staff_ids: form.staff_ids,
      dates: dates,
      start_time: form.start_time,
      end_time: form.end_time,
      break_minutes: form.break_minutes,
      shift_type: shift_type
    };

    const res = await fetch("/api/schedules/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to create schedule");
      return;
    }

    alert(`Schedule created successfully! Generated ${dates.length} dates.`);
    setForm({
      staff_ids: [],
      start_date: "",
      days: [],
      start_time: "",
      end_time: "",
      break_minutes: 60,
    });
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Layout>
      <h1 className="text-2xl text-black mb-4">Create Schedule</h1>

      {/* Staff multi-select */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Select Staff</label>
        <div className="flex flex-wrap gap-2">
          {staffList.map((s) => (
            <button
              key={s.staff_id}
              type="button"
              onClick={() => toggleStaff(s.staff_id)}
              className={`px-3 py-1 rounded border ${
                form.staff_ids.includes(s.staff_id)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              {s.staff_name}
            </button>
          ))}
        </div>
      </div>

      {/* Start date */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Start Date</label>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, start_date: e.target.value }))
          }
          className="border px-3 py-2 rounded w-64"
        />
      </div>

      {/* Weekdays buttons */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Select Days of Week</label>
        <div className="flex gap-2">
          {weekdays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 rounded border ${
                form.days.includes(day)
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Time and break */}
      <div className="mb-4 flex gap-4 items-center">
        <div>
          <label className="block font-medium mb-1">Start Time</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, start_time: e.target.value }))
            }
            className="border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">End Time</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, end_time: e.target.value }))
            }
            className="border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Break (min)</label>
          <input
            type="number"
            value={form.break_minutes}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                break_minutes: Number(e.target.value),
              }))
            }
            className="border px-3 py-2 rounded w-24"
          />
        </div>
      </div>

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Schedule
      </button>
    </Layout>
  );
}