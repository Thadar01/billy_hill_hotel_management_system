// app/schedules/edit/[id]/EditScheduleForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import { format } from 'date-fns';

interface ScheduleData {
  schedule_id: number;
  staff_id: string;
  staff_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  shift_type: "morning" | "evening" | "night" | null;
  status: "scheduled" | "off" | "leave" | "in progress" | "finish";
}

interface EditScheduleFormProps {
  scheduleId: string;
}

export default function EditScheduleForm({ scheduleId }: EditScheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    staff_id: "",
    staff_name: "",
    schedule_date: "",
    start_time: "",
    end_time: "",
    break_minutes: 30,
    shift_type: "morning" as "morning" | "evening" | "night" | "",
    status: "scheduled" as "scheduled" | "off" | "leave" | "in progress" | "finish" | "",
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/schedules/${scheduleId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch schedule');
        }
        
        const data = await res.json();
        const schedule = data.schedule;
        
        // Format time strings to HH:MM for input fields
        const formatTimeForInput = (timeStr: string) => {
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
          return timeStr;
        };

        setFormData({
          staff_id: schedule.staff_id,
          staff_name: schedule.staff_name,
          schedule_date: schedule.schedule_date.split('T')[0], // Get YYYY-MM-DD
          start_time: formatTimeForInput(schedule.start_time),
          end_time: formatTimeForInput(schedule.end_time),
          break_minutes: schedule.break_minutes,
          shift_type: schedule.shift_type || "",
          status: schedule.status || "",
        });
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) {
      fetchSchedule();
    }
  }, [scheduleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: formData.start_time,
          end_time: formData.end_time,
          break_minutes: parseInt(formData.break_minutes.toString()),
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      // Redirect back to schedules page
      router.push('/schedules');
      router.refresh();
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      router.push('/schedules');
      router.refresh();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-black">Loading schedule data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-black">Edit Schedule</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {/* Staff Info (read-only) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Name
                </label>
                <input
                  type="text"
                  value={formData.staff_name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.schedule_date}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>

            {/* Break Minutes */}
            <div>
              <label htmlFor="break_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                Break Minutes *
              </label>
              <input
                type="number"
                id="break_minutes"
                name="break_minutes"
                value={formData.break_minutes}
                onChange={handleChange}
                min="0"
                max="180"
                step="15"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            {/* Shift Type - Read only as it might be derived from time */}
            <div>
              <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 mb-1">
                Shift Type
              </label>
              <input
                type="text"
                id="shift_type"
                value={formData.shift_type}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 capitalize"
              />
              <p className="text-xs text-gray-500 mt-1">Shift type is automatically determined by time</p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in progress">In Progress</option>
                <option value="finish">Finish</option>
                <option value="off">Off</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}