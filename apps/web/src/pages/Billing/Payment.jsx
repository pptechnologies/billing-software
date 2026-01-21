import React, { useState, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:4000";

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

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invoices?page=1&limit=100`);
      const json = await res.json();
      const invList = json.data || [];

      // Only outstanding invoices (issued)
      const outstanding = invList.filter((inv) => inv.status === "issued");
      setInvoices(outstanding);

      await fetchPayments(outstanding);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setLoading(false);
    }
  }, []);

  // Fetch payments for invoices
  const fetchPayments = async (invList) => {
    try {
      const allPayments = [];
      for (let inv of invList) {
        const res = await fetch(`${API_BASE}/invoices/${inv.id}/payments`);
        if (!res.ok) continue;
        const json = await res.json();
        const data = json.payments || [];
        data.forEach((p) =>
          allPayments.push({
            ...p,
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            client_name: inv.client_name || inv.client || "N/A",
            amount_due: Number(inv.amount_due ?? 0),
            amount: Number(p.amount),
            paid_at: p.paid_at,
          })
        );
      }

      setPayments(allPayments);

      // Calculate totals
      const received = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = invList.reduce((sum, inv) => {
        const paid = allPayments
          .filter((p) => p.invoice_id === inv.id)
          .reduce((s, p) => s + p.amount, 0);
        return sum + Math.max(Number(inv.amount_due ?? 0) - paid, 0);
      }, 0);

      setTotals({
        received: Number(received.toFixed(2)),
        pending: Number(pending.toFixed(2)),
        count: allPayments.length,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Select an invoice from dropdown
  const handleInvoiceSelect = (id) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;

    const invPayments = payments.filter((p) => p.invoice_id === id);
    const paid = invPayments.reduce((sum, p) => sum + p.amount, 0);
    const due = Math.max(Number(inv.amount_due ?? 0) - paid, 0);

    setSelectedInvoice({ ...inv, paid: Number(paid.toFixed(2)) });
    setRemainingDue(Number(due.toFixed(2)));
    setFormData({ ...formData, invoice_id: id, amount: due });
  };

  // Submit payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoice_id) return alert("Please select an invoice");

    const amount = Number(formData.amount);
    if (amount <= 0) return alert("Enter a valid payment amount");
    if (amount > remainingDue + 0.01) return alert("Payment exceeds remaining amount");

    try {
      const res = await fetch(`${API_BASE}/invoices/${formData.invoice_id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: formData.method,
          amount,
          note: formData.note,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Payment failed");
      }

      setShowModal(false);
      setFormData({ invoice_id: "", method: "cash", amount: "", note: "" });
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert("Payment failed: " + err.message);
    }
  };

  // Prepare table data
  const tableData = invoices.map((inv) => {
    const invPayments = payments.filter((p) => p.invoice_id === inv.id);
    const paid = invPayments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(Number(inv.amount_due ?? 0) - paid, 0);
    const lastPayment = invPayments.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0];

    return {
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.client_name || inv.client || "N/A",
      amount_due: Number(inv.amount_due ?? 0),
      paid,
      remaining,
      status: paid >= (inv.amount_due ?? 0) ? "Paid" : paid > 0 ? "Partial" : "Unpaid",
      lastPayment,
    };
  });

  const filteredTableData = tableData.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.invoice_number.toLowerCase().includes(q) || item.client_name.toLowerCase().includes(q);
  });

  const downloadReceipt = (paymentId) => {
    window.open(`${API_BASE}/payments/${paymentId}/receipt/pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-8">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Payment Tracking</h1>
          <p className="text-sm text-gray-500">Monitor all payment transactions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-black text-white px-5 py-2.5 rounded-lg">
          + Record Payment
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Received" value={`Rs ${totals.received}`} />
        <StatCard title="Pending Payment" value={`Rs ${totals.pending}`} />
        <StatCard title="Transactions" value={totals.count} />
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>

        <div className="relative mb-6">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full bg-gray-200 rounded-lg pl-10 py-2"
            placeholder="Search by invoice or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <table className="w-full text-sm">
          <thead className="border-b text-gray-400">
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Total</th>
              <th>Total Paid</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Last Payment</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredTableData.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-gray-400">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredTableData.map((inv) => (
                <tr key={inv.invoice_id} className="border-b hover:bg-gray-50">
                  <td>{inv.invoice_number}</td>
                  <td>{inv.client_name}</td>
                  <td>Rs {inv.amount_due.toFixed(2)}</td>
                  <td>Rs {inv.paid.toFixed(2)}</td>
                  <td>Rs {inv.remaining.toFixed(2)}</td>
                  <td
                    className={`font-medium ${
                      inv.status === "Paid"
                        ? "text-green-600"
                        : inv.status === "Partial"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {inv.status}
                  </td>
                  <td>{inv.lastPayment ? new Date(inv.lastPayment.paid_at).toLocaleDateString() : "-"}</td>
                  <td>
                    {inv.lastPayment && (
                      <button onClick={() => downloadReceipt(inv.lastPayment.id)} className="bg-gray-200 px-2 py-1 rounded text-xs">
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Record Payment</h3>
              <XMarkIcon className="w-5 h-5 cursor-pointer" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <select
                required
                className="border p-2 rounded w-full"
                value={formData.invoice_id}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
              >
                <option value="">Select Invoice (Remaining Due)</option>
                {invoices
                  .map((inv) => {
                    const paid = payments
                      .filter((p) => p.invoice_id === inv.id)
                      .reduce((s, p) => s + p.amount, 0);
                    const due = Math.max(Number(inv.amount_due ?? 0) - paid, 0);
                    if (due < 0.01) return null;
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} — Rs {due.toFixed(2)}
                      </option>
                    );
                  })
                  .filter(Boolean)}
              </select>

              {selectedInvoice && (
                <div className="text-sm text-gray-600">
                  Paid: Rs {selectedInvoice.paid.toFixed(2)} | Remaining: Rs {remainingDue.toFixed(2)}
                </div>
              )}

              <input
                type="number"
                min="0"
                max={remainingDue}
                step="0.01"
                className="border p-2 rounded w-full"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              />

              <select
                className="border p-2 rounded w-full"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>

              <input
                className="border p-2 rounded w-full"
                placeholder="Note (optional)"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />

              <button className="bg-black text-white w-full py-2 rounded">Save Payment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
