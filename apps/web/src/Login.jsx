import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    
    try {
      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin 
          ? { email: formData.email, password: formData.password } 
          : formData
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      login(data.user, data.accessToken);

      navigate("/billing/overview");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition-all">
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex w-full">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`w-1/2 py-2 text-sm font-bold rounded-md transition-all ${isLogin ? "bg-white shadow text-black" : "text-gray-500"}`}>
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`w-1/2 py-2 text-sm font-bold rounded-md transition-all ${!isLogin ? "bg-white shadow text-black" : "text-gray-500"}`}>
              Sign Up
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Enter your full name"
                className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                onChange={handleChange}/>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="Enter Your Email"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
              onChange={handleChange}/>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="Enter Your Password"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
              onChange={handleChange} />
            {!isLogin && (
               <p className="text-[10px] text-gray-400 mt-2">
                 * Min. 10 characters with Uppercase, Lowercase, and Numbers.
               </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transform active:scale-[0.98] transition-all disabled:bg-gray-400 mt-4 shadow-lg">
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                Processing...
              </span>
            ) : (
              isLogin ? "Login" : "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "New to BizFlow?" : "Already have an account?"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-black font-bold hover:underline">
              {isLogin ? "Create account" : "Log in here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}