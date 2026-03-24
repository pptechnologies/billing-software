import React, { useState } from "react";
import { Plus, X } from "lucide-react";

const today = new Date().toISOString().slice(0, 10);

const initialLeaves = [
  { id: 1, type: "Annual", from_date: "2026-03-01", to_date: "2026-03-02", days: 2, reason: "Personal work",  status: "approved" },
  { id: 2, type: "Sick", from_date: "2026-02-15", to_date: "2026-02-15", days: 1, reason: "Fever",          status: "approved" },
  { id: 3, type: "Annual", from_date: "2026-04-10", to_date: "2026-04-12", days: 3, reason: "Family trip",    status: "pending"  },
  { id: 4, type: "Unpaid", from_date: "2026-01-20", to_date: "2026-01-20", days: 1, reason: "Emergency",      status: "rejected" },
  { id: 5, type: "Maternity", from_date: "2025-12-01", to_date: "2025-12-30", days: 30, reason: "Maternity",    status: "approved" },
];

const statusColors = {
  pending:   "bg-yellow-100 text-yellow-700",
  approved:  "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function MyLeave() {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: "annual", from_date: today, to_date: today, reason: "" });

  const filtered = filterStatus ? leaves.filter((l) => l.status === filterStatus) : leaves;

  const summary = {
    pending:  leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLeave = {
      id: leaves.length + 1,
      type: formData.type.charAt(0).toUpperCase() + formData.type.slice(1),
      from_date: formData.from_date,
      to_date: formData.to_date,
      days: Math.max(1, Math.ceil((new Date(formData.to_date) - new Date(formData.from_date)) / (1000*60*60*24)) + 1),
      reason: formData.reason,
      status: "pending",
    };
    setLeaves((prev) => [newLeave, ...prev]);
    setShowModal(false);
    setFormData({ type: "annual", from_date: today, to_date: today, reason: "" });
  };

  const handleCancel = (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: "cancelled" } : l));
  };

  return (
    <div className="min-h-screen p-6">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">My Leave Requests</h2>
          <p className="text-gray-500 text-sm">Manage your leave requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 shadow-md">
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending",  count: summary.pending,  color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold">My Leave History</h3>
            <p className="text-sm text-gray-400">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
          </div>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3">Type</th>
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
                <tr><td colSpan="7" className="text-center py-10 text-gray-400">No leave requests found</td></tr>
              ) : (
                filtered.map((leave) => (
                  <tr key={leave.id} className="border-b last:border-none hover:bg-gray-50">
                    <td className="py-3 font-medium">{leave.type}</td>
                    <td>{leave.from_date}</td>
                    <td>{leave.to_date}</td>
                    <td>{leave.days} day{leave.days !== 1 ? "s" : ""}</td>
                    <td className="text-gray-500 max-w-xs truncate">{leave.reason || "—"}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[leave.status]}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {leave.status === "pending" ? (
                        <button onClick={() => handleCancel(leave.id)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded-lg">
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Leave Request</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
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