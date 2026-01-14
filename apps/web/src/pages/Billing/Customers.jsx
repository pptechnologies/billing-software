import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Search, X } from "lucide-react";

const API_URL = "http://localhost:4000/clients"; 

export default function Customers() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();
      setClients(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Could not load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create client");

      const newClient = await res.json();
      setClients((prev) => [...prev, newClient]);
      setFormData({ name: "", email: "", phone: "", city: "", country: "" });
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error("Error creating client:", err);
      setError("Failed to create client");
    }
  };

  return (
    <div className="bg-[#f6f7fb] min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Client Management</h2>
          <p className="text-gray-500 text-sm">Manage your clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          + Add Client
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold">All Clients</h3>
            <p className="text-sm text-gray-400">
              {clients.length} client{clients.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search Customers"
              className="pl-9 pr-4 py-2 border rounded-lg text-sm"/>
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
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client._id || client.id}
                      className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3 font-medium">{client.name}</td>
                      <td>{client.email}</td>
                      <td>{client.phone}</td>
                      <td>{client.city}</td>
                      <td>{client.country}</td>
                      <td>
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs">
                          Active
                        </span>
                      </td>
                      <td className="flex gap-3 py-3">
                        <button className="text-gray-500 hover:text-black">
                          <Pencil size={16} />
                        </button>
                        <button className="text-red-500 hover:text-red-700">
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
              <h3 className="text-lg font-semibold">Add Client</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                name="name"
                placeholder="Full Name"
                className="border p-2 rounded w-full"
                onChange={handleChange}
                value={formData.name}
                required/>
              <input
                name="email"
                placeholder="Email"
                className="border p-2 rounded w-full"
                onChange={handleChange}
                value={formData.email}
                required/>
              <input
                name="phone"
                placeholder="Phone"
                className="border p-2 rounded w-full"
                onChange={handleChange}
                value={formData.phone}/>
              <input
                name="city"
                placeholder="City"
                className="border p-2 rounded w-full"
                onChange={handleChange}
                value={formData.city}/>
              <input
                name="country"
                placeholder="Country"
                className="border p-2 rounded w-full"
                onChange={handleChange}
                value={formData.country}/>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
