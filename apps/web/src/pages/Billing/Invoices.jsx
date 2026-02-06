import React, { useEffect, useState } from "react";
import { X, Pencil, Trash2, Search } from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function Invoices() {
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); 
  const [formData, setFormData] = useState({
    client_id: "",
    tax_rate: 13,
    currency: "NPR",
    notes: "",
    due_date: "",
    items: [{ description: "", qty: 1, unit_price: "" }],
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClients();
    fetchInvoices();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch(`${API_BASE}/clients`);
      const json = await res.json();
      setClients(json || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch clients"); 
    }
  }

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invoices?page=1&limit=50`);
      const json = await res.json();
      const invoicesData = json.data || [];

      const invoicesWithPayments = await Promise.all(
        invoicesData.map(async (inv) => {
          try {
            const payRes = await fetch(`${API_BASE}/invoices/${inv.id}/payments`);
            const payJson = await payRes.json();
            return { ...inv, payments: payJson.data || [] };
          } catch {
            return { ...inv, payments: [] };
          }
        })
      );

      setInvoices(invoicesWithPayments);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices"); 
    } finally {
      setLoading(false);
    }
  }

  function getInvoiceStatus(invoice) {
    const backendStatus = invoice.status?.toLowerCase();
    if (backendStatus === "paid") return "Paid";

    if (backendStatus === "issued") {
      const totalPaid =
        invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      if (totalPaid >= Number(invoice.total)) return "Paid";
      if (totalPaid > 0) return "Partial";
      return "Unpaid";
    }
    return "Draft";
  }

  async function issueInvoice(id) {
    const tid = toast.loading("Issuing invoice..."); 
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}/issue`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to issue invoice");
      await fetchInvoices();
      toast.success("Invoice Issued", { id: tid });
    } catch (err) {
      console.error(err);
      toast.error(err.message, { id: tid }); 
    }
  }

  async function exportPDF(id) {
    const tid = toast.loading("Preparing PDF..."); 
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}/pdf`);
      if (!res.ok) throw new Error("Could not generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started", { id: tid }); 
    } catch (err) {
      console.error(err);
      toast.error(err.message, { id: tid }); 
    }
  }

  function handleEditInvoice(inv) {
    setEditingInvoice(inv);
    setFormData({
      client_id: inv.client_id,
      tax_rate: inv.tax_rate,
      currency: inv.currency,
      notes: inv.notes || "",
      due_date: inv.due_date || "",
      items: inv.items || [{ description: "", qty: 1, unit_price: "" }],
    });
    setShowModal(true);
  }

  async function handleDeleteInvoice(id) {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted"); 
    } catch (err) {
      console.error(err);
      toast.error(err.message); 
    }
  }

  function handleItemChange(index, field, value) {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  }

  function addItem() {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", qty: 1, unit_price: "" }],
    });
  }

  function removeItem(index) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.client_id || formData.items.length === 0 || !formData.items[0].description) {
      toast.error("Client and at least one item are required");
      return;
    }

    const tid = toast.loading("Saving invoice..."); 

    try {
      if (editingInvoice) {
        const patchRes = await fetch(`${API_BASE}/invoices/${editingInvoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: formData.notes, due_date: formData.due_date }),
        });
        if (!patchRes.ok) throw new Error("Failed to update invoice");

        const putRes = await fetch(`${API_BASE}/invoices/${editingInvoice.id}/items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: formData.items }),
        });
        if (!putRes.ok) throw new Error("Failed to update invoice items");
        await fetchInvoices();
        toast.success("Invoice updated", { id: tid }); 
      } else {
        const payload = {
          client_id: formData.client_id,
          tax_rate: Number(formData.tax_rate),
          currency: formData.currency,
          items: formData.items.map((it) => ({
            description: it.description,
            qty: Number(it.qty),
            unit_price: Number(it.unit_price),
          })),
        };

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
        setInvoices((prev) => [{ ...data.invoice, payments: [] }, ...prev]);
        toast.success("Invoice created", { id: tid });
      }

      setShowModal(false);
      setEditingInvoice(null);
      setFormData({
        client_id: "",
        tax_rate: 13,
        currency: "NPR",
        notes: "",
        due_date: "",
        items: [{ description: "", qty: 1, unit_price: "" }],
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message, { id: tid }); 
    }
  }

  const activeInvoices = invoices.filter(inv => getInvoiceStatus(inv) !== "Paid");
  const archivedInvoices = invoices.filter(inv => getInvoiceStatus(inv) === "Paid");

  const filteredInvoices = (activeTab === "active" ? activeInvoices : archivedInvoices).filter(
    (inv) => {
      const q = searchQuery.toLowerCase();
      return inv.invoice_number.toLowerCase().includes(q) || (inv.client_name?.toLowerCase() || "").includes(q);
    }
  );

  return (
    <div className="bg-[#f6f7fb] min-h-screen p-6">

      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Invoice Management</h2>
          <p className="text-gray-500 text-sm">Create and manage invoices</p>
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setFormData({
              client_id: "",
              tax_rate: 13,
              currency: "NPR",
              notes: "",
              due_date: "",
              items: [{ description: "", qty: 1, unit_price: "" }],
            });
            setShowModal(true);
          }}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          + Create Invoice
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === "active" ? "bg-black text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("active")}>
          Active Invoices ({activeInvoices.length})
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "archive" ? "bg-black text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("archive")}>
          Archived Invoices ({archivedInvoices.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 font-medium">
            Total Invoices: {filteredInvoices.length}
          </p>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search Invoices"
              className="pl-9 pr-4 py-2 border rounded-lg text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-10 text-center">Loading invoices...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Status</th>
                  {activeTab === "archive" && <th>Paid On</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const status = getInvoiceStatus(inv);
                    const isArchived = status === "Paid";
                    const lastPaymentDate =
                      inv.payments?.length > 0
                        ? new Date(inv.payments[inv.payments.length - 1].paid_at).toLocaleDateString()
                        : "-";

                    return (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td>{inv.invoice_number}</td>
                        <td>{inv.client_name}</td>
                        <td>Rs {inv.total}</td>
                        <td>{status}</td>
                        {activeTab === "archive" && <td>{lastPaymentDate}</td>}
                        <td className="flex gap-2">
                          <button
                            onClick={() => issueInvoice(inv.id)}
                            disabled={isArchived || status !== "Draft"}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm disabled:opacity-50">
                            Issue
                          </button>
                          <button
                            onClick={() => exportPDF(inv.id)}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                            Export PDF
                          </button>
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            disabled={isArchived}
                            className="text-gray-500 hover:text-black disabled:opacity-30">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            disabled={isArchived}
                            className="text-red-500 hover:text-red-700 disabled:opacity-30">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingInvoice ? "Edit Invoice" : "Create Invoice"}</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-red-500 mb-2">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                className="border p-2 rounded w-full"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}>
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Tax Rate (%)"
                className="border p-2 rounded w-full"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}/>
              <input
                type="text"
                placeholder="Notes"
                className="border p-2 rounded w-full"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}/>
              <input
                type="date"
                placeholder="Due Date"
                className="border p-2 rounded w-full"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}/>

              {formData.items.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <input
                    placeholder="Description"
                    className="border p-2 rounded"
                    value={item.description}
                    onChange={(e) => handleItemChange(i, "description", e.target.value)}/>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="border p-2 rounded"
                    value={item.qty}
                    onChange={(e) => handleItemChange(i, "qty", e.target.value)}/>
                  <input
                    type="number"
                    placeholder="Unit Price"
                    className="border p-2 rounded"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(i, "unit_price", e.target.value)}/>
                  {i > 0 && (
                    <button type="button" className="text-red-500" onClick={() => removeItem(i)}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" onClick={addItem} className="text-black">+ Add Item</button>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">
                  {editingInvoice ? "Update Invoice" : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}