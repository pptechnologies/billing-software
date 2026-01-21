import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSwitch = () => {
    if (!user) return;

    switch (user.role) {
      case "admin":
      case "billing":
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
    <>

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
              onClick={() => {
                logout();
                navigate("/");
              }}
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

      <Outlet />
    </>
  );
}
