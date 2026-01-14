import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSwitch = () => {
    if (!user) return;

    if (user.role === "admin") navigate("/");
    else if (user.role === "billing") navigate("/billing/BillingOverview");
    else if (user.role === "hr") navigate("/HRMS/HRMSDashboard");
  };

  return (
    <div className="w-full bg-white shadow-sm px-6 py-4 flex items-center justify-between">

      <Link to="/" className="text-xl font-semibold">
        BizFlow
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-500 capitalize">
            {user.role}
          </span>
        )}

        {user ? (
          <button
            onClick={logout}
            className="border px-4 py-2 rounded-lg hover:bg-gray-100">
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="border px-4 py-2 rounded-lg hover:bg-gray-100">
            Login
          </Link>
        )}

        {user && (
          <button
            onClick={handleSwitch}
            className="bg-black text-white px-5 py-2 rounded-lg">
            Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
