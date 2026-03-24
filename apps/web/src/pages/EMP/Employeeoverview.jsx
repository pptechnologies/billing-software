import React from "react";
import { User, Calendar, DollarSign, Clock } from "lucide-react";

export default function EmployeeOverview() {
  const employee = {
    name: "John Doe",
    email: "john.doe@pptechnologies.io",
    position: "Software Developer",
    department: "IT",
  };

  const todayAttendance = {
    status: "present",
    check_in: "09:00 AM",
    check_out: "—",
    note: "On time",
  };

  const payslip = {
    month: "March",
    year: 2026,
    basic_salary: 45000,
    allowances: 5000,
    deductions: 2000,
    net_salary: 48000,
    status: "paid",
  };

  const leaveRequests = [
    { id: 1, type: "Annual", from_date: "2026-03-01", to_date: "2026-03-02", days: 2, reason: "Personal work", status: "approved" },
    { id: 2, type: "Sick", from_date: "2026-02-15", to_date: "2026-02-15", days: 1, reason: "Fever", status: "approved" },
    { id: 3, type: "Annual", from_date: "2026-04-10", to_date: "2026-04-12", days: 3, reason: "Family trip", status: "pending" },
  ];

  const statusColors = {
    present: "bg-green-100 text-green-700",
    absent: "bg-red-100 text-red-700",
    half_day: "bg-yellow-100 text-yellow-700",
  };

  const leaveStatusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Overview</h1>
          <p className="text-gray-500">Welcome back, {employee.name}!</p>
        </div>
        <p className="text-sm text-gray-400">Thursday, March 12, 2026</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Today's Status" value="Present" sub="Check in: 09:00 AM" icon={<Clock size={18} />} color="bg-green-50 text-green-600" />
        <StatCard title="Pending Leaves" value="1" sub="2 approved this year" icon={<Calendar size={18} />} color="bg-yellow-50 text-yellow-600" />
        <StatCard title="This Month Salary" value="Rs 48,000" sub="Status: Paid" icon={<DollarSign size={18} />} color="bg-blue-50 text-blue-600" />
        <StatCard title="My Profile" value="Active" sub={employee.email} icon={<User size={18} />} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Today's Attendance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Today's Attendance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[todayAttendance.status]}`}>
                {todayAttendance.status}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">Check In</span>
              <span className="font-medium">{todayAttendance.check_in}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">Check Out</span>
              <span className="font-medium">{todayAttendance.check_out}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Note</span>
              <span className="text-sm text-gray-500">{todayAttendance.note}</span>
            </div>
          </div>
        </div>

        {/* Latest Payslip */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">
            Latest Payslip — {payslip.month} {payslip.year}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">Basic Salary</span>
              <span className="font-medium">Rs {payslip.basic_salary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">Allowances</span>
              <span className="font-medium text-green-600">+Rs {payslip.allowances.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">Deductions</span>
              <span className="font-medium text-red-500">-Rs {payslip.deductions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-bold text-gray-800">Net Salary</span>
              <span className="font-bold text-lg">Rs {payslip.net_salary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                {payslip.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-400 uppercase">My Recent Leave Requests</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">From</th>
              <th className="px-6 py-3">To</th>
              <th className="px-6 py-3">Days</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leaveRequests.map((leave) => (
              <tr key={leave.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{leave.type}</td>
                <td className="px-6 py-4">{leave.from_date}</td>
                <td className="px-6 py-4">{leave.to_date}</td>
                <td className="px-6 py-4">{leave.days} day{leave.days !== 1 ? "s" : ""}</td>
                <td className="px-6 py-4 text-gray-500">{leave.reason}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${leaveStatusColors[leave.status]}`}>
                    {leave.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <span className={`p-2 rounded-lg ${color}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}