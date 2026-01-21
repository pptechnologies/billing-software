import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="bg-black text-white min-h-screen">

      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">BizFlow</h1>

        <div className="hidden md:flex gap-6 text-sm text-gray-300">
          <a href="#billing" className="hover:text-white">Billing</a>
          <a href="#hrms" className="hover:text-white">HRMS</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </div>

        <Link to="/login">
          <button className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium">
            Get Started
          </button>
        </Link>
      </nav>

      <section className="px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Billing & HRMS Software for <br />
            <span className="text-gray-400">Modern Business</span>
          </h2>
          <p className="mt-6 text-gray-400 max-w-lg">
            Streamline your billing operations and manage your workforce
            efficiently with our all-in-one platform.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/login">
              <button className="bg-white text-black px-6 py-3 rounded-md font-medium">
                Start Free Trial
              </button>
            </Link>
            <button className="border border-gray-600 px-6 py-3 rounded-md text-gray-300">
              Watch Demo
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="h-64 flex items-center justify-center text-gray-500">
            Dashboard Preview
          </div>
        </div>
      </section>

      <section className="px-8 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">
          Ready to Transform Your Business?
        </h3>
        <p className="text-gray-400 mb-8">
          Start your free trial today and experience the difference.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/login">
            <button className="bg-white text-black px-8 py-3 rounded-md font-medium">
              Get Started
            </button>
          </Link>
          <button className="border border-gray-600 px-8 py-3 rounded-md text-gray-300">
            Contact Sales
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-8 py-6 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} BizFlow. All rights reserved.
      </footer>
    </div>
  );
}
