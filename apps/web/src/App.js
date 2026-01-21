import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoutes";

import Navbar from "./components/Navbar";
import BillingOverview from "./pages/Billing/BillingOverview";
import Customers from "./pages/Billing/Customers";
import Invoices from "./pages/Billing/Invoices";
import Payment from "./pages/Billing/Payment";
import Reports from "./pages/Billing/Reports";
import Login from "./Login";
import Unauthorized from "./Unauthorized";
import LandingPage from "./components/LandingPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/LandingPage" element={<LandingPage/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute roles={["billing", "admin"]} module="billing" />}>
            <Route path="/billing" element={<BillingOverview />}>
              <Route index element={<Navigate to="BillingOverview" replace />} />
              <Route path="BillingOverview" element={<BillingOverview />} />
              <Route path = "Customers" element={<Customers />} />
              <Route path = "Invoices" element={<Invoices />}/>
              <Route path = "Payment" element ={<Payment />}/>
              <Route path = "Reports" element = {<Reports/>}/>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/billing" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
