import React from "react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4"> Access Denied</h1>
      <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
      <button
        onClick={() => navigate(-1)} 
        className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition">
        Go Back
      </button>
    </div>
  );
}
