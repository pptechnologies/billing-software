import React, { useState, useEffect } from "react";
import {FunnelIcon,MagnifyingGlassIcon,XMarkIcon,} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:4000";
 
export default function PaymentTracking() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await fetch(`${API_BASE}/invoices?page=1&limit=100`);
      const json = await res.json();
      const invList = json.data || [];

      setInvoices(invList);
      await fetchPayments(invList);
    } catch (err) {
      console.error("Error loading invoices:", err);
    }
  }

  async function fetchPayments(invList) {
    setLoading(true);
    try {
      const allPayments = [];

      for (let inv of invList) {
        const res = await fetch(`${API_BASE}/invoices/${inv.id}`);
        if (!res.ok) continue;

        const invDetail = await res.json();

        if (invDetail.payments && invDetail.payments.length > 0) {
          invDetail.payments.forEach(p => {
            allPayments.push({
              ...p,
              invoice_number: inv.invoice_number,
              client_name: inv.client_name,
            });
          });
        }
      }

      setPayments(allPayments);

      const received = allPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      const pending = invList.reduce((sum, inv) => {
        const paidForInv = allPayments
          .filter(p => p.invoice_id === inv.id)
          .reduce((s, p) => s + Number(p.amount), 0);
        const due = Number(inv.total) - paidForInv;
        return sum + (due > 0 ? due : 0);
      }, 0);

      setTotals({
        received,
        pending,
        count: allPayments.length,
      });
    } catch (err) {
      console.error("Error loading detailed payments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();

    if (!formData.invoice_id) {
      alert("Please select an invoice");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/invoices/${formData.invoice_id}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: formData.method,
            amount: Number(formData.amount),
            note: formData.note,
          }),
        }
      );

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }

      if (!res.ok) {
        throw new Error(result.message || "Payment failed");
      }

      setFormData({
        invoice_id: "",
        method: "cash",
        amount: "",
        note: "",
      });
      setShowModal(false);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert("Payment failed: " + err.message);
    }
  }

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.invoice_number.toLowerCase().includes(q) ||
      p.client_name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#EFEFEF] p-8">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Payment Tracking
          </h1>
          <p className="text-sm text-gray-500">
            Monitor and manage all payment transactions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-medium">
          + Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Received"
          value={`Rs ${totals.received.toFixed(2)}`}
          subtitle="Completed Payments"/>
        <StatCard
          title="Pending Payment"
          value={`Rs ${totals.pending.toFixed(2)}`}
          subtitle="Awaiting Confirmation"/>
        <StatCard
          title="Total Transactions"
          value={totals.count}
          subtitle="All Payment records"/>
      </div>

      <div className="bg-white rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-gray-200 rounded-lg pl-10 py-2 text-sm"
              placeholder="Search by client, invoice or transaction ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}/>
          </div>

          <button className="bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
            <FunnelIcon className="w-5 h-5" />
            All Status
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b text-gray-400">
            <tr>
              <th className="py-4 text-left">Transaction ID</th>
              <th className="py-4 text-left">Invoice</th>
              <th className="py-4 text-left">Client</th>
              <th className="py-4 text-left">Amount</th>
              <th className="py-4 text-left">Date</th>
              <th className="py-4 text-left">Method</th>
              <th className="py-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-400">
                  No Payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map(p => (
                <tr key={p.id} className="border-b last:border-none">
                  <td className="py-3">{p.id}</td>
                  <td className="py-3">{p.invoice_number}</td>
                  <td className="py-3">{p.client_name || "-"}</td>
                  <td className="py-3">Rs {Number(p.amount).toFixed(2)}</td>
                  <td className="py-3">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-3 capitalize">{p.method}</td>
                  <td className="py-3 text-green-600 font-medium">
                    Completed
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Record Payment</h3>
              <XMarkIcon
                onClick={() => setShowModal(false)}
                className="w-5 h-5 cursor-pointer"/>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <select
                required
                className="border p-2 rounded w-full"
                value={formData.invoice_id}
                onChange={e =>
                  setFormData({ ...formData, invoice_id: e.target.value })
                }>
                <option value="">Select Invoice</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} — Rs {inv.total}
                  </option>
                ))}
              </select>

              <select
                className="border p-2 rounded w-full"
                value={formData.method}
                onChange={e =>
                  setFormData({ ...formData, method: e.target.value })
                }>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>

              <input
                required
                type="number"
                placeholder="Amount"
                className="border p-2 rounded w-full"
                value={formData.amount}
                onChange={e =>
                  setFormData({ ...formData, amount: e.target.value })
                }/>

              <input
                placeholder="Note (optional)"
                className="border p-2 rounded w-full"
                value={formData.note}
                onChange={e =>
                  setFormData({ ...formData, note: e.target.value })
                }/>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border px-4 py-2 rounded">
                  Cancel
                </button>
                <button className="bg-black text-white px-4 py-2 rounded">
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
