import React, { useEffect, useState, useCallback } from "react";
import { Users, Calendar, Clock, CheckCircle } from "lucide-react";
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
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export default function HRMSOverview() {
  const isAdmin = getCurrentUser()?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        fetch(`${API_BASE}/employees`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/attendance?from=${today}&to=${today}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/leave?status=pending`, { headers: getAuthHeaders() }),
      ]);

      const empData = await empRes.json();
      const attData = await attRes.json();
      const leaveData = await leaveRes.json();

      setEmployees(empData || []);
      setAttendance(attData || []);
      setLeaveRequests(leaveData || []);

      if (isAdmin) {
        const payRes = await fetch(
          `${API_BASE}/payroll/summary?month=${currentMonth}&year=${currentYear}`,
          { headers: getAuthHeaders() }
        );
        const payData = await payRes.json();
        setPayrollSummary(payData);
      }
    } catch {
      toast.error("Could not load HRMS data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const newThisMonth = employees.filter((e) => {
    const joinDate = new Date(e.join_date);
    return joinDate.getMonth() + 1 === currentMonth && joinDate.getFullYear() === currentYear;
  }).length;

  const presentToday = attendance.filter((a) => a.status === "present").length;
  const absentToday = attendance.filter((a) => a.status === "absent").length;
  const onLeaveToday = attendance.filter((a) => a.status === "leave").length;

  const recentEmployees = [...employees].slice(0, 5);
  const pendingLeaves = leaveRequests.slice(0, 5);

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400 animate-pulse font-medium">
        Loading HRMS data...
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HRMS Overview</h1>
          <p className="text-gray-500">Welcome back, {getCurrentUser()?.name || "User"}</p>
        </div>
        <p className="text-sm text-gray-400">{new Date().toDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value={employees.length}
          sub={`${activeEmployees} active`}
          icon={<Users size={18} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          sub={`${absentToday} absent`}
          icon={<CheckCircle size={18} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="On Leave Today"
          value={onLeaveToday}
          sub={`${leaveRequests.length} pending requests`}
          icon={<Calendar size={18} />}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          title="New This Month"
          value={newThisMonth}
          sub={`${months[currentMonth - 1]} ${currentYear}`}
          icon={<Clock size={18} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Today's Attendance</h3>
          {attendance.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No attendance marked yet today</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Present", count: presentToday, color: "bg-green-100 text-green-700" },
                { label: "Absent", count: absentToday, color: "bg-red-100 text-red-700" },
                { label: "Half Day", count: attendance.filter((a) => a.status === "half_day").length, color: "bg-yellow-100 text-yellow-700" },
                { label: "On Leave", count: onLeaveToday, color: "bg-purple-100 text-purple-700" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">
              Payroll — {months[currentMonth - 1]} {currentYear}
            </h3>
            {!payrollSummary ? (
              <p className="text-gray-400 text-sm text-center py-6">No payroll data</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Total Payroll</span>
                  <span className="font-bold text-gray-900">Rs {Number(payrollSummary.total_payroll).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">{payrollSummary.paid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{payrollSummary.approved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Draft</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{payrollSummary.draft}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm text-gray-600">Total Paid</span>
                  <span className="font-bold text-green-700">Rs {Number(payrollSummary.total_paid).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Pending Leave Requests</h3>
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No pending requests!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex justify-between items-center border-b pb-2 last:border-none">
                  <div>
                    <p className="text-sm font-medium">{leave.first_name} {leave.last_name}</p>
                    <p className="text-xs text-gray-400">{leave.type} · {leave.days} day{leave.days !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-400 uppercase">Recent Employees</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-6 py-3">Emp No.</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Designation</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Join Date</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">No employees yet</td>
              </tr>
            ) : (
              recentEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{emp.employee_number}</td>
                  <td className="px-6 py-4 font-medium">{emp.first_name} {emp.last_name}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.designation || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.department_name || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.join_date?.slice(0, 10) || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      emp.status === "active" ? "bg-green-100 text-green-700" :
                      emp.status === "inactive" ? "bg-gray-100 text-gray-600" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <span className={`p-2 rounded-lg ${color}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}