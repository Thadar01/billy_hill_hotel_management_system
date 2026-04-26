"use client";

import Link from "next/link";
import { useState } from "react";
import UserLayout from "../components/UserLayout";
import { useRouter } from "next/navigation";

export default function UserRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isFieldInvalid = (fieldName: string) => {
    const value = form[fieldName as keyof typeof form];
    
    if (fieldName === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return (value.length > 0 && !emailRegex.test(value)) || (attemptedSubmit && !emailRegex.test(value));
    }
    
    if (fieldName === "confirmPassword" && attemptedSubmit) {
      return !value || value !== form.password;
    }

    if (!attemptedSubmit) return false;
    if (!value) return true;
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert("Invalid email format.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/customers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to register.");
        setLoading(false);
        return;
      }

      alert("Registration successful.");
      router.push("/user-login");
    } catch (error) {
      console.error("Register error:", error);
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-black">
          <h1 className="text-3xl font-bold text-black">Register</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start booking rooms easily.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={`mb-1 block text-sm font-medium ${isFieldInvalid("fullName") ? "text-red-500" : "text-black"}`}>
                Full Name <span className="text-xs font-normal opacity-70">(required)</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${isFieldInvalid("fullName") ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium ${isFieldInvalid("email") ? "text-red-500" : "text-black"}`}>
                Email <span className="text-xs font-normal opacity-70">(required)</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${isFieldInvalid("email") ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium ${isFieldInvalid("phone") ? "text-red-500" : "text-black"}`}>
                Phone <span className="text-xs font-normal opacity-70">(required)</span>
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${isFieldInvalid("phone") ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium ${isFieldInvalid("password") ? "text-red-500" : "text-black"}`}>
                Password <span className="text-xs font-normal opacity-70">(required)</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${isFieldInvalid("password") ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium ${isFieldInvalid("confirmPassword") ? "text-red-500" : "text-black"}`}>
                Confirm Password <span className="text-xs font-normal opacity-70">(required)</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${isFieldInvalid("confirmPassword") ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/user-login"
              className="font-medium text-blue-600 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </UserLayout>
  );
}