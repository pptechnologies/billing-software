import React, { useEffect, useState } from "react";
import axios from "axios";

const ReportsPage = () => {
  const [sales, setSales] = useState(null);
  const [vat, setVat] = useState(null);
  const [outstanding, setOutstanding] = useState({ invoices: [] });
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/reports/sales");
      setSales(res.data);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVat = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/reports/vat");
      setVat(res.data);
    } catch (err) {
      console.error("Error fetching VAT:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/reports/outstanding");
      setOutstanding(res.data);
    } catch (err) {
      console.error("Error fetching outstanding invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchVat();
    fetchOutstanding();
  }, []);

  const downloadInvoicePDF = (invoiceId) => {
    window.open(`http://localhost:4000/invoices/${invoiceId}/pdf`, "_blank");
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Reports</h1>
      {loading && <p className="text-gray-600">Loading...</p>}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Sales Report</h2>
        {sales && sales.invoices ? (
          <div className="space-y-2">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Period:</span>
              <span>{sales.from} to {sales.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Invoice Subtotal:</span>
              <span>{sales.invoices.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">VAT:</span>
              <span>{sales.invoices.vat}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span>{sales.invoices.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Cash Received:</span>
              <span>{sales.cash.received}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No sales data available</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">VAT Report</h2>
        {vat && vat.vatableSales ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Period:</span>
              <span>{vat.from} to {vat.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Vatable Sales:</span>
              <span>{vat.vatableSales}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">VAT Invoiced:</span>
              <span>{vat.vatInvoiced}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">VAT Rate:</span>
              <span>{((vat.vatInvoiced / vat.vatableSales) * 100).toFixed(2)}%</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No VAT data available</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Outstanding Invoices</h2>
        {outstanding.invoices.length ? (
          <>
            <p className="mb-4 text-gray-700">
              Total Due as of <span className="font-medium">{outstanding.asOf}</span>:{" "}
              <span className="font-bold text-red-600">{outstanding.totalDue}</span>
            </p>
            <div className="overflow-x-auto">
              <table className="table-auto w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left">Invoice Number</th>
                    <th className="border px-3 py-2 text-left">Customer</th>
                    <th className="border px-3 py-2 text-left">Amount Due</th>
                    <th className="border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.invoices.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{o.invoice_number}</td>
                      <td className="border px-3 py-2">{o.client_name}</td>
                      <td className="border px-3 py-2 font-semibold">{o.amount_due}</td>
                      <td className="border px-3 py-2">
                        <button
                          onClick={() => downloadInvoicePDF(o.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No outstanding invoices</p>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
