"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function StaffSettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [form, setForm] = useState({
    staff_name: "",
    staff_gmail: "",
    staff_phone: "",
  });

  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        staff_name: user.staff_name || "",
        staff_gmail: user.staff_gmail || "",
        staff_phone: "",
      });
      fetchStaffDetails();
    }
  }, [user]);

  const fetchStaffDetails = async () => {
    if (!user?.staff_id) return;
    try {
      const res = await fetch(`/api/staff/${user.staff_id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          staff_name: data.staff_name,
          staff_gmail: data.staff_gmail,
          staff_phone: data.staff_phone || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch staff details", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/staff/${user?.staff_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...form,
           role_id: user?.role_id
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      if (user) {
        setUser({
          ...user,
          staff_name: form.staff_name,
          staff_gmail: form.staff_gmail,
        });
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err) {
      setMessage({ type: "error", text: "Error updating profile. Please try again." });
      alert("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/staff/${user?.staff_id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: pwForm.oldPassword,
          newPassword: pwForm.newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }

      alert("Password changed successfully!");
      setIsChangingPassword(false);
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-4 py-12 text-black">
          Loading profile...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
                  title="Back"
                >
                  &#8592;
                </button>
                <h1 className="text-3xl font-bold text-black">
                  {user?.staff_name}&apos;s Settings
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Manage your staff account information and security.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <div className="font-semibold text-blue-700">Role Status</div>
              <div className="text-2xl font-bold text-blue-900">
                {user?.role_id === 1 ? "Administrator" : "Staff Member"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Staff ID</p>
              <p className="mt-1 font-medium text-black">{user?.staff_id}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="mt-1 font-medium text-black">{user?.staff_name}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="mt-1 font-medium text-black">{user?.staff_gmail}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="mt-1 font-medium text-black">{form.staff_phone || "Not provided"}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile((prev) => !prev);
                if (isChangingPassword) setIsChangingPassword(false);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {isEditingProfile ? "Cancel Editing" : "Edit Profile"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsChangingPassword((prev) => !prev);
                if (isEditingProfile) setIsEditingProfile(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              {isChangingPassword ? "Cancel Password Change" : "Change Password"}
            </button>
          </div>

          {isEditingProfile && (
            <form
              onSubmit={handleProfileSubmit}
              className="mt-8 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <h2 className="text-xl font-semibold text-black">Update Personal Details</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.staff_name}
                    onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    value={form.staff_gmail}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.staff_phone}
                    onChange={(e) => setForm({ ...form, staff_phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black px-4 py-3"
                    placeholder="e.g. +95 9..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {isChangingPassword && (
            <form
              onSubmit={handlePasswordSubmit}
              className="mt-8 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <h2 className="text-xl font-semibold text-black">Change Security Password</h2>
              <p className="mt-1 text-sm text-gray-600">
                Current password is required before setting a new one.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={pwForm.oldPassword}
                    onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-black px-4 py-3"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
