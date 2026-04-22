"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

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
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});
  const [fetchingExtra, setFetchingExtra] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuthStore();

  const roleName = roles.find((r) => r.role_id === user?.role_id)?.role ?? "Unknown";
  const normalizedRole = roleName.toLowerCase();
  const isManager = ["general manager"].includes(normalizedRole);

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

  const fetchPerformance = async (staff_id: string) => {
    if (performanceData[staff_id]) return;
    try {
      setFetchingExtra(staff_id);
      const res = await fetch(`/api/staff/${staff_id}`);
      if (!res.ok) throw new Error("Failed to fetch performance");
      const data = await res.json();
      setPerformanceData((prev) => ({ ...prev, [staff_id]: data.performance }));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingExtra(null);
    }
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
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full text-black">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-black">Staff Directory</h1>
            <p className="text-gray-500 text-sm">Manage team members, roles, and performance metrics</p>
          </div>
          {isManager && <button
            onClick={() => router.push("/staff/register")}
            className="w-full py-3 rounded bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Register Staff
          </button>}

        </div>

        {/* Dynamic Search & Filters */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
            />
          </div>
          <div className="relative">
            <select
              value={searchRole}
              onChange={(e) =>
                setSearchRole(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
            >
              <option value="">All Staff Roles</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff List Grid Container */}
        <div className="flex flex-col gap-4 mt-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Synchronizing directory...</p>
            </div>
          )}

          {!loading && staffList.length === 0 && (
            <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] py-20 text-center">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No team members matches your criteria</p>
            </div>
          )}

          {!loading && staffList.map((staff) => {
            const isOpen = openStaffId === staff.staff_id;
            return (
              <div
                key={staff.staff_id}
                className={`group border rounded-lg bg-white transition-all duration-300 ${isOpen ? "ring-1 ring-gray-300 shadow-md" : "border-gray-200 hover:border-gray-300 shadow-sm"
                  }`}
              >
                <button
                  onClick={() => {
                    const nextOpen = isOpen ? null : staff.staff_id;
                    setOpenStaffId(nextOpen);
                    if (nextOpen) fetchPerformance(nextOpen);
                  }}
                  className="w-full flex justify-between items-center p-5 md:p-8 text-left transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-lg text-black">{staff.staff_name}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {getRoleName(staff.role_id)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{staff.staff_gmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isOpen ? "bg-black text-white border-black" : "border-gray-100 text-gray-300 group-hover:border-gray-900 group-hover:text-gray-900"
                      }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 md:px-8 pb-8 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className={`grid grid-cols-1 ${getRoleName(staff.role_id).toLowerCase() === 'housekeeping' ? 'lg:grid-cols-2' : ''} gap-8 border-t border-gray-100 pt-6`}>
                      {/* Detailed Info Card */}
                      <div className="space-y-6 p-2">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Contact & Compensation</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Primary Phone</p>
                              <p className="text-sm font-semibold text-gray-900">{staff.staff_phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Base Hourly Rate</p>
                              <p className="text-sm font-semibold text-gray-900">{Number(staff.salary_rate).toFixed(2)} MMK/hr</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">OT Premium Fee</p>
                              <p className="text-sm font-semibold text-gray-900">{Number(staff.overtime_fees).toFixed(2)} MMK/hr</p>
                            </div>
                          </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Last 30 Days Cycle</h4>
                          {fetchingExtra === staff.staff_id ? (
                            <div className="animate-pulse space-y-4">
                              <div className="h-6 bg-gray-200 rounded w-full"></div>
                              <div className="h-6 bg-gray-200 rounded w-full"></div>
                            </div>
                          ) : performanceData[staff.staff_id] ? (
                            <div className="grid grid-cols-3 gap-4 text-left">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Worked</div>
                                <div className="text-xl font-semibold text-gray-900">{performanceData[staff.staff_id].stats.totalWorkedHours}h</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Overtime</div>
                                <div className="text-xl font-semibold text-gray-900">{(performanceData[staff.staff_id].stats.totalOvertimeMinutes / 60).toFixed(1)}h</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Late Arrival</div>
                                <div className="text-xl font-semibold text-gray-900">{(performanceData[staff.staff_id].stats.totalLateMinutes / 60).toFixed(1)}h</div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic py-4">No attendance data recorded in this period</p>
                          )}
                        </div>
                      </div>

                      {/* Housekeeping Feedback Panel */}
                      {getRoleName(staff.role_id).toLowerCase() === 'housekeeping' && (
                        <div className="space-y-6 p-2">
                          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col h-full">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Guest Experience Reviews</h4>
                            {performanceData[staff.staff_id]?.feedbacks?.length > 0 ? (
                              <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                {performanceData[staff.staff_id].feedbacks.map((fb: any) => (
                                  <div key={fb.feedbackId} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-xs font-semibold text-black">{fb.customerName}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Room {fb.roomNumber}</p>
                                      </div>
                                      <div className="flex text-amber-400 text-xs gap-0.5">
                                        {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600 italic leading-relaxed">"{fb.comment}"</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                <p className="text-[10px] font-bold uppercase tracking-widest">No feedback received</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {isManager && <div className="flex flex-row sm:flex-col gap-4 mt-8 pt-6 mb-2 ml-2 mr-2 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="flex-1 py-3 rounded bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => handleReset(staff.staff_id)}
                        className="flex-1 py-3 rounded bg-blue-300 text-black font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        Reset Access
                      </button>
                      <button
                        onClick={() => handleDelete(staff.staff_id)}
                        className="flex-1 px-4 py-2.5 rounded bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors shadow-sm"
                      >
                        Delete Staff
                      </button>
                    </div>}


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
