import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function BillingDashboard({ user }) {
  const location = useLocation();

  const sidebarItems = [
    { name: "Overview", section: "Billing", path: "/billing/BillingOverview" },
    { name: "Customers", section: "Billing", path: "/billing/Customers" },
    { name: "Invoices", section: "Billing", path: "/billing/Invoices" },
    { name: "Payment", section: "Billing", path: "/billing/Payment" },
    { name: "Expenses", section: "Billing", path: "/billing/Expenses" },
    { name: "Settings", section: "Billing", path: "/billing/Settings" },

    { name: "Overview", section: "HRMS", path: "/HRMS/HRMSDashboard" },
    { name: "Employees", section: "HRMS", path: "/HRMS/Employees" },
    { name: "Attendance", section: "HRMS", path: "/HRMS/Attendance" },
    { name: "Payroll", section: "HRMS", path: "/HRMS/Payroll" },
    { name: "Leave Request", section: "HRMS", path: "/HRMS/LeaveRequest" },
  ];

  const isOverview = location.pathname === "/billing/BillingOverview";

  const revenueData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (Rs)",
        data: [5000, 7000, 6000, 8000, 9000, 10000],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.4,
      },
    ],
  };

  const employeeData = {
    labels: ["HR", "Sales", "IT", "Finance"],
    datasets: [
      {
        label: "Employees",
        data: [5, 10, 8, 4],
        backgroundColor: ["#f97316", "#3b82f6", "#10b981", "#ef4444"],
      },
    ],
  };

  const revenueStatusData = {
    labels: ["Paid", "Pending", "Overdue"],
    datasets: [
      {
        label: "Revenue Status",
        data: [5000, 3500, 0],
        backgroundColor: ["#22c55e", "#f97316", "#ef4444"],
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      <aside className="w-64 bg-black text-white p-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        {["Billing", "HRMS"].map((section) => (
          <div key={section} className="mb-6">
            <h3 className="text-gray-400 uppercase mb-3">{section}</h3>
            <ul>
              {sidebarItems
                .filter((i) => i.section === section)
                .map((i) => (
                  <li key={i.path} className="mb-2">
                    <NavLink
                      to={i.path}
                      className={({ isActive }) =>
                        `block p-2 rounded hover:bg-gray-800 ${
                          isActive ? "bg-gray-800 font-semibold" : ""
                        }`
                      }>
                      {i.name}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </aside>

      <main className="flex-1 p-6">

        {isOverview && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Billing</h1>
              <p className="text-gray-500">Monitor your billing procedure</p>
            </div>
            <span className="text-gray-700">{user?.name || "Billing"}</span>
          </div>
        )}

        {isOverview && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="p-4 bg-white rounded shadow">
                Total Revenue<br />Rs 5,000
              </div>
              <div className="p-4 bg-white rounded shadow">
                Pending Revenue<br />Rs 3,500
              </div>
              <div className="p-4 bg-white rounded shadow">
                Overdue<br />0
              </div>
              <div className="p-4 bg-white rounded shadow">
                Active Clients<br />2
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-white rounded shadow h-64">
                <Line data={revenueData} />
              </div>
              <div className="p-4 bg-white rounded shadow h-64">
                <Bar data={employeeData} />
              </div>
              <div className="p-4 bg-white rounded shadow h-64">
                <Pie data={revenueStatusData} />
              </div>
            </div>
          </>
        )}

        {!isOverview && <Outlet />}
      </main>
    </div>
  );
}
