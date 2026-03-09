import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = "http://localhost:4000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const ReportsPage = () => {
  const [sales, setSales] = useState(null);
  const [vat, setVat] = useState(null);
  const [outstanding, setOutstanding] = useState({ invoices: [] });
  const [loading, setLoading] = useState(false);

  const loadAllReports = async () => {
    try {
      setLoading(true);

      const [salesRes, vatRes, outstandingRes] = await Promise.all([
        axios.get(`${API_BASE}/reports/sales`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE}/reports/vat`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE}/reports/outstanding`, { headers: getAuthHeaders() }),
      ]);

      setSales(salesRes.data);
      setVat(vatRes.data);
      setOutstanding(outstandingRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log out and log back in.");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to view reports.");
      } else if (!err.response) {
        toast.error("Cannot reach server. Make sure backend is running.");
      } else {
        toast.error("Failed to load reports: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const downloadInvoicePDF = (invoiceId) => {
    window.open(`${API_BASE}/invoices/${invoiceId}/pdf`, "_blank");
  };

  return (
    <div className="pt-1 p-6 space-y-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Financial Report</h2>
          <p className="text-gray-500 text-sm">Monitor Financial Transaction</p>
        </div>
        {loading && (
          <div className="flex items-center text-blue-600 font-medium animate-pulse">
            <span className="mr-2">Syncing Data...</span>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Sales Summary</h2>
        {sales ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Period</p>
 
              <p className="font-bold text-gray-800">{sales.from} — {sales.to}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-600">Total Revenue (Invoiced)</p>

              <p className="text-2xl font-bold text-green-700">
                NPR {sales.invoices?.total ?? 0}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-600">Cash Received</p>
              <p className="text-2xl font-bold text-blue-700">
                NPR {sales.cash?.received ?? 0}
              </p>
            </div>

            <div className="space-y-2 col-span-full pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-mono">NPR {sales.invoices?.subtotal ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT Collected:</span>
                <span className="font-mono">NPR {sales.invoices?.vat ?? 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic">Waiting for sales data...</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-700">VAT Analysis</h2>
        {vat ? (
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Vatable Sales</span>
              <span className="font-bold">NPR {vat.vatableSales ?? 0}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">VAT Invoiced</span>
              <span className="font-bold text-blue-600">NPR {vat.vatInvoiced ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Effective Rate</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                {vat.vatableSales > 0
                  ? ((vat.vatInvoiced / vat.vatableSales) * 100).toFixed(2) + "%"
                  : "0.00%"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic">Waiting for VAT data...</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-700">Outstanding Invoices</h2>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Total Balance Due</p>
            <p className="text-xl font-black text-red-600">
              NPR {outstanding?.totalDue ?? 0}
            </p>
          </div>
        </div>
        {outstanding?.invoices?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Amount Due</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outstanding.invoices.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.invoice_number}</td>
                    <td className="px-4 py-3">{o.client_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">
                      NPR {o.amount_due}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => downloadInvoicePDF(o.id)}
                        className="bg-black text-white px-4 py-1.5 rounded-md text-xs hover:bg-gray-800 transition shadow-sm">
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Great news! No outstanding payments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;