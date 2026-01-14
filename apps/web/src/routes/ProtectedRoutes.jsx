import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles = [], module = null }) {
  const { user, module: currentModule, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = typeof user.role === "string" ? user.role.toLowerCase() : "";
  const allowedRoles = roles.map((r) => r.toLowerCase());

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (module && currentModule?.toLowerCase() !== module.toLowerCase()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
