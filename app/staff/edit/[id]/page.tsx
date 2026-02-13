"use client";

import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import { useRouter, useParams } from "next/navigation";

interface Staff {
  staff_id: string;
  staff_name: string;
  staff_gmail: string;
  staff_phone: string;
  role_id: number;
  salary_rate: number;
  overtime_fees: number;
}

interface Role {
  role_id: number;
  role: string;
}

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load staff from query string
  useEffect(() => {
    try {
      const query = new URLSearchParams(window.location.search);
      const encodedData = query.get("data");

      if (!encodedData) {
        router.push("/staff");
        return;
      }

      const parsedStaff = JSON.parse(decodeURIComponent(encodedData));
      setStaff(parsedStaff);
    } catch (err) {
      console.error("Invalid staff data");
      router.push("/staff");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error("Failed to fetch roles");
      }
    };

    fetchRoles();
  }, []);

  if (loading || !staff) return <Layout>Loading staff info…</Layout>;

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setStaff({ ...staff, [e.target.name]: e.target.value });
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staff),
      });

      if (!res.ok) throw new Error("Failed to update staff");

      alert("Staff updated successfully!");
      router.push("/staff");
    } catch (err) {
      console.error(err);
      alert("Error updating staff");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow text-black">
        <h1 className="text-2xl font-semibold mb-4 text-black">Edit Staff</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block font-medium mb-1 text-black">Name</label>
            <input
              type="text"
              name="staff_name"
              value={staff.staff_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">Email</label>
            <input
              type="email"
              name="staff_gmail"
              value={staff.staff_gmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">Phone</label>
            <input
              type="text"
              name="staff_phone"
              value={staff.staff_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">Role</label>
            <select
              name="role_id"
              value={staff.role_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black"
            >
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">Salary</label>
            <input
              type="number"
              name="salary_rate"
              value={staff.salary_rate}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-black">Overtime</label>
            <input
              type="number"
              name="overtime_fees"
              value={staff.overtime_fees}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => router.push("/staff")}
              className="flex-1 px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
