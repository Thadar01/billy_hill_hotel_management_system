"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/navigation";

interface Staff {
  staff_id: string;
  staff_name: string;
  staff_gmail: string;
  staff_phone: string;
  role_id: number;
  salary_rate: number;
  overtime_fees: number;
  role?: string;
}

interface Role {
  role_id: number;
  role: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [openStaffId, setOpenStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchRole, setSearchRole] = useState<number | "">("");

  const router = useRouter();

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      const res = await fetch("/api/roles");
      const data = await res.json();
      setRoles(data.roles || []);
    };
    fetchRoles();
  }, []);

  // Fetch staff whenever search changes
  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchName) params.set("q", searchName);
      if (searchRole) params.set("role_id", searchRole.toString());

      const res = await fetch(`/api/staff?${params.toString()}`);
      const data = await res.json();
      setStaffList(data.staff || []);
      setLoading(false);
    };

    fetchStaff();
  }, [searchName, searchRole]);

  const getRoleName = (id: number) =>
    roles.find((r) => r.role_id === id)?.role ?? "Unknown";

  const handleEdit = (staff: Staff) => {
    const encoded = encodeURIComponent(JSON.stringify(staff));
    router.push(`/staff/edit/${staff.staff_id}?data=${encoded}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff?")) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete staff");
      setStaffList((prev) => prev.filter((s) => s.staff_id !== id));
      alert("Staff deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting staff");
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm("Reset password for this staff?")) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to reset password");
      const data = await res.json();
      alert(`Password reset successfully! New password: ${data.password}`);
    } catch (err) {
      console.error(err);
      alert("Error resetting password");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-black">Staff List</h1>
          <button
            onClick={() => router.push("/staff/register")}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Register Staff
          </button>
        </div>

        {/* Search Filters */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-black"
          />
          <select
            value={searchRole}
            onChange={(e) =>
              setSearchRole(e.target.value ? Number(e.target.value) : "")
            }
            className="px-3 py-2 border rounded text-black"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role}
              </option>
            ))}
          </select>
        </div>

        {/* Staff List Scroll Container */}
        <div className="flex flex-col gap-4 mt-2 max-h-[560px] overflow-y-auto border border-gray-200 p-2 rounded">
          {loading && (
            <p className="text-center text-black py-4">Loading staff…</p>
          )}

          {!loading && staffList.length === 0 && (
            <p className="text-center text-gray-500 py-8">No staff found</p>
          )}

          {staffList.map((staff) => {
            const isOpen = openStaffId === staff.staff_id;
            return (
              <div
                key={staff.staff_id}
                className="border border-gray-200 rounded-lg bg-white text-black"
              >
                <button
                  onClick={() =>
                    setOpenStaffId(isOpen ? null : staff.staff_id)
                  }
                  className="w-full flex justify-between items-center p-4 text-left"
                >
                  <div>
                    <p className="font-medium text-lg">{staff.staff_name}</p>
                    <p className="text-sm text-black">{staff.staff_gmail}</p>
                    <p className="text-sm text-black">
                      {getRoleName(staff.role_id)}
                    </p>
                  </div>
                  <span className="text-sm text-black">
                    {isOpen ? "Hide" : "Details"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 text-black">
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {staff.staff_phone}
                    </p>
                    <p>
                      <span className="font-medium">Salary:</span>{" "}
                      {staff.salary_rate}
                    </p>
                    <p>
                      <span className="font-medium">Overtime:</span>{" "}
                      {staff.overtime_fees}
                    </p>

                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="flex-1 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleReset(staff.staff_id)}
                        className="flex-1 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleDelete(staff.staff_id)}
                        className="flex-1 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
