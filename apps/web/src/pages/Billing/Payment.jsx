import React, { useState, useEffect, useCallback } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// 1. Import toast and Toaster
import toast, { Toaster } from "react-hot-toast";

const API_BASE = "http://localhost:4000";
const MIN_PAYMENT = 0.01;

export default function PaymentTracking() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [remainingDue, setRemainingDue] = useState(0);

  const [formData, setFormData] = useState({
    invoice_id: "",
    method: "cash",
    amount: "",
    note: "",
  });

  const [totals, setTotals] = useState({
    received: 0,
    pending: 0,
    count: 0,
  });

  const cleanAmount = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  const fetchPayments = useCallback(async (invList) => {
    try {
      const allPayments = [];
      for (const inv of invList) {
        const res = await fetch(`${API_BASE}/invoices/${inv.id}/payments`);
        if (!res.ok) continue;
        const json = await res.json();
        const data = json.payments || [];

        data.forEach((p) => {
          allPayments.push({
            ...p,
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            client_name: inv.client_name, 
            amount: cleanAmount(p.amount),
          });
        });
      }

      setPayments(allPayments);

      const received = allPayments.reduce((s, p) => s + p.amount, 0);
      const pending = invList.reduce((sum, inv) => {
        const invPayments = allPayments.filter((p) => String(p.invoice_id) === String(inv.id));
        const paid = invPayments.reduce((s, p) => s + p.amount, 0);
        const remaining = Math.max(cleanAmount(inv.total) - cleanAmount(paid), 0);
        return sum + remaining;
      }, 0);

      setTotals({
        received: cleanAmount(received),
        pending: cleanAmount(pending),
        count: allPayments.length,
      });
    } catch (err) {
      toast.error("Error calculating payment totals");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invoices?page=1&limit=100`);
      const json = await res.json();
      const invList = json.data || [];
      setInvoices(invList);
      await fetchPayments(invList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load records from server");
      setLoading(false);
    }
  }, [fetchPayments]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleInvoiceSelect = (id) => {
    if (!id) {
      setSelectedInvoice(null);
      setRemainingDue(0);
      setFormData((prev) => ({ ...prev, invoice_id: "", amount: "" }));
      return;
    }

    const inv = invoices.find((i) => String(i.id) === String(id));
    if (!inv) return;

    const invPayments = payments.filter((p) => String(p.invoice_id) === String(id));
    const paid = cleanAmount(invPayments.reduce((s, p) => s + p.amount, 0));
    const total = cleanAmount(Number(inv.total ?? 0));
    const remaining = cleanAmount(Math.max(total - paid, 0));

    setSelectedInvoice({ ...inv, paid });
    setRemainingDue(remaining);
    
    setFormData((prev) => ({ ...prev, invoice_id: String(id), amount: remaining.toFixed(2) }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = cleanAmount(formData.amount);

    if (!formData.invoice_id) return toast.error("Select an invoice");
    
    if (amount < MIN_PAYMENT) {
      return toast.error(`Minimum payment is Rs ${MIN_PAYMENT.toFixed(2)}`);
    }

    if (amount > (remainingDue + 0.001)) {
      return toast.error(`Amount exceeds remaining balance`);
    }

    const tid = toast.loading("Recording payment...");
    try {
      const res = await fetch(`${API_BASE}/invoices/${formData.invoice_id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: formData.method,
          amount: amount, 
          note: formData.note,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Payment recorded successfully!", { id: tid });
      setShowModal(false);
      setFormData({ invoice_id: "", method: "cash", amount: "", note: "" });
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      toast.error("Payment failed: " + err.message, { id: tid });
    }
  };

  const tableData = invoices.map((inv) => {
    const invPayments = payments.filter((p) => String(p.invoice_id) === String(inv.id));
    const total = cleanAmount(Number(inv.total ?? 0));
    const paid = cleanAmount(invPayments.reduce((s, p) => s + p.amount, 0));
    const remaining = cleanAmount(Math.max(total - paid, 0));
    const isPaid = paid >= (total - 0.001);

    return {
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.client_name || "N/A",
      total,
      paid,
      remaining,
      status: isPaid ? "Paid" : paid > 0 ? "Partial" : "Unpaid",
      lastPayment: [...invPayments].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0],
    };
  });

  const filteredData = tableData.filter(i => 
    i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-8 font-sans">
      {/* 2. Added Toaster component */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-semibold">Payment Tracking</h1>
        <button onClick={() => setShowModal(true)} className="bg-black text-white px-5 py-2.5 rounded-lg">
          + Record Payment
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Received" value={`Rs ${totals.received.toFixed(2)}`} />
        <StatCard title="Pending Payment" value={`Rs ${totals.pending.toFixed(2)}`} />
        <StatCard title="Transactions" value={totals.count} />
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">All Records</h2>
          <span className="text-[11px] font-medium text-gray-400">Showing {filteredData.length} entries</span>
        </div> 

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            className="w-full bg-gray-200 rounded-lg py-2 pl-10 pr-3 outline-none focus:ring-2 focus:ring-black"
            placeholder="Search invoice or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10 text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Remaining</th>
                  <th className="pb-3">Paid</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((inv) => (
                  <tr key={inv.invoice_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium">{inv.invoice_number}</td>
                    <td className="py-4">{inv.client_name}</td>
                    <td className="py-4 font-bold text-red-600">Rs {inv.remaining.toFixed(2)}</td>
                    <td className="py-4 text-green-600">Rs {inv.paid.toFixed(2)}</td>
                    <td className="py-4">Rs {inv.total.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`font-semibold ${
                        inv.status === "Paid" ? "text-green-600" : 
                        inv.status === "Partial" ? "text-yellow-600" : "text-red-500"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {inv.lastPayment && (
                        <button 
                          onClick={() => {
                            toast.success("Opening Receipt...");
                            window.open(`${API_BASE}/payments/${inv.lastPayment.id}/receipt/pdf`, "_blank");
                          }}
                          className="text-blue-600 hover:underline">
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between mb-6">
                <h3 className="font-bold text-lg">Record Payment</h3>
                <XMarkIcon className="w-6 h-6 cursor-pointer text-gray-400" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Invoice</label>
                  <select
                    required
                    className="border border-gray-200 p-2.5 rounded-lg w-full bg-gray-50"
                    value={formData.invoice_id}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}>
                    <option value="">Select Invoice (Remaining Due)</option>
                    {invoices.map((inv) => {
                      const invPayments = payments.filter((p) => String(p.invoice_id) === String(inv.id));
                      const paid = cleanAmount(invPayments.reduce((s, p) => s + p.amount, 0));
                      const rem = cleanAmount(Math.max(Number(inv.total) - paid, 0));
                      if (rem < MIN_PAYMENT) return null;
                      return (
                        <option key={inv.id} value={String(inv.id)}>
                          {inv.invoice_number} — Rs {rem.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedInvoice && (
                  <div className="flex justify-between text-xs p-3 bg-blue-50 text-blue-800 rounded-lg">
                    <span>Paid: Rs {selectedInvoice.paid.toFixed(2)}</span>
                    <span className="font-bold">Due: Rs {remainingDue.toFixed(2)}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min={MIN_PAYMENT}
                    required
                    className="border border-gray-200 p-2.5 rounded-lg w-full outline-none focus:ring-2 focus:ring-black"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Method</label>
                  <select
                    className="border border-gray-200 p-2.5 rounded-lg w-full bg-gray-50"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Note (Optional)</label>
                  <input
                    type="text"
                    className="border border-gray-200 p-2.5 rounded-lg w-full outline-none focus:ring-2 focus:ring-black"
                    placeholder="Transaction reference or remarks"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}/>
                </div>

                <button type="submit" className="bg-black text-white w-full py-3 rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all">
                  Save Payment
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}