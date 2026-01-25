import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let userRole = "";

    if (username === "admin" && password === "admin123") userRole = "admin";
    else if (username === "hr" && password === "hr123") userRole = "hr";
    else if (username === "billing" && password === "billing123") userRole = "billing";
    else if (username === "employee" && password === "employee1") userRole = "employee";
    else {
      setError("Invalid username or password");
      return;
    }

    login({ username, role: userRole });

    if (userRole === "admin") navigate("/billing/BillingOverview"); 
    else if (userRole === "hr") navigate("/HRMS/HRMSDashboard");
    else if (userRole === "billing") navigate("/billing/BillingOverview");
    else if (userRole === "employee") navigate("/EMP/MyProfile");
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-50 px-4">
      <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border px-4 py-2 rounded mb-4 w-full"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border px-4 py-2 rounded mb-6 w-full"
          required
        />
        <button type="submit" className="bg-black text-white w-full py-2 rounded hover:bg-gray-800 transition">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;