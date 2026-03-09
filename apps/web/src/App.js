import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, NavLink } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoutes";

import Navbar from "./components/Navbar";
import BillingOverview from "./pages/Billing/BillingOverview";
import Customers from "./pages/Billing/Customers";
import Invoices from "./pages/Billing/Invoices";
import Payment from "./pages/Billing/Payment";
import Reports from "./pages/Billing/Reports";
import UserManagement from "./pages/Admin/UserManagement";
import Login from "./Login";
import Unauthorized from "./Unauthorized";
import LandingPage from "./components/LandingPage";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const DashboardLayout = () => {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const navLink = ({ isActive }) =>
    `block p-2 rounded transition-all ${
      isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-900"
    }`;

  return (
    <div className="flex min-h-screen bg-[#f9fafb]">
      <aside className="w-64 bg-black text-white p-6 sticky top-0 h-screen overflow-y-auto shrink-0">
        <h2 className="text-2xl font-bold mb-8">BizFlow</h2>

        <div className="mb-8">
          <h3 className="text-gray-400 uppercase text-[10px] font-bold tracking-widest mb-4">Billing</h3>
          <ul className="space-y-1">
            <li><NavLink to="/billing/Overview" className={navLink}>Overview</NavLink></li>
            <li><NavLink to="/billing/Customers" className={navLink}>Customers</NavLink></li>
            <li><NavLink to="/billing/Invoices" className={navLink}>Invoices</NavLink></li>
            <li><NavLink to="/billing/Payment" className={navLink}>Payment</NavLink></li>

            {isAdmin && <li><NavLink to="/billing/Reports" className={navLink}>Reports</NavLink></li>}
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="text-gray-400 uppercase text-[10px] font-bold tracking-widest mb-4">HRMS</h3>
          <ul className="space-y-1">
            <li><NavLink to="/hrms/Overview" className={navLink}>Overview</NavLink></li>
            <li><NavLink to="/hrms/Employees" className={navLink}>Employees</NavLink></li>
            <li><NavLink to="/hrms/Attendance" className={navLink}>Attendance</NavLink></li>
            <li><NavLink to="/hrms/Payroll" className={navLink}>Payroll</NavLink></li>
            <li><NavLink to="/hrms/LeaveRequest" className={navLink}>Leave Request</NavLink></li>
          </ul>
        </div>

        {isAdmin && (
          <div className="mb-8">
            <h3 className="text-gray-400 uppercase text-[10px] font-bold tracking-widest mb-4">Admin</h3>
            <ul className="space-y-1">
              <li><NavLink to="/admin/users" className={navLink}>User Management</NavLink></li>
            </ul>
          </div>
        )}
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute roles={["admin", "user"]} />}>
            <Route element={<DashboardLayout />}>

              <Route path="/billing">
                <Route index element={<Navigate to="Overview" replace />} />
                <Route path="Overview" element={<BillingOverview />} />
                <Route path="Customers" element={<Customers />} />
                <Route path="Invoices" element={<Invoices />} />
                <Route path="Payment" element={<Payment />} />

                <Route element={<ProtectedRoute roles={["admin"]} />}>
                  <Route path="Reports" element={<Reports />} />
                </Route>
              </Route>

              <Route path="/hrms">
                <Route index element={<Navigate to="Overview" replace />} />
                <Route path="Overview" element={<div>HRMS Overview Page</div>} />
                <Route path="Employees" element={<div>Employees Page</div>} />
                <Route path="Attendance" element={<div>Attendance Page</div>} />
                <Route path="Payroll" element={<div>Payroll Page</div>} />
                <Route path="LeaveRequest" element={<div>Leave Request Page</div>} />
              </Route>

              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/billing/Overview" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
