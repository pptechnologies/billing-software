import React, { useEffect, useState } from "react";
import { Search, X, Plus, CheckCircle, XCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

const today = new Date().toISOString().slice(0, 10);

export default function LeaveRequests() {
  const isAdmin = getCurrentUser()?.role === "admin";
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    employee_id: "", type: "annual", from_date: today, to_date: today, reason: "",
  });

 const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`${API_BASE}/leave${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeaves(data || []);
    } catch { toast.error("Could not load leave requests"); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data || []);
    } catch { }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { fetchLeaves(); fetchEmployees(); }, [filterStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.to_date < formData.from_date) return toast.error("To date cannot be before From date");
    const loadingToast = toast.loading("Submitting leave request...");
    try {
      const res = await fetch(`${API_BASE}/leave`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success("Leave request submitted!", { id: loadingToast });
      setShowModal(false);
      setFormData({ employee_id: "", type: "annual", from_date: today, to_date: today, reason: "" });
      fetchLeaves();
    } catch { toast.error("Failed to submit leave request.", { id: loadingToast }); }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/leave/${id}/approve`, { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Leave approved!");
      fetchLeaves();
    } catch { toast.error("Failed to approve leave"); }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/leave/${id}/reject`, { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Leave rejected!");
      fetchLeaves();
    } catch { toast.error("Failed to reject leave"); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      const res = await fetch(`${API_BASE}/leave/${id}/cancel`, { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Leave cancelled!");
      fetchLeaves();
    } catch { toast.error("Failed to cancel leave"); }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled:  "bg-gray-100 text-gray-500",
  };

  const typeLabels = {
    annual: "Annual", sick: "Sick", maternity: "Maternity",
    paternity: "Paternity", unpaid: "Unpaid", other: "Other",
  };

  const summary = {
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  const filtered = leaves.filter((l) =>
    `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.employee_number || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Leave Requests</h2>
          <p className="text-gray-500 text-sm">Manage employee leave requests</p>
        </div>
        <button
          onClick={() => { setFormData({ employee_id: "", type: "annual", from_date: today, to_date: today, reason: "" }); setShowModal(true); }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 shadow-md">
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", count: summary.pending, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
          { label: "Approved", count: summary.approved, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Rejected", count: summary.rejected, color: "bg-red-50 text-red-700 border-red-100" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`bg-white rounded-xl border p-4 shadow-sm ${color}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div>
            <h3 className="font-semibold">All Leave Requests</h3>
            <p className="text-sm text-gray-400">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <select
              className="border rounded-lg px-3 py-2 text-sm text-gray-700"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees"
                className="pl-9 pr-4 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-10 text-center">Loading leave requests....</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Emp No.</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-10 text-gray-400">No leave requests found</td></tr>
                ) : (
                  filtered.map((leave) => (
                    <tr key={leave.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-gray-500">{leave.employee_number}</td>
                      <td className="font-medium">{leave.first_name} {leave.last_name}</td>
                      <td>{typeLabels[leave.type] || leave.type}</td>
                      <td>{leave.from_date?.slice(0, 10)}</td>
                      <td>{leave.to_date?.slice(0, 10)}</td>
                      <td>{leave.days} day{leave.days !== 1 ? "s" : ""}</td>
                      <td className="text-gray-500 max-w-xs truncate">{leave.reason || "—"}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[leave.status] || "bg-gray-100"}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2 flex-wrap">

                          {isAdmin && leave.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(leave.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100">
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button onClick={() => handleReject(leave.id)} className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-3 py-1 rounded-lg hover:bg-red-100">
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                          {leave.status === "pending" && (
                            <button onClick={() => handleCancel(leave.id)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded-lg">
                              Cancel
                            </button>
                          )}

                          {isAdmin && leave.status === "approved" && (
                            <button onClick={() => handleCancel(leave.id)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded-lg">
                              Cancel
                            </button>
                          )}

                          {leave.status === "rejected" && (
                            <span className="text-xs text-gray-400">—</span>
                          )}

                          {leave.status === "cancelled" && (
                            <span className="text-xs text-gray-400">—</span>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Leave Request</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <select name="employee_id" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.employee_id} required>
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_number})</option>)}
              </select>
              <select name="type" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.type}>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="other">Other</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">From Date</label>
                  <input name="from_date" type="date" className="border p-2 rounded w-full" onChange={handleChange} value={formData.from_date} required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To Date</label>
                  <input name="to_date" type="date" className="border p-2 rounded w-full" onChange={handleChange} value={formData.to_date} required />
                </div>
              </div>
              <textarea
                name="reason"
                placeholder="Reason (optional)"
                className="border p-2 rounded w-full h-24 resize-none"
                onChange={handleChange}
                value={formData.reason} />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}