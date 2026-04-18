import React, { useState, useEffect } from 'react';
import API from '../api';
import { 
  CreditCard, 
  Download,
  Search,
  CheckCircle,
  Hash
} from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const currencyMap = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await API.get('/payments/history');
        // 🔹 Defensive update
        setPayments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => 
    p?.invoiceId?.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.invoiceId?._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="p-8 min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Retrieving History...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="text-indigo-600" size={32} />
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Ledger History</h2>
            </div>
            <p className="text-slate-500 font-medium italic">Immutable record of all successful transactions</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by client or method..." 
              className="input-field pl-12 py-3.5 bg-white border-2 border-slate-100 rounded-2xl font-bold shadow-sm outline-none focus:border-indigo-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="card overflow-hidden bg-white shadow-sm border border-slate-100 p-0">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Hash size={16} className="text-slate-400" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Audit Log</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
              {filteredPayments.length} Entries Recorded
            </span>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/10">
                  <th className="px-8 py-5">Transaction Details</th>
                  <th className="px-8 py-5">Value</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Channel</th>
                  <th className="px-8 py-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.map((payment) => (
                  <tr key={payment?._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shadow-sm">
                          <CheckCircle size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {payment?.invoiceId?.clientId?.name || 'Manual Log'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            Ref: #{payment?.invoiceId?._id?.slice(-8).toUpperCase() || 'MANUAL'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-lg">
                        {currencyMap[payment?.invoiceId?.currency || 'INR'] || '₹'}
                        {(payment?.amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600 font-bold">
                      {new Date(payment?.date || payment?.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700">
                        {payment?.method || 'Direct'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2.5 text-slate-300 hover:text-indigo-600 transition-all">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-32 text-center text-slate-300 uppercase text-[10px] font-black">
                       No Transaction Records Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
