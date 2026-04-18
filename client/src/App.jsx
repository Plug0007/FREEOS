import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Finance from './pages/Finance';
import Agreements from './pages/Agreements';
import Settings from './pages/Settings';
import PaymentPage from './pages/PaymentPage';
import Sidebar from './components/Sidebar';

const PageLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  
  return (
    <div className="flex">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </div>
    </div>
  );
};

const DashboardPlaceholder = () => (
    <Dashboard />
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pay/:invoiceId" element={<PaymentPage />} />
        
        <Route path="/" element={<PageLayout><DashboardPlaceholder /></PageLayout>} />
        <Route path="/clients" element={<PageLayout><Clients /></PageLayout>} />
        <Route path="/invoices" element={<PageLayout><Invoices /></PageLayout>} />
        <Route path="/payments" element={<PageLayout><Payments /></PageLayout>} />
        <Route path="/finance" element={<PageLayout><Finance /></PageLayout>} />
        <Route path="/agreements" element={<PageLayout><Agreements /></PageLayout>} />
        <Route path="/settings" element={<PageLayout><Settings /></PageLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
