"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserLayout from "../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";

interface CustomerProfile {
  customerID: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  points: number;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { customer, isAuthenticated, hasHydrated, login } = useCustomerAuthStore();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [preferences, setPreferences] = useState<Record<string, string[]>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const formatPreferenceLabel = (key: string) => {
    const labels: Record<string, string> = {
      musicType: "Music Type",
      roomType: "Room Type",
      dinnerType: "Dinner Type",
      pillowType: "Pillow Type",
      bedType: "Bed Type",
      floorPreference: "Floor Preference",
      smokingPreference: "Smoking Preference",
    };

    return labels[key] || key;
  };

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !customer) {
      router.push("/user-login");
      return;
    }

    const loadProfile = async () => {
      try {
        const [profileRes, prefRes] = await Promise.all([
          fetch(`/api/customers/${customer.customerID}`, {
            cache: "no-store",
          }),
          fetch(`/api/customer-preferences/customer/${customer.customerID}`, {
            cache: "no-store",
          }),
        ]);

        const profileData = await profileRes.json();
        const prefData = await prefRes.json();

        if (!profileRes.ok) {
          alert(profileData.error || "Failed to load profile.");
          return;
        }

        const customerProfile: CustomerProfile = profileData.customer;

        setProfile(customerProfile);
        setProfileForm({
          fullName: customerProfile.fullName || "",
          phone: customerProfile.phone || "",
        });

        if (prefRes.ok) {
          setPreferences(prefData.preferences || {});
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        alert("Something went wrong.");
      } finally {
        setPageLoading(false);
      }
    };

    loadProfile();
  }, [hasHydrated, isAuthenticated, customer, router]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !customer) return;

    if (!profileForm.fullName || !profileForm.phone) {
      alert("Full name and phone are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/customers/${customer.customerID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update profile.");
        return;
      }

      const updatedProfile = {
        ...profile,
        fullName: profileForm.fullName,
        phone: profileForm.phone,
      };

      setProfile(updatedProfile);

      login({
        ...customer,
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        points: profile.points,
      });

      setIsEditingProfile(false);
      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer || !profile) return;

    if (!passwordForm.oldPassword) {
      alert("Old password is required.");
      return;
    }

    if (!passwordForm.newPassword) {
      alert("New password is required.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/customers/${customer.customerID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update password.");
        return;
      }

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setIsChangingPassword(false);

      alert("Password updated successfully.");
    } catch (error) {
      console.error("Password update error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || pageLoading) {
    return (
      <UserLayout>
        <div className="px-4 py-12 text-black">Loading profile...</div>
      </UserLayout>
    );
  }

  if (!profile) {
    return (
      <UserLayout>
        <div className="px-4 py-12 text-black">Profile not found.</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                {profile.fullName}&apos;s Profile
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                View your account details and manage your profile.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <div className="font-semibold text-blue-700">Reward Points</div>
              <div className="text-2xl font-bold text-blue-900">{profile.points}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Customer ID</p>
              <p className="mt-1 font-medium text-black">{profile.customerID}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Created At</p>
              <p className="mt-1 font-medium text-black">{profile.createdAt}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="mt-1 font-medium text-black">{profile.fullName}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 font-medium text-black">{profile.email}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="mt-1 font-medium text-black">{profile.phone}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-5">
              <p className="text-sm text-gray-500">Points</p>
              <p className="mt-1 font-medium text-black">{profile.points}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">Preferences</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Your saved hotel preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/user-preferences")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
              >
                Manage Preferences
              </button>
            </div>

            {Object.keys(preferences).length === 0 ? (
              <p className="text-sm text-gray-500">No preferences added yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(preferences).map(([key, values]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-gray-200 bg-zinc-50 p-4"
                  >
                    <p className="text-sm font-medium text-gray-500">
                      {formatPreferenceLabel(key)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {values.map((value) => (
                        <span
                          key={value}
                          className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {isEditingProfile ? "Cancel Edit Profile" : "Edit Profile"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsChangingPassword((prev) => !prev);
                if (isEditingProfile) setIsEditingProfile(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              {isChangingPassword ? "Cancel Change Password" : "Change Password"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/user-preferences")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              Preferences
            </button>
          </div>

          {isEditingProfile && (
            <form
              onSubmit={handleProfileUpdate}
              className="mt-8 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <h2 className="text-xl font-semibold text-black">Edit Profile</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Save Profile"}
              </button>
            </form>
          )}

          {isChangingPassword && (
            <form
              onSubmit={handlePasswordUpdate}
              className="mt-8 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <h2 className="text-xl font-semibold text-black">Change Password</h2>
              <p className="mt-1 text-sm text-gray-600">
                Old password is required before setting a new password.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Old Password
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Save Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </UserLayout>
  );
}