import React, { useEffect, useState, useCallback } from "react";
import { Search, X, Plus, CheckCircle, DollarSign } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export default function Payroll() {
  const isAdmin = getCurrentUser()?.role === "admin";
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [formData, setFormData] = useState({
    employee_id: "", month: currentMonth, year: currentYear,
    basic_salary: 0, allowances: 0, deductions: 0, note: "",
  });

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = `?month=${filterMonth}&year=${filterYear}`;
      const res = await fetch(`${API_BASE}/payroll${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPayrolls(data || []);
    } catch { toast.error("Could not load payroll"); }
    finally { setLoading(false); }
  }, [filterMonth, filterYear]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/payroll/summary?month=${filterMonth}&year=${filterYear}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data);
    } catch { }
  }, [filterMonth, filterYear]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data || []);
    } catch { }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
    fetchEmployees();
  }, [fetchPayrolls, fetchSummary]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSelect = (e) => {
    const emp = employees.find((em) => em.id === e.target.value);
    setFormData((prev) => ({
      ...prev,
      employee_id: e.target.value,
      basic_salary: emp?.basic_salary || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Creating payroll...");
    try {
      const res = await fetch(`${API_BASE}/payroll`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          month: Number(formData.month),
          year: Number(formData.year),
          basic_salary: Number(formData.basic_salary),
          allowances: Number(formData.allowances),
          deductions: Number(formData.deductions),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Payroll created!", { id: loadingToast });
      setShowModal(false);
      fetchPayrolls();
      fetchSummary();
    } catch { toast.error("Failed to create payroll.", { id: loadingToast }); }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/payroll/${id}/approve`, { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Payroll approved!");
      fetchPayrolls();
      fetchSummary();
    } catch { toast.error("Failed to approve payroll"); }
  };

  const handlePay = async (id) => {
    if (!window.confirm("Mark this payroll as paid?")) return;
    try {
      const res = await fetch(`${API_BASE}/payroll/${id}/pay`, { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Payroll marked as paid!");
      fetchPayrolls();
      fetchSummary();
    } catch { toast.error("Failed to mark as paid"); }
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
  };

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const filtered = payrolls.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.employee_number || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const netSalary = Number(formData.basic_salary) + Number(formData.allowances) - Number(formData.deductions);

  return (
    <div className="min-h-screen p-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Payroll</h2>
          <p className="text-gray-500 text-sm">Manage employee salaries</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setFormData({ employee_id: "", month: currentMonth, year: currentYear, basic_salary: 0, allowances: 0, deductions: 0, note: "" }); setShowModal(true); }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 shadow-md">
            <Plus size={16} /> Create Payroll
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Payroll</p>
            <p className="text-2xl font-bold mt-1">Rs {Number(summary.total_payroll).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">Paid</p>
            <p className="text-2xl font-bold mt-1 text-green-700">Rs {Number(summary.total_paid).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Approved</p>
            <p className="text-2xl font-bold mt-1 text-blue-700">{summary.approved}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Draft</p>
            <p className="text-2xl font-bold mt-1">{summary.draft}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div>
            <h3 className="font-semibold">Payroll Records</h3>
            <p className="text-sm text-gray-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <select className="border rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" className="border rounded-lg px-3 py-2 text-sm w-24" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} />
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search employees" className="pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-10 text-center">Loading payroll...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Emp No.</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Basic</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-10 text-gray-400">No payroll records found</td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-gray-500">{p.employee_number}</td>
                      <td className="font-medium">{p.first_name} {p.last_name}</td>
                      <td className="text-gray-500">{p.designation || "—"}</td>
                      <td>Rs {Number(p.basic_salary).toLocaleString()}</td>
                      <td className="text-green-600">+Rs {Number(p.allowances).toLocaleString()}</td>
                      <td className="text-red-500">-Rs {Number(p.deductions).toLocaleString()}</td>
                      <td className="font-bold">Rs {Number(p.net_salary).toLocaleString()}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[p.status] || "bg-gray-100"}`}>
                          {p.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 flex gap-2">
                          {p.status === "draft" && (
                            <button onClick={() => handleApprove(p.id)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100">
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          {p.status === "approved" && (
                            <button onClick={() => handlePay(p.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100">
                              <DollarSign size={12} /> Pay
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Payroll</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <select name="employee_id" className="border p-2 rounded w-full text-gray-700" onChange={handleEmployeeSelect} value={formData.employee_id} required>
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_number})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Month</label>
                  <select name="month" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.month}>
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Year</label>
                  <input name="year" type="number" className="border p-2 rounded w-full" onChange={handleChange} value={formData.year} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Basic Salary (Rs)</label>
                <input name="basic_salary" type="number" className="border p-2 rounded w-full" onChange={handleChange} value={formData.basic_salary} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Allowances (Rs)</label>
                  <input name="allowances" type="number" className="border p-2 rounded w-full" onChange={handleChange} value={formData.allowances} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Deductions (Rs)</label>
                  <input name="deductions" type="number" className="border p-2 rounded w-full" onChange={handleChange} value={formData.deductions} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">Net Salary</span>
                <span className="font-bold text-lg">Rs {netSalary.toLocaleString()}</span>
              </div>
              <input name="note" placeholder="Note (optional)" className="border p-2 rounded w-full" onChange={handleChange} value={formData.note} />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Create Payroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}