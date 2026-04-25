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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const requiredFields = ["staff_name", "staff_gmail", "staff_phone", "role_id", "salary_rate", "overtime_fees"];

  const isFieldInvalid = (fieldName: string) => {
    if (!staff) return false;
    const value = staff[fieldName as keyof Staff];
    
    if (fieldName === "staff_gmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strValue = value?.toString() || "";
      // Show error if user typed something invalid, OR if they tried to submit an empty/invalid email
      return (strValue.length > 0 && !emailRegex.test(strValue)) || (attemptedSubmit && !emailRegex.test(strValue));
    }

    if (!attemptedSubmit) return false;
    if (!value) return true;
    
    return false;
  };

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
    const { name, value } = e.target;
    let finalValue: any = value;
    
    if (["staff_phone", "salary_rate", "overtime_fees"].includes(name)) {
      finalValue = value.replace(/\D/g, '');
    }
    
    setStaff({ ...staff, [name]: finalValue });
  };

  // Save changes
  const handleSave = async () => {
    setAttemptedSubmit(true);
    
    const isAnyInvalid = requiredFields.some(field => isFieldInvalid(field));
    if (isAnyInvalid) {
      if (isFieldInvalid("staff_gmail") && staff.staff_gmail) {
        alert("Invalid email format (e.g. example@gmail.com)");
      } else {
        alert("Please Fill all the required fields correctly");
      }
      return;
    }

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
      <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-xl text-black border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/staff")}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button>
          <h1 className="text-3xl font-bold text-black tracking-tight">Edit Staff Profile</h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("staff_name") ? "text-red-500" : "text-gray-500"}`}>
              Full Name <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="text"
              name="staff_name"
              value={staff.staff_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("staff_name") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("staff_gmail") ? "text-red-500" : "text-gray-500"}`}>
              Email Address <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="email"
              name="staff_gmail"
              value={staff.staff_gmail}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("staff_gmail") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("staff_phone") ? "text-red-500" : "text-gray-500"}`}>
              Phone Number <span className="text-[10px] font-normal opacity-70">(required - numbers only)</span>
            </label>
            <input
              type="text"
              name="staff_phone"
              value={staff.staff_phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("staff_phone") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("role_id") ? "text-red-500" : "text-gray-500"}`}>
              Assigned Role <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <select
              name="role_id"
              value={staff.role_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("role_id") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            >
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("salary_rate") ? "text-red-500" : "text-gray-500"}`}>
                Salary (MMK) <span className="text-[10px] font-normal opacity-70">(required - numbers only)</span>
              </label>
              <input
                type="text"
                name="salary_rate"
                value={staff.salary_rate}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("salary_rate") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("overtime_fees") ? "text-red-500" : "text-gray-500"}`}>
                Overtime (MMK) <span className="text-[10px] font-normal opacity-70">(required - numbers only)</span>
              </label>
              <input
                type="text"
                name="overtime_fees"
                value={staff.overtime_fees}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("overtime_fees") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-4 rounded-xl bg-blue-600 text-white font-bold uppercase text-xs tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {saving ? "Processing..." : "Update Profile"}
            </button>
            <button
              onClick={() => router.push("/staff")}
              className="flex-1 px-4 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
