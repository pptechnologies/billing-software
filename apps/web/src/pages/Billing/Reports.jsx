import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000";

const ReportsPage = () => {
  const [sales, setSales] = useState(null);
  const [vat, setVat] = useState(null);
  const [outstanding, setOutstanding] = useState({ invoices: [] });
  const [loading, setLoading] = useState(false);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      
      const [salesRes, vatRes, outstandingRes] = await Promise.all([
        axios.get(`${API_BASE}/reports/sales`),
        axios.get(`${API_BASE}/reports/vat`),
        axios.get(`${API_BASE}/reports/outstanding`)
      ]);

      setSales(salesRes.data);
      setVat(vatRes.data);
      setOutstanding(outstandingRes.data);
    } catch (err) {
      console.error("Error loading reports:", err);

      alert("Failed to sync with backend. Check if the server is running at: " + API_BASE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const downloadInvoicePDF = (invoiceId) => {

    console.log(`Generating PDF for Invoice: ${invoiceId}`);
    window.open(`${API_BASE}/invoices/${invoiceId}/pdf`, "_blank");
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
        {loading && (
          <div className="flex items-center text-blue-600 font-medium animate-pulse">
            <span className="mr-2">Syncing Data...</span>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
          Sales Summary
        </h2>
        {sales && sales.invoices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Period</p>
              <p className="font-bold text-gray-800">{sales.from} — {sales.to}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">{sales.invoices.total}</p>
            </div>
            <div className="space-y-2 col-span-full pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-mono">{sales.invoices.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT Collected:</span>
                <span className="font-mono">{sales.invoices.vat}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic">Waiting for sales data...</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
           VAT Analysis
        </h2>
        {vat && vat.vatableSales ? (
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Vatable Sales</span>
              <span className="font-bold">{vat.vatableSales}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">VAT Invoiced</span>
              <span className="font-bold text-blue-600">{vat.vatInvoiced}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Effective Rate</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                {((vat.vatInvoiced / vat.vatableSales) * 100).toFixed(2)}%
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
          {outstanding.totalDue && (
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase">Total Balance Due</p>
              <p className="text-xl font-black text-red-600">{outstanding.totalDue}</p>
            </div>
          )}
        </div>

        {outstanding.invoices.length > 0 ? (
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
                    <td className="px-4 py-3 text-right font-bold text-red-500">{o.amount_due}</td>
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