import React, { useState } from "react";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const attendanceData = [
  { id: 1, date: "2026-03-01", status: "present", check_in: "09:00 AM", check_out: "06:00 PM", source: "Manual", note: "" },
  { id: 2, date: "2026-03-02", status: "present", check_in: "09:10 AM", check_out: "06:00 PM", source: "Device", note: "" },
  { id: 3, date: "2026-03-03", status: "absent",  check_in: "—",        check_out: "—",        source: "Manual", note: "Sick" },
  { id: 4, date: "2026-03-04", status: "present", check_in: "09:05 AM", check_out: "06:00 PM", source: "Device", note: "" },
  { id: 5, date: "2026-03-05", status: "half_day",check_in: "09:00 AM", check_out: "01:00 PM", source: "Manual", note: "Early leave" },
  { id: 6, date: "2026-03-06", status: "present", check_in: "08:55 AM", check_out: "06:00 PM", source: "Device", note: "" },
  { id: 7, date: "2026-03-07", status: "present", check_in: "09:00 AM", check_out: "06:00 PM", source: "Device", note: "" },
  { id: 8, date: "2026-03-08", status: "leave",   check_in: "—",        check_out: "—",        source: "Manual", note: "Annual leave" },
  { id: 9, date: "2026-03-09", status: "present", check_in: "09:00 AM", check_out: "06:00 PM", source: "Device", note: "" },
  { id: 10, date: "2026-03-10", status: "present", check_in: "09:15 AM", check_out: "06:00 PM", source: "Manual", note: "" },
  { id: 11, date: "2026-03-11", status: "present", check_in: "09:00 AM", check_out: "06:00 PM", source: "Device", note: "" },
  { id: 12, date: "2026-03-12", status: "present", check_in: "09:00 AM", check_out: "—",        source: "Device", note: "Today" },
];

const statusColors = {
  present:  "bg-green-100 text-green-700",
  absent:   "bg-red-100 text-red-700",
  half_day: "bg-yellow-100 text-yellow-700",
  leave:    "bg-purple-100 text-purple-700",
  holiday:  "bg-blue-100 text-blue-700",
};

export default function MyAttendance() {
  const [filterMonth, setFilterMonth] = useState(3);
  const [filterYear, setFilterYear] = useState(2026);

  const summary = {
    present:  attendanceData.filter((a) => a.status === "present").length,
    absent:   attendanceData.filter((a) => a.status === "absent").length,
    half_day: attendanceData.filter((a) => a.status === "half_day").length,
    leave:    attendanceData.filter((a) => a.status === "leave").length,
  };

  return (
    <div className="min-h-screen p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">My Attendance</h2>
          <p className="text-gray-500 text-sm">Your attendance records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Present",  count: summary.present,  color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Absent",   count: summary.absent,   color: "bg-red-50 text-red-700 border-red-100" },
          { label: "Half Day", count: summary.half_day, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
          { label: "On Leave", count: summary.leave,    color: "bg-purple-50 text-purple-700 border-purple-100" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`bg-white rounded-xl border p-4 shadow-sm ${color}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold">Attendance Records</h3>
            <p className="text-sm text-gray-400">{attendanceData.length} records</p>
          </div>
          <div className="flex gap-3 items-center">
            <select className="border rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" className="border rounded-lg px-3 py-2 text-sm w-24" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3">Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Source</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-3">{record.date}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[record.status] || "bg-gray-100"}`}>
                      {record.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>{record.check_in}</td>
                  <td>{record.check_out}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${record.source === "Device" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                      {record.source === "Device" ? "🔴 Device" : "✏️ Manual"}
                    </span>
                  </td>
                  <td className="text-gray-500">{record.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}