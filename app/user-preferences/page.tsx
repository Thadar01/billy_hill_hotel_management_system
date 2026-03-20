"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserLayout from "../components/UserLayout";
import { useCustomerAuthStore } from "@/store/useCustomerAuthStore";

type PreferenceMap = Record<string, string[]>;

const preferenceTypes = [
  "musicType",
  "roomType",
  "dinnerType",
  "pillowType",
  "bedType",
  "floorPreference",
  "smokingPreference",
];

export default function UserPreferencesPage() {
  const router = useRouter();
  const { customer, isAuthenticated, hasHydrated } = useCustomerAuthStore();

  const [preferences, setPreferences] = useState<PreferenceMap>({});
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !customer) {
      router.push("/user-login");
      return;
    }

    const loadPreferences = async () => {
      try {
        const res = await fetch(
          `/api/customer-preferences/customer/${customer.customerID}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Failed to load preferences.");
          return;
        }

        setPreferences(data.preferences || {});
      } catch (error) {
        console.error("Failed to load preferences:", error);
        alert("Something went wrong.");
      } finally {
        setPageLoading(false);
      }
    };

    loadPreferences();
  }, [hasHydrated, isAuthenticated, customer, router]);

  const handleInputChange = (key: string, value: string) => {
    setNewValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddValue = (key: string) => {
    const value = (newValues[key] || "").trim();
    if (!value) return;

    const currentValues = preferences[key] || [];

    if (currentValues.includes(value)) {
      alert("This value already exists.");
      return;
    }

    setPreferences((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), value],
    }));

    setNewValues((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const handleRemoveValue = (key: string, valueToRemove: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((value) => value !== valueToRemove),
    }));
  };

  const handleSaveKey = async (key: string) => {
    if (!customer) return;

    setSavingKey(key);

    try {
      const response = await fetch(
        `/api/customer-preferences/customer/${customer.customerID}/replace`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferenceKey: key,
            values: preferences[key] || [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to save preferences.");
        return;
      }

      alert(`${key} saved successfully.`);
    } catch (error) {
      console.error("Save preference error:", error);
      alert("Something went wrong.");
    } finally {
      setSavingKey(null);
    }
  };

  if (!hasHydrated || pageLoading) {
    return (
      <UserLayout>
        <div className="px-4 py-12 text-black">Loading preferences...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">My Preferences</h1>
              <p className="mt-2 text-sm text-gray-600">
                Add and manage multiple preferences for each category.
              </p>
            </div>

            <button
              onClick={() => router.push("/user-profile")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              Back to Profile
            </button>
          </div>

          <div className="space-y-6">
            {preferenceTypes.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 bg-zinc-50 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-black">{key}</h2>

                  <button
                    onClick={() => handleSaveKey(key)}
                    disabled={savingKey === key}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingKey === key ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="mb-4 flex gap-3">
                  <input
                    type="text"
                    value={newValues[key] || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={`Add ${key}`}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddValue(key)}
                    className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-black hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>

                {preferences[key] && preferences[key].length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences[key].map((value) => (
                      <div
                        key={value}
                        className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-800"
                      >
                        <span>{value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(key, value)}
                          className="font-bold text-blue-900 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No values added yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}