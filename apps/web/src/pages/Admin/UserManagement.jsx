import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Shield, ShieldOff, UserCheck, UserX, RefreshCw } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 403) {
        toast.error("Only admins can access User Management.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    const tid = toast.loading("Updating role...");
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update role");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Role updated to ${newRole}`, { id: tid });
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    setUpdatingId(userId);
    const tid = toast.loading(newStatus ? "Activating user..." : "Deactivating user...");
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
      );
      toast.success(newStatus ? "User activated" : "User deactivated", { id: tid });
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-[#f6f7fb] min-h-screen p-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-gray-500 text-sm">Manage roles and access for all users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">All Users</h3>
          <p className="text-sm text-gray-400">{users.length} user{users.length !== 1 ? "s" : ""} total</p>
        </div>

        {loading ? (
          <p className="text-gray-500 py-10 text-center">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Change Role</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = user.id === currentUser.id;
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr key={user.id} className="border-b last:border-none hover:bg-gray-50">
                        <td className="py-3 font-medium">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">You</span>
                          )}
                        </td>
                        <td className="text-gray-600">{user.email}</td>
                        <td>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            disabled={isUpdating || isCurrentUser}
                            onClick={() =>
                              handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")
                            }
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                              user.role === "admin"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                            }`}>
                            {user.role === "admin" ? (
                              <><ShieldOff size={12} /> Remove Admin</>
                            ) : (
                              <><Shield size={12} /> Make Admin</>
                            )}
                          </button>
                        </td>
                        <td>
                          <button
                            disabled={isUpdating || isCurrentUser}
                            onClick={() => handleStatusChange(user.id, !user.is_active)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                              user.is_active
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}>
                            {user.is_active ? (
                              <><UserX size={12} /> Deactivate</>
                            ) : (
                              <><UserCheck size={12} /> Activate</>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
