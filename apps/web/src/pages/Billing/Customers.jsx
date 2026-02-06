import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Search, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function Customers() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const normalizeId = (client) => client.id || client._id;

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clients`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (err) {
      toast.error("Could not load clients from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {

      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.phone && formData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits");
    }

    const loadingToast = toast.loading(editingClient ? "Updating..." : "Saving...");

    try {
      const method = editingClient ? "PATCH" : "POST";
      const url = editingClient
        ? `${API_BASE}/clients/${normalizeId(editingClient)}`
        : `${API_BASE}/clients`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");
      const savedClient = await res.json();

      if (editingClient) {
        setClients((prev) =>
          prev.map((c) => (normalizeId(c) === normalizeId(savedClient) ? savedClient : c))
        );
        toast.success("Client updated successfully!", { id: loadingToast });
      } else {
        setClients((prev) => [...prev, savedClient]);
        setFilteredClients((prev) => [...prev, savedClient]);
        toast.success("Client added successfully!", { id: loadingToast });
      }

      setFormData({ name: "", email: "", phone: "", city: "", country: "" });
      setEditingClient(null);
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to save client.", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      
      setClients((prev) => prev.filter((c) => normalizeId(c) !== id));
      setFilteredClients((prev) => prev.filter((c) => normalizeId(c) !== id));
      toast.success("Client deleted");
    } catch (err) {
      toast.error("Could not delete client");
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      city: client.city || "",
      country: client.country || "",
    });
    setShowModal(true);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredClients(
      clients.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(query) ||
          (c.email || "").toLowerCase().includes(query) ||
          (c.phone || "").toLowerCase().includes(query)
      )
    );
  };

  return (
    <div className="bg-[#f6f7fb] min-h-screen p-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Client Management</h2>
          <p className="text-gray-500 text-sm">Manage your clients</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: "", email: "", phone: "", city: "", country: "" });
            setShowModal(true);
          }}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          + Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold">All Clients</h3>
            <p className="text-sm text-gray-400">
              {clients.length} client{clients.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search Customers"
              className="pl-9 pr-4 py-2 border rounded-lg text-sm"
              value={searchQuery}
              onChange={handleSearch}/>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 py-10 text-center">Loading clients...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={normalizeId(client)} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3 font-medium">{client.name}</td>
                      <td>{client.email}</td>
                      <td>{client.phone}</td>
                      <td>{client.city}</td>
                      <td>{client.country}</td>
                      <td>
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs">Active</span>
                      </td>
                      <td className="flex gap-3 py-3">
                        <button className="text-gray-500 hover:text-black" onClick={() => handleEdit(client)}>
                          <Pencil size={16} />
                        </button>
                        <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(normalizeId(client))}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
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
              <h3 className="text-lg font-semibold">{editingClient ? "Edit Client" : "Add Client"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input name="name" placeholder="Full Name" className="border p-2 rounded w-full" onChange={handleChange} value={formData.name} required/>
              <input name="email" type="email" placeholder="Email" className="border p-2 rounded w-full" onChange={handleChange} value={formData.email} required/>
              
              <input 
                name="phone" 
                inputMode="numeric"
                type="text" 
                placeholder="Phone (10 digits)" 
                className="border p-2 rounded w-full" 
                onChange={handleChange} 
                value={formData.phone}/>
              
              <input name="city" placeholder="City" className="border p-2 rounded w-full" onChange={handleChange} value={formData.city}/>
              <input name="country" placeholder="Country" className="border p-2 rounded w-full" onChange={handleChange} value={formData.country}/>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">
                  {editingClient ? "Update Client" : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}