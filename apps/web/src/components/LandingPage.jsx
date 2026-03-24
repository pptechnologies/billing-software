import React from "react";
import {Link} from "react-router-dom";
import { 
  ArrowRight, 
  FileText, 
  Users, 
  Receipt, 
  LayoutDashboard, 
  Clock, 
  Banknote, 
  Calendar, 
  CheckCircle2,
  Zap 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900 min-h-screen font-sans selection:bg-black selection:text-white">

      <nav className="flex items-center justify-between px-8 md:px-12 py-5 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight italic">Biz<span className="text-gray-600">Flow</span></span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-500">
          <a href="#billing" className="hover:text-black transition-colors">Billing</a>
          <a href="#hrms" className="hover:text-black transition-colors">HRMS</a>
          <a href="#why-us" className="hover:text-black transition-colors">Why Choose Us</a>
        </div>
        <Link to ="/login">
        <button className="bg-black text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-gray-800 transition-all flex items-center gap-2">
          Get Started <ArrowRight size={16} />
        </button>
        </Link>
      </nav>

        <section className="px-8 md:px-24 pt-20 pb-16 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">  
        <div>
          <span className="inline-block px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold mb-6">
            All-in-one Business Management
          </span>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900">
            Billing & HRMS Software for Modern businesses
          </h2>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg">
            Streamline your billing operations and human resource management with our comprehensive platform. Manage invoices, employees, payroll, and attendance all in one place.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to = "/signup">
            <button className="bg-black text-white px-8 py-4 rounded-md font-bold flex items-center gap-2 hover:bg-gray-800 transition-all">
              Start Free Trial <ArrowRight size={18} />
            </button>
            </Link>
            <button className="px-8 py-4 rounded-md border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all">
              Watch Demo
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> No credit card required</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> 14 day free trial</span>
          </div>
        </div>

        <div className="relative">

          <div className="rounded-2xl shadow-2xl border border-gray-100 overflow-hidden bg-gray-50">
            <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000" 
            alt="Analytics" 
            className="rounded-2xl border border-gray-100 shadow-xl" />
          </div>

          <div className="absolute -bottom-6 -left-0 md:-left-6 bg-black text-white p-4 rounded-xl shadow-xl animate-bounce-slow">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-yellow-400"><Zap size={20} fill="currentColor"/></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Efficiency Boost</p>
                  <p className="text-xl font-bold">+156%</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Active Businesses", val: "500+" },
            { label: "Employees Managed", val: "10K+" },
            { label: "Invoices Processed", val: "$5M+" },
            { label: "Uptime Guarantee", val: "99.9%" }
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-2xl font-bold">{stat.val}</p>
              <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="billing" className="py-24 px-8 md:px-12 max-w-7xl mx-auto text-center">
        <span className="px-4 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">Billing Module</span>
        <h3 className="text-3xl md:text-4xl font-bold mt-6 mb-4">Complete Billing Solution</h3>
        <p className="text-gray-500 mb-16 max-w-2xl mx-auto">Manage your invoicing and customer relationship with powerful tools designed for efficiency.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <FeatureCard icon={<FileText />} title="Billing Overview" desc="Real-time revenue tracking, invoice status monitoring, and comprehensive analytics." />
          <FeatureCard icon={<Users />} title="Customer Management" desc="Manage client information, track customer history, and maintain relationships." />
          <FeatureCard icon={<Receipt />} title="Invoice Management" desc="Create, send, and track invoices with automated status updates and reminders." />
        </div>
      </section>

      <section id="hrms" className="py-24 px-8 md:px-12 bg-[#0a0a0a] text-white">
        <div className="max-w-7xl mx-auto text-center">
            <span className="px-4 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider">HRMS Module</span>
            <h3 className="text-3xl md:text-4xl font-bold mt-6 mb-16">Human Resource Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <FeatureCard dark icon={<LayoutDashboard />} title="HRMS Overview" desc="Comprehensive HR dashboard with employee and departmental insights." />
                <FeatureCard dark icon={<Users />} title="Employee Management" desc="Complete employee database with profile management and organizational structure." />
                <FeatureCard dark icon={<Clock />} title="Attendance Tracking" desc="Digital attendance system with check-in/check-out tracking and reporting." />
                <FeatureCard dark icon={<Banknote />} title="Payroll Processing" desc="Automated payroll calculation with allowances, deductions, and salary management." />
                <FeatureCard dark icon={<Calendar />} title="Leave Management" desc="Employee leave requests, approvals, and leave balance tracking system." />
            </div>
        </div>
      </section>

      <section id="why-us" className="py-24 px-8 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1">
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000" 
            alt="Analytics" 
            className="rounded-2xl border border-gray-100 shadow-xl"/>
        </div>
        <div className="order-1 lg:order-2">
          <h3 className="text-4xl font-bold mb-6">Why Choose Biz<span className="text-gray-400">Flow</span>?</h3>
          <p className="text-gray-500 mb-8 text-lg">Our platform combines powerful billing and HR features to help you run your business more efficiently.</p>
          <ul className="grid grid-cols-1 gap-4">
            {[
              "Streamlined billing and invoicing process",
              "Complete HR management in one platform",
              "Real-Time Analytics and reporting",
              "Automated Payroll and attendance tracking",
              "Secure role-based access control",
              "Responsive design for all devices"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 font-medium text-gray-700">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={22} /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 pt-20 pb-10 px-8 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <span className="text-2xl font-extrabold block mb-4 italic">BizFlow</span>
            <p className="text-gray-400 text-sm leading-relaxed">The all-in-one solution for modern billing and HRMS management. Built for scale.</p>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-sm uppercase tracking-widest">Product</h5>
            <ul className="text-sm text-gray-500 space-y-3">
                <li className="hover:text-black cursor-pointer transition-colors">Features</li>
                <li className="hover:text-black cursor-pointer transition-colors">Prices</li>
                <li className="hover:text-black cursor-pointer transition-colors">Integration</li>
                <li className="hover:text-black cursor-pointer transition-colors">API</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-sm uppercase tracking-widest">Company</h5>
            <ul className="text-sm text-gray-500 space-y-3">
                <li className="hover:text-black cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-black cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-black cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-black cursor-pointer transition-colors">Blog</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-sm uppercase tracking-widest">Legal</h5>
            <ul className="text-sm text-gray-500 space-y-3">
                <li className="hover:text-black cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-black cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-black cursor-pointer transition-colors">Security</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-gray-50 pt-10 text-xs text-gray-400 font-medium">
           <p>© 2026 BizFlow Technologies. All rights reserved.</p>
           <div className="flex gap-8 mt-6 md:mt-0">
              <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-black cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-black cursor-pointer transition-colors">Cookie Policy</span>
           </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, dark = false }) {
  return (
    <div className={`p-8 rounded-2xl border transition-all duration-300 ${
      dark 
      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:-translate-y-1' 
      : 'bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1'
    }`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${
        dark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
      }`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h4 className="text-xl font-bold mb-3">{title}</h4>
      <p className={`${dark ? 'text-gray-400' : 'text-gray-500'} text-sm leading-relaxed`}>
        {desc}
      </p>
    </div>
  );
}