import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // ✅ Don't show navbar on landing page or login page
  if (location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  const handleSwitch = () => {
    if (!user) return;
    const role = user.role?.toLowerCase();
    switch (role) {
      case "admin":
      case "user":
        navigate("/billing/overview");
        break;
      case "hr":
        navigate("/hrms/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="w-full bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold tracking-tight">
        BizFlow
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {user.role}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {user.email}
            </span>
          </div>
        )}

        {user ? (
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm font-semibold border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="text-sm font-semibold border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Login
          </Link>
        )}

        {user && (
          <button
            onClick={handleSwitch}
            className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-md">
            Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
