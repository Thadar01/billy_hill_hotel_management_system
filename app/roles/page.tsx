"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";

interface Role {
  role_id: number;
  role: string;
}

type ApiResponse = {
  error?: string;
  role?: Role;
  roles?: Role[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // Load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(
          (data.roles || []).sort((a: Role, b: Role) => a.role_id - b.role_id)
        );
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    loadRoles();
  }, []);

  const filteredRoles = roles.filter((role) =>
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add Role
  const handleAddRole = async () => {
    if (!newRole.trim()) return;

    try {
      const res = await fetch("/api/roles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole.trim() }),
      });

      const data: ApiResponse = (await res.json()) as ApiResponse;

      if (!res.ok) {
        alert(data.error || `Failed to add role (Status: ${res.status})`);
        return;
      }

      setNewRole("");
      setShowForm(false);

      // Reload roles
      const reloadRes = await fetch("/api/roles");
      const reloadData = (await reloadRes.json()) as ApiResponse;
      setRoles((reloadData.roles || []).sort((a, b) => a.role_id - b.role_id));

      alert("Role added successfully!");
    } catch (err) {
      console.error("Failed to add role", err);
      alert("Failed to add role due to network or server error");
    }
  };

  // Edit Role
  const startEdit = (role: Role) => {
    setEditingRoleId(role.role_id);
    setEditingRoleName(role.role);
  };
  const cancelEdit = () => {
    setEditingRoleId(null);
    setEditingRoleName("");
  };
  const saveEdit = async (id: number) => {
    if (!editingRoleName.trim()) return;

    const res = await fetch(`/api/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editingRoleName }),
    });
    const data: ApiResponse = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update role");
      return;
    }

    setEditingRoleId(null);
    setEditingRoleName("");

    // Reload roles
    const reloadRes = await fetch("/api/roles");
    const reloadData = await reloadRes.json() as ApiResponse;
    setRoles((reloadData.roles || []).sort((a, b) => a.role_id - b.role_id));
  };

  const deleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    const data: ApiResponse = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to delete role");
      return;
    }

    setRoles((prev) => prev.filter((r) => r.role_id !== id));
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-black">Roles</h1>

          <div className="flex gap-2">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Add Role
              </button>
            ) : (
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Add Role Input */}
        {showForm && (
          <div className="flex gap-2 mt-2 w-full">
            <input
              placeholder="Role Name"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 flex-1 text-black"
            />
            <button
              onClick={handleAddRole}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Save
            </button>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-black w-full"
        />

        {/* Role List */}
        <ul className="flex flex-col gap-2 mt-4">
          {filteredRoles.length === 0 ? (
            <p className="text-gray-500">No roles found.</p>
          ) : (
            filteredRoles.map((role) => (
              <li
                key={role.role_id}
                className="flex items-center justify-between bg-gray-100 rounded px-4 py-2 text-black"
              >
                {editingRoleId !== role.role_id ? (
                  <>
                    <span>{role.role}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(role)}
                        className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRole(role.role_id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      value={editingRoleName}
                      onChange={(e) => setEditingRoleName(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 flex-1 text-black mr-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(role.role_id)}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </Layout>
  );
}
