import React, { useState, useEffect } from 'react';
import API from '../api';
import { 
  TrendingUp, 
  Clock,
  Zap,
  CheckCircle,
  FileText,
  DollarSign,
  PieChart as PieIcon,
  Mail,
  Send,
  Loader2
} from 'lucide-react';

const Finance = () => {
  const [data, setData] = useState({
    stats: { revenue: 0, outstanding: 0, pipeline: 0 },
    history: [],
    defaultCurrency: 'INR'
  });
  const [loading, setLoading] = useState(true);
  const [reportEmail, setReportEmail] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStatus, setReportStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          API.get('/dashboard'),
          API.get('/payments/history')
        ]);
        
        setData({
          stats: { 
            revenue: statsRes.data?.earnedThisMonth || 0, 
            outstanding: statsRes.data?.pendingAmount || 0, 
            pipeline: statsRes.data?.expectedIncome || 0 
          },
          history: Array.isArray(historyRes.data) ? historyRes.data : [],
          defaultCurrency: statsRes.data?.defaultCurrency || 'INR'
        });
      } catch (err) {
        console.error('Finance fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceData();
  }, []);

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportEmail) return;
    setReportLoading(true);
    setReportStatus({ type: '', message: '' });
    try {
      const res = await API.post('/reports/send-monthly-summary', { email: reportEmail });
      setReportStatus({ type: 'success', message: res.data?.message || 'Report sent!' });
      setReportEmail('');
    } catch (err) {
      setReportStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send report.' });
    } finally {
      setReportLoading(false);
      setTimeout(() => setReportStatus({ type: '', message: '' }), 5000);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Syncing Ledger...</p>
        </div>
    </div>
  );

  const stats = data?.stats || { revenue: 0, outstanding: 0, pipeline: 0 };
  const history = data?.history || [];

        const currencyMap = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        const activeSymbol = currencyMap[data?.defaultCurrency || 'INR'] || '₹';

        return (
            <div className="p-8 min-h-screen bg-slate-50">
              <div className="max-w-6xl mx-auto">
                <header className="mb-10">
                  <div className="flex items-center space-x-3 mb-2">
                    <PieIcon className="text-indigo-600" size={32} />
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Finance Hub</h2>
                  </div>
                  <p className="text-slate-500 font-medium italic">Command center for your performance analytics</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                   <div className="card bg-white shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Settled Revenue</p>
                       <h4 className="text-3xl font-black text-emerald-600">{activeSymbol}{(stats.revenue || 0).toLocaleString()}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Realized This Month</p>
                   </div>
                   <div className="card bg-white shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                       <h4 className="text-3xl font-black text-rose-600">{activeSymbol}{(stats.outstanding || 0).toLocaleString()}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Active Collection Pipeline</p>
                   </div>
                   <div className="card bg-white shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Pipeline</p>
                       <h4 className="text-3xl font-black text-indigo-600">{activeSymbol}{(stats.pipeline || 0).toLocaleString()}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Total Projected Earnings</p>
                   </div>
                </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card bg-white shadow-sm overflow-hidden p-0">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/20">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Payment Ledger</h3>
                </div>
                <div className="p-8 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="pb-4">Details</th>
                                <th className="pb-4">Method</th>
                                <th className="pb-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.map((payment, idx) => (
                                <tr key={payment?._id || idx}>
                                    <td className="py-4">
                                        <div className="font-bold text-slate-900">{payment?.invoiceId?.clientId?.name || 'Manual Log'}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase">Ref: #{payment?.invoiceId?._id?.slice(-6).toUpperCase() || 'NA'}</div>
                                    </td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">{payment?.method || 'UPI'}</span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="font-black text-slate-900">
                                            {currencyMap[payment?.invoiceId?.currency || 'INR'] || '₹'}
                                            {(payment?.amount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length === 0 && (
                        <div className="py-20 text-center opacity-30 italic text-sm">No transaction records found.</div>
                    )}
                </div>
            </div>

            <div className="space-y-8">
                <div className="card bg-white shadow-xl p-8 overflow-hidden relative group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1">Revenue Insight</h4>
                            <p className="text-xl font-black text-slate-900">Performance Trend</p>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    
                    {/* 🔹 PREMIUM GRAPH VISUALIZER */}
                    <div className="h-32 flex items-end justify-between gap-1 mb-6">
                        {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
                            <div key={i} className="flex-1 group/bar relative">
                                <div 
                                    className={`w-full rounded-t-lg transition-all duration-1000 delay-${i * 100} ${i === 6 ? 'bg-indigo-600' : 'bg-slate-100 group-hover/bar:bg-indigo-200'}`}
                                    style={{ height: `${height}%` }}
                                ></div>
                                {i === 6 && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                        Current: {stats.pipeline > 0 ? Math.round((stats.revenue / stats.pipeline) * 100) : 0}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-900 uppercase">Yield: {stats.pipeline > 0 ? Math.round((stats.revenue / stats.pipeline) * 100) : 0}%</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Real-time Analytics</span>
                    </div>
                </div>

                <div className="card bg-white shadow-sm p-8">
                    <h4 className="font-black text-[10px] uppercase text-slate-400 mb-6">Dispatch Report</h4>
                    <form onSubmit={handleSendReport} className="space-y-4">
                        <input type="email" placeholder="Recipient email" value={reportEmail} onChange={(e) => setReportEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl text-[13px] font-bold" />
                        <button type="submit" disabled={reportLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase flex items-center justify-center space-x-2">
                           {reportLoading ? <Loader2 className="animate-spin" /> : <><span>Send Summary</span><Send size={14} /></>}
                        </button>
                    </form>
                    {reportStatus.message && <div className="mt-4 text-[10px] font-black text-center uppercase tracking-tighter text-indigo-500">{reportStatus.message}</div>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
