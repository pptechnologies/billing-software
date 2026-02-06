import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ShieldCheck, Users, Zap } from "lucide-react";

export default function LandingPage() {

  const handleFooterLink = (e) => e.preventDefault();

  return (
    <div className="bg-[#030303] text-white min-h-screen font-sans selection:bg-blue-500/30">

      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tighter">BizFlow</h1>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#billing" className="hover:text-white transition-colors">Billing</a>
          <a href="#hrms" className="hover:text-white transition-colors">HRMS</a>
        </div>

        <Link to="/login">
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Get Started
          </button>
        </Link>
      </nav>

      <section className="relative px-8 pt-24 pb-12 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>

        <div className="max-w-4xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-blue-400 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: Automated Payroll integration
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Billing & HRMS <br /> for Modern Business.
          </h2>
          
          <p className="mt-8 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Streamline your revenue operations and manage your global workforce 
            with a single, integrated platform. Built for speed and clarity.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <button className="group bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-all">
                Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="px-8 py-4 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 transition-all">
              Watch Product Tour
            </button>
          </div>
        </div>

        <div className="mt-24 w-full max-w-6xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
              </div>
              <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">bizflow-v2.0.cloud</div>
              <div className="w-12"></div>
            </div>
            <div className="bg-gray-100 p-2">
                <img 
                    src="/dashboard-mockup.png" 
                    alt="BizFlow Dashboard" 
                    className="w-full h-auto rounded-lg shadow-inner" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-24 max-w-6xl mx-auto" id="features">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <BarChart3 className="text-blue-500 mb-4" size={32} />
            <h4 className="text-2xl font-bold mb-2">Automated Billing</h4>
            <p className="text-gray-400">Set up recurring invoices and let BizFlow handle the collections. Get real-time updates on every transaction.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <Users className="text-purple-500 mb-4" size={32} />
            <h4 className="text-2xl font-bold mb-2">Team Hub</h4>
            <p className="text-gray-400">Manage attendance, leave, and payroll in one simple view.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <ShieldCheck className="text-green-500 mb-4" size={32} />
            <h4 className="text-2xl font-bold mb-2">Secure & Private</h4>
            <p className="text-gray-400">Enterprise-grade encryption for all your financial data.</p>
          </div>
          <div className="md:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <Zap className="text-yellow-500 mb-4" size={32} />
            <h4 className="text-2xl font-bold mb-2">Lightning Fast Export</h4>
            <p className="text-gray-400">Generate professional PDFs, tax reports, and payroll summaries in seconds, not hours.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
             <div className="w-3 h-3 bg-black rotate-45"></div>
          </div>
          <span className="font-bold tracking-tighter">BizFlow</span>
        </div>
        <p className="text-gray-500 text-sm">© 2026 BizFlow Technologies. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-gray-400">

          <button onClick={handleFooterLink} className="hover:text-white transition-colors">Privacy</button>
          <button onClick={handleFooterLink} className="hover:text-white transition-colors">Terms</button>
        </div>
      </footer>
    </div>
  );
}