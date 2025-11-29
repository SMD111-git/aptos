import React, { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin" | null;
  phone?: string;
  rollNumber?: string; // for students
  department?: string;
};

const USERS_KEY = "myapp_users";

type Props = {
  onBack?: () => void;
  onRegisterSuccess?: () => void;
};

export default function RegisterPage({ onBack, onRegisterSuccess }: Props): JSX.Element {
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    role: null,
    phone: "",
    rollNumber: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(field: keyof RegisterData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError("Name, email, password, and role are required.");
      return;
    }

    if (formData.role === "student" && !formData.rollNumber) {
      setError("Roll number is required for students.");
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with real backend registration API
      await new Promise((res) => setTimeout(res, 800));

      // load existing users
      let users: any[] = [];
      try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) users = JSON.parse(raw);
      } catch {}

      // check if email already exists
      if (users.find((u) => u.email === formData.email)) {
        setError("Email already registered. Please sign in.");
        setLoading(false);
        return;
      }

      // add new user
      const newUser = {
        id: Math.random().toString(36).slice(2, 9),
        ...formData,
        createdAt: Date.now(),
        canUpload: formData.role === "admin",
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      setSuccess(true);
      setError(null);
      setTimeout(() => {
        onRegisterSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err?.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserPlus className="w-6 h-6 text-blue-700" />
              <h3 className="text-xl font-semibold text-blue-700">Register</h3>
            </div>
            <p className="text-sm text-blue-600">Create a new account to access the portal</p>
          </div>
        </div>

        {success ? (
          <div className="text-center p-6 bg-green-50 border border-green-100 rounded">
            <div className="text-lg font-medium text-green-700 mb-2">Registration successful!</div>
            <div className="text-sm text-green-600">Redirecting to login...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Select your role *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("role", "student")}
                  className={`flex-1 px-4 py-2 rounded border text-sm transition ${
                    formData.role === "student"
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-700 border-gray-200 hover:shadow"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("role", "admin")}
                  className={`flex-1 px-4 py-2 rounded border text-sm transition ${
                    formData.role === "admin"
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-700 border-gray-200 hover:shadow"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="border border-blue-100 rounded p-4 bg-white space-y-3">
              <div>
                <label className="block text-xs text-blue-600 mb-1">Full Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-blue-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-blue-600 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-blue-600 mb-1">Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {formData.role === "student" && (
                <>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Roll Number / ID *</label>
                    <input
                      value={formData.rollNumber}
                      onChange={(e) => handleChange("rollNumber", e.target.value)}
                      placeholder="2021CS001"
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Department</label>
                    <input
                      value={formData.department}
                      onChange={(e) => handleChange("department", e.target.value)}
                      placeholder="Computer Science"
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !formData.role}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: null,
                    phone: "",
                    rollNumber: "",
                    department: "",
                  })
                }
                className="px-4 py-2 bg-white border rounded"
              >
                Clear
              </button>
            </div>
          </form>
        )}

        {error && <div className="mt-3 text-sm text-red-600 text-center">{error}</div>}

        <div className="mt-4 text-center text-xs text-gray-500">
          Note: This is a demo. In production, use a secure backend for registration and authentication.
        </div>
      </div>
    </div>
  );
}
