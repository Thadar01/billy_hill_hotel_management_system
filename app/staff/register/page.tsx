"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

interface Role {
  role_id: number;
  role: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState({
    staff_name: "",
    staff_phone: "",
    staff_gmail: "",
    salary_rate: "",
    overtime_fees: "",
    role_id: "1", // default role id
    date_of_birth: "", // date picker
  });

  // Fetch roles for dropdown
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoles();
  }, []);

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary_rate: Number(form.salary_rate),
          overtime_fees: Number(form.overtime_fees),
          role_id: Number(form.role_id),
          date_of_birth: form.date_of_birth || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create staff");
        return;
      }

      alert(`Staff created successfully!\n\nAuto-generated Password: ${data.generatedPassword}\n\nPlease share this password with the staff member.`);
      router.push("/staff"); // go back to staff page after creation
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-md w-full mx-auto text-black">
        {/* Back button with icon before title */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/staff")}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-semibold text-black">Register Staff</h1>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input
              placeholder="e.g. John Doe"
              value={form.staff_name}
              onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <input
              placeholder="john@example.com"
              value={form.staff_gmail}
              onChange={(e) => setForm({ ...form, staff_gmail: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
            <input
              placeholder="e.g. +95 9..."
              value={form.staff_phone}
              onChange={(e) => setForm({ ...form, staff_phone: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Salary Rate</label>
            <input
              placeholder="e.g. 500000"
              value={form.salary_rate}
              onChange={(e) => setForm({ ...form, salary_rate: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Overtime Fee</label>
            <input
              placeholder="e.g. 5000"
              value={form.overtime_fees}
              onChange={(e) =>
                setForm({ ...form, overtime_fees: e.target.value })
              }
              className="border border-gray-300 rounded px-3 py-2 text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Staff Role</label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-black"
            >
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                setForm({ ...form, date_of_birth: e.target.value })
              }
              className="border border-gray-300 rounded px-3 py-2 text-black"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 mt-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-32 font-medium"
        >
          Create Staff
        </button>
      </div>
    </Layout>
  );
}
