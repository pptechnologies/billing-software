import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
//it is just the login page without any api calls
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (isSignUpMode) {

      if (password !== confirmPassword) {
        setError("Passwords do not match!");
        return;
      }
      
      login({ username, role: "employee" });
      navigate("/EMP/MyProfile");
    } else {

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

      if (userRole === "admin" || userRole === "billing") navigate("/billing/BillingOverview");
      else if (userRole === "hr") navigate("/HRMS/HRMSDashboard");
      else if (userRole === "employee") navigate("/EMP/MyProfile");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isSignUpMode ? "Create an Account" : "Login"}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required/>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required />

          {isSignUpMode && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none"
              required/>
          )}

          <button
            type="submit"
            className="bg-black text-white py-3 rounded-lg font-semibold hover:bg-black transition">
            {isSignUpMode ? "Sign Up" : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isSignUpMode ? (
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => { setIsSignUpMode(false); setError(""); }}
                className="text-black font-bold hover:underline">
                Login
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => { setIsSignUpMode(true); setError(""); }}
                className="text-black font-bold hover:underline">
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;