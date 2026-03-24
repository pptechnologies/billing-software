import React, {useState} from "react";

const month = ["January","February","March", "April","May","June","July","August", "September","October","November","December"];

const payslips = [
    {id:1, month: 3, year: 2026, basic_salary:45000, allowances: 5000, deduction:2000,net_salary:48000, status:"paid"},
    {id:2,month:2, year:2026, basic_salary:45000, allowances:5000,deduction:2000, net_salary:48000, status:"paid"},
    {id:3, month:1, year:2026, basic_salary:45000, allowances:5000, deductions: 3000, net_salary:47000, status:"Paid"},
    {id:4, month:12, year: 2025, basic_salary: 40000, allowances:4000, deductions: 2000, net_salary: 42000, status:'paid'},
    {id:5, month:11, year:2025, basic_salary:40000,allowances: 4000, deductions: 2000, net_salary: 42000, status:"paid"},
    {id:6, month:10, year:2025, basic_salary:40000, allowances:4000, deductions: 2500, net_salary: 41500, status:"paid"},
];

const statusColors = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
};

export default function MyPayslips(){
    const [filterYear, setFilterYear] = useState(2026);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    const filtered = payslips.filter((p) => p.year === filterYear);

    return (
        <div className="min-h-screen p-6">
            <div className="flex justify-between items-cnter mb-6">
                <div>
                    <h2 className="text-2xl font-semibold">My Payslips</h2>
                    <p className="text-gray-500 text-sm">Your salary records</p>
                </div>
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} />
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
                    No payslips found for {filterYear}
                    </div>
            ) :(
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((p) => (
                        <div key={p.id} onClick={() => setSelectedPayslip(p)} className="bg-white rounded-xl border-gray-100 shadow-sm p-6 cursor-pointer hover:-transition-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-bold text-gray-900">{month[p.month -1]} {p.year}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Click to view details</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[p.status]}`}>
                                    {p.status}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className = "flex justify-between">
                                    <span className="text-gray-500">Basic</span>
                                    <span>Rs{p.basic_salary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Allowances</span>
                                        <span className="text-green-600">+rs {p.deductions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Deductions</span>
                                        <span className="text-red-500">-Rs {p.deductions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 font-bold">
                                        <span className="font-bold text-gray-800">Net Salary</span>
                                        <span>Rs {p.net_salary.toLocaleString()}</span>
                                    </div>
                            </div>

                            </div>
                    ))}
            </div>
        )}

        {selectedPayslip && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">
                        {months[selectedPayslip.month - 1]} {selectedPayslip.year}
                        </h3>
                        <button onClick={() => setSelectedPayslip(null)} className="text-gray-400 hover:text-black text-xl"></button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-bold text-gray-900">Shriya Maharjan</p>
                    <p className="text-sm text-gray-500">shriya@pptechnologies.io</p>
                    <p className="text-sm text-gray-500">Software Developer - IT</p>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between birder-b pb-2">
                        <span className="text-gray-600">Basic Salary</span>
                        <span className="font-medium">Rs {selectedPayslip.basic_salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Allowances</span>
                        <span className="font-medium text-green-600">+Rs {selectedPayslip.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Deductions</span>
                        <span className="font-medium text-red-500">-Rs {selectedPayslip.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[selectedPayslip.status]}`}>
                            {selectedPayslip.status}
                        </span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="font-bold text-gray-800">Net Salary</span>
                        <span className="font-bold text-2xl">Rs {selectedPayslip.net_salary.toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={() => setSelectedPayslip(null)} className="px-4 py-2 bg-black text-white rounded-lg text-sm ">
                        Close
                    </button>
                </div>
            </div>
            </div>
        )}
            </div>
        );
    }