import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const API_BASE = "http://localhost:4000";

export default function Invoices() {
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    client_id: "",
    tax_rate: 13,
    currency: "NPR",
    items: [{ description: "", qty: 1, unit_price: "" }],
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await fetch(`${API_BASE}/invoices?page=1&limit=20`);
      const json = await res.json();
      setInvoices(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch(`${API_BASE}/clients`);
      const json = await res.json();
      setClients(json);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.client_id || formData.items.length === 0 || !formData.items[0].description) {
      setError("Client and at least one item are required");
      return;
    }

    const payload = {
      client_id: formData.client_id,
      tax_rate: Number(formData.tax_rate),
      currency: formData.currency,
      items: formData.items.map(it => ({
        description: it.description,
        qty: Number(it.qty),
        unit_price: Number(it.unit_price),
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create invoice");
      }

      const data = await res.json();
      setInvoices(prev => [data.invoice, ...prev]);
      setShowModal(false);
      setFormData({
        client_id: "",
        tax_rate: 13,
        currency: "NPR",
        items: [{ description: "", qty: 1, unit_price: "" }],
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  function handleItemChange(index, field, value) {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  }

  function addItem() {
    setFormData({ ...formData, items: [...formData.items, { description: "", qty: 1, unit_price: "" }] });
  }

  function removeItem(index) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  }

  async function issueInvoice(id) {
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}/issue`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to issue invoice");
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  async function exportPDF(id) {
  try {
    const res = await fetch(`${API_BASE}/invoices/${id}/pdf`, { method: "GET" });

    if (!res.ok) {
      let errMsg = "Could not generate PDF";
      try {
        const errData = await res.json();
        errMsg = errData.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/pdf")) {
      const text = await res.text();
      console.error("Non-PDF response:", text);
      throw new Error("Server did not return a PDF.");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

  return (
    <div className="bg-[#f6f7fb] min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Invoice Management</h2>
          <p className="text-gray-500 text-sm">Create and manage invoices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          + Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold">All Invoices</h3>
            <p className="text-sm text-gray-400">{invoices.length} invoices total</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search invoices" className="pl-9 pr-4 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td>{inv.invoice_number}</td>
                    <td>{inv.client_name}</td>
                    <td>Rs {inv.total}</td>
                    <td>{inv.status}</td>
                    <td className="flex gap-2">
                      <button
                        onClick={() => issueInvoice(inv.id)}
                        disabled={inv.status !== "draft"}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        Issue
                      </button>
                      <button
                        onClick={() => exportPDF(inv.id)}
                        disabled={inv.status !== "issued"}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        Export PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-red-500 mb-2">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                className="border p-2 rounded w-full"
                value={formData.client_id}
                onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                <option value="">Select Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Tax Rate (%)"
                className="border p-2 rounded w-full"
                value={formData.tax_rate}
                onChange={e => setFormData({ ...formData, tax_rate: e.target.value })}/>

              {formData.items.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <input
                    placeholder="Description"
                    className="border p-2 rounded"
                    value={item.description}
                    onChange={e => handleItemChange(i, "description", e.target.value)}/>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="border p-2 rounded"
                    value={item.qty}
                    onChange={e => handleItemChange(i, "qty", e.target.value)}/>
                  <input
                    type="number"
                    placeholder="Unit Price"
                    className="border p-2 rounded"
                    value={item.unit_price}
                    onChange={e => handleItemChange(i, "unit_price", e.target.value)}/>
                  {i > 0 && (
                    <button type="button" className="text-red-500" onClick={() => removeItem(i)}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" onClick={addItem} className="text-blue-500">
                + Add Item
              </button>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
