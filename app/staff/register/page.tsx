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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    staff_name: "",
    staff_phone: "",
    staff_gmail: "",
    salary_rate: "",
    overtime_fees: "",
    role_id: "1", // default role id
    date_of_birth: "", // date picker
  });

  const requiredFields = ["staff_name", "staff_gmail", "staff_phone", "salary_rate", "overtime_fees", "role_id"];
  
  const isFieldInvalid = (fieldName: string) => {
    const value = form[fieldName as keyof typeof form];
    
    if (fieldName === "staff_gmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Show error if user typed something invalid, OR if they tried to submit an empty/invalid email
      return (value.length > 0 && !emailRegex.test(value)) || (attemptedSubmit && !emailRegex.test(value));
    }

    if (!attemptedSubmit) return false;
    if (!value) return true;
    
    return false;
  };

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
    setAttemptedSubmit(true);
    
    // Check if any required field is missing or invalid
    const isAnyInvalid = requiredFields.some(field => isFieldInvalid(field));
    if (isAnyInvalid) {
      if (isFieldInvalid("staff_gmail") && form.staff_gmail) {
        alert("Invalid email format (e.g. example@gmail.com)");
      } else {
        alert("Please Fill all the required fields correctly");
      }
      return; // Stop submission
    }

    setSaving(true);
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
        setSaving(false);
        return;
      }

      alert(`Staff created successfully!\n\nAuto-generated Password: ${data.generatedPassword}\n\nPlease share this password with the staff member.`);
      router.push("/staff"); // go back to staff page after creation
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    
    if (["staff_phone", "salary_rate", "overtime_fees"].includes(name)) {
      finalValue = value.replace(/\D/g, '');
    }
    
    setForm({ ...form, [name]: finalValue });
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
          <h1 className="text-3xl font-bold text-black tracking-tight">Register Staff</h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("staff_name") ? "text-red-500" : "text-gray-500"}`}>
              Full Name <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="text"
              name="staff_name"
              placeholder="e.g. John Doe"
              value={form.staff_name}
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
              placeholder="john@example.com"
              value={form.staff_gmail}
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
              placeholder="e.g. 09..."
              value={form.staff_phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("staff_phone") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("role_id") ? "text-red-500" : "text-gray-500"}`}>
                Assigned Role <span className="text-[10px] font-normal opacity-70">(required)</span>
              </label>
              <select
                name="role_id"
                value={form.role_id}
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

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-bold uppercase tracking-wider ${isFieldInvalid("salary_rate") ? "text-red-500" : "text-gray-500"}`}>
                Salary (MMK) <span className="text-[10px] font-normal opacity-70">(required - numbers only)</span>
              </label>
              <input
                type="text"
                name="salary_rate"
                placeholder="e.g. 500000"
                value={form.salary_rate}
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
                placeholder="e.g. 5000"
                value={form.overtime_fees}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-black transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${isFieldInvalid("overtime_fees") ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-4 py-4 rounded-xl bg-blue-600 text-white font-bold uppercase text-xs tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {saving ? "Processing..." : "Create Staff Profile"}
            </button>
            <button
              onClick={() => router.push("/staff")}
              className="flex-1 px-4 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
            >
              Discard Registration
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
