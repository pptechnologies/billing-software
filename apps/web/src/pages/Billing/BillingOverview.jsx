import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
import { Line, Pie } from "react-chartjs-2";
import { Plus, ArrowUpRight, Clock, FileText, Users } from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend
);

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function BillingDashboard({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isOverview = location.pathname === "/billing/BillingOverview";

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    activeClients: 0,
    paidCount: 0,
    pendingCount: 0,
    recentInvoices: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [invRes, clientRes] = await Promise.all([
          fetch(`${API_BASE}/invoices?limit=1000`),
          fetch(`${API_BASE}/clients`)
        ]);

        const invJson = await invRes.json();
        const clientJson = await clientRes.json();

        const invoices = invJson.data || [];
        const clients = clientJson || [];

        let total = 0;
        let pending = 0;
        let paidC = 0;
        let pendingC = 0;

        invoices.forEach(inv => {
          const invTotal = Number(inv.total) || 0;
          total += invTotal;
          if (inv.status?.toLowerCase() === 'paid') {
            paidC++;
          } else {
            pending += invTotal;
            pendingC++;
          }
        });

        setStats({
          totalRevenue: total,
          pendingRevenue: pending,
          activeClients: clients.length,
          paidCount: paidC,
          pendingCount: pendingC,
          recentInvoices: invoices.slice(0, 5) 
        });
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isOverview) loadDashboardData();
  }, [isOverview]);

  const sidebarItems = [
    { name: "Overview", section: "Billing", path: "/billing/BillingOverview" },
    { name: "Customers", section: "Billing", path: "/billing/Customers" },
    { name: "Invoices", section: "Billing", path: "/billing/Invoices" },
    { name: "Payment", section: "Billing", path: "/billing/Payment" },
    { name: "Reports", section: "Billing", path: "/billing/Reports" },
    { name: "Overview", section: "HRMS", path: "/HRMS/HRMSDashboard" },
    { name: "Employees", section: "HRMS", path: "/HRMS/Employees" },
    { name: "Attendance", section: "HRMS", path: "/HRMS/Attendance" },
    { name: "Payroll", section: "HRMS", path: "/HRMS/Payroll" },
    { name: "Leave Request", section: "HRMS", path: "/HRMS/LeaveRequest" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f9fafb]">

      <aside className="w-64 bg-black text-white p-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        {["Billing", "HRMS"].map((section) => (
          <div key={section} className="mb-8">
            <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-3">{section}</h3>
            <ul>
              {sidebarItems.filter((i) => i.section === section).map((i) => (
                <li key={i.path} className="mb-2">
                  <NavLink to={i.path} className={({ isActive }) => `block p-2 rounded hover:bg-gray-800 transition-colors ${isActive ? "bg-gray-800 font-semibold" : ""}`}>
                    {i.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main className="flex-1 p-8">
        {isOverview && (
          <div className="max-w-6xl mx-auto">

            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Billing Overview</h1>
                <p className="text-gray-500">Welcome back, {user?.name || "Admin"}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate('/billing/Invoices')} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm">
                  <Plus size={16} /> New Invoice
                </button>
                <button onClick={() => navigate('/billing/Customers')} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-all shadow-md">
                  <Users size={16} /> Add Client
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 animate-pulse font-medium">Syncing live data...</div>
            ) : (
              <>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <DashboardCard title="Total Revenue" value={`Rs ${stats.totalRevenue.toLocaleString()}`} growth="+12%" />
                  <DashboardCard title="Pending" value={`Rs ${stats.pendingRevenue.toLocaleString()}`} growth="Active" isWarning />
                  <DashboardCard title="Active Clients" value={stats.activeClients} growth="Stable" />
                  <DashboardCard title="Total Invoices" value={stats.paidCount + stats.pendingCount} growth="Real-time" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2"><ArrowUpRight size={14}/> Revenue Trend</h3>
                    <div className="h-64">
                      <Line data={{
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        datasets: [{
                          label: "Revenue",
                          data: [stats.totalRevenue*0.2, stats.totalRevenue*0.4, stats.totalRevenue*0.3, stats.totalRevenue*0.7, stats.totalRevenue*0.9, stats.totalRevenue],
                          borderColor: "#000",
                          backgroundColor: "rgba(0,0,0,0.02)",
                          fill: true,
                          tension: 0.4,
                        }]
                      }} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 w-full flex items-center gap-2"><Clock size={14}/> Collection Status</h3>
                    <div className="h-56 w-56">
                      <Pie data={{
                        labels: ["Paid", "Pending"],
                        datasets: [{
                          data: [stats.paidCount, stats.pendingCount],
                          backgroundColor: ["#10b981", "#f59e0b"],
                          hoverOffset: 4
                        }]
                      }} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Recent Invoices</h3>
                    <button onClick={() => navigate('/billing/Invoices')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-6 py-3">Invoice #</th>
                        <th className="px-6 py-3">Client</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.recentInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/billing/Invoices')}>
                          <td className="px-6 py-4 font-medium flex items-center gap-2"><FileText size={14} className="text-gray-400"/> {inv.invoice_number}</td>
                          <td className="px-6 py-4 text-gray-600">{inv.client_name}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">Rs {Number(inv.total).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
        {!isOverview && <Outlet />}
      </main>
    </div>
  );
}

function DashboardCard({ title, value, growth, isWarning }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isWarning ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
          {growth}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}