import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Search, X, Plus} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

export default function Employees() {
  const isAdmin = getCurrentUser()?.role === "admin";
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptName, setDeptName] = useState("");
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    department_id: "", designation: "", employment_type: "full_time",
    status: "active", join_date: "", basic_salary: 0,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch { toast.error("Could not load employees"); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees/departments`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDepartments(data || []);
    } catch { toast.error("Could not load departments"); }
  };

  useEffect(() => { fetchEmployees(); fetchDepartments(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredEmployees(
      employees.filter((emp) =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query) ||
        (emp.email || "").toLowerCase().includes(query) ||
        (emp.employee_number || "").toLowerCase().includes(query) ||
        (emp.designation || "").toLowerCase().includes(query)
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingEmployee ? "Updating..." : "Saving...");
    try {
      const method = editingEmployee ? "PATCH" : "POST";
      const url = editingEmployee
        ? `${API_BASE}/employees/${editingEmployee.id}`
        : `${API_BASE}/employees`;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formData, basic_salary: Number(formData.basic_salary) }),
      });
      if (!res.ok) throw new Error();
      await fetchEmployees();
      toast.success(editingEmployee ? "Employee updated!" : "Employee added!", { id: loadingToast });
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", department_id: "", designation: "", employment_type: "full_time", status: "active", join_date: "", basic_salary: 0 });
    } catch { toast.error("Failed to save employee.", { id: loadingToast }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setFilteredEmployees((prev) => prev.filter((e) => e.id !== id));
      toast.success("Employee deleted");
    } catch { toast.error("Could not delete employee"); }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      first_name: emp.first_name || "", last_name: emp.last_name || "",
      email: emp.email || "", phone: emp.phone || "",
      department_id: emp.department_id || "", designation: emp.designation || "",
      employment_type: emp.employment_type || "full_time", status: emp.status || "active",
      join_date: emp.join_date?.slice(0, 10) || "", basic_salary: emp.basic_salary || 0,
    });
    setShowModal(true);
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/employees/departments`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ name: deptName }),
      });
      if (!res.ok) throw new Error();
      toast.success("Department added!");
      setDeptName("");
      setShowDeptModal(false);
      fetchDepartments();
    } catch { toast.error("Failed to add department"); }
  };

  const statusColors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    terminated: "bg-red-100 text-red-700",
  };

  const employmentLabels = {
    full_time: "Full Time", part_time: "Part Time",
    contract: "Contract", intern: "Intern",
  };

  return (
    <div className="min-h-screen p-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Employee Management</h2>
          <p className="text-gray-500 text-sm">Manage your employees</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeptModal(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-sm">
              + Department
            </button>
            <button
              onClick={() => { setEditingEmployee(null); setFormData({ first_name: "", last_name: "", email: "", phone: "", department_id: "", designation: "", employment_type: "full_time", status: "active", join_date: "", basic_salary: 0 }); setShowModal(true); }}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 shadow-md">
              <Plus size={16} /> Add Employee
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold">All Employees</h3>
            <p className="text-sm text-gray-400">{employees.length} employee{employees.length !== 1 ? "s" : ""} total</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees"
              className="pl-9 pr-4 py-2 border rounded-lg text-sm"
              value={searchQuery}
              onChange={handleSearch} />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-10 text-center">Loading employees...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Emp No.</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Salary</th>
                  <th>Status</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-10 text-gray-400">No employees found</td></tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-gray-500">{emp.employee_number}</td>
                      <td className="font-medium">{emp.first_name} {emp.last_name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.designation || "—"}</td>
                      <td>{emp.department_name || "—"}</td>
                      <td>{employmentLabels[emp.employment_type] || emp.employment_type}</td>
                      <td>Rs {Number(emp.basic_salary).toLocaleString()}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[emp.status] || "bg-gray-100"}`}>
                          {emp.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="flex gap-3 py-3">
                          <button className="text-gray-500 hover:text-black" onClick={() => handleEdit(emp)}><Pencil size={16} /></button>
                          <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(emp.id)}><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingEmployee ? "Edit Employee" : "Add Employee"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input name="first_name" placeholder="First Name" className="border p-2 rounded w-full" onChange={handleChange} value={formData.first_name} required />
                <input name="last_name" placeholder="Last Name" className="border p-2 rounded w-full" onChange={handleChange} value={formData.last_name} required />
              </div>
              <input name="email" type="email" placeholder="Email" className="border p-2 rounded w-full" onChange={handleChange} value={formData.email} required />
              <input name="phone" placeholder="Phone" className="border p-2 rounded w-full" onChange={handleChange} value={formData.phone} />
              <input name="designation" placeholder="Designation" className="border p-2 rounded w-full" onChange={handleChange} value={formData.designation} />
              <select name="department_id" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.department_id}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select name="employment_type" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.employment_type}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
              <select name="status" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.status}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Join Date</label>
                  <input name="join_date" type="date" className="border p-2 rounded w-full" onChange={handleChange} value={formData.join_date} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Basic Salary (Rs)</label>
                  <input name="basic_salary" type="number" placeholder="0" className="border p-2 rounded w-full" onChange={handleChange} value={formData.basic_salary} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">{editingEmployee ? "Update Employee" : "Save Employee"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptModal && isAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <input
                placeholder="Department Name"
                className="border p-2 rounded w-full"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}