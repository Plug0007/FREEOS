import React, { useState, useEffect } from 'react';
import API from '../api';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  ChevronRight,
  Zap,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, amount, icon, color, subtitle, currencySymbol = '₹' }) => (
  <div className="card h-full transform transition-all hover:scale-[1.02] hover:shadow-lg">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} shadow-lg`}>
        {React.cloneElement(icon, { size: 24, className: "text-white" })}
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
    <div className="text-4xl font-black text-slate-900">
      {currencySymbol}{(amount || 0).toLocaleString()}
    </div>
    {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ earnedThisMonth: 0, pendingAmount: 0, expectedIncome: 0, recentInvoices: [] });
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, actionsRes] = await Promise.all([
          API.get('/dashboard'),
          API.get('/actions')
        ]);
        // 🔹 Defensive update: Ensure we never set null/undefined
        setStats({
            earnedThisMonth: statsRes.data?.earnedThisMonth || 0,
            pendingAmount: statsRes.data?.pendingAmount || 0,
            expectedIncome: statsRes.data?.expectedIncome || 0,
            defaultCurrency: statsRes.data?.defaultCurrency || 'INR',
            recentInvoices: Array.isArray(statsRes.data?.recentInvoices) ? statsRes.data.recentInvoices : []
        });
        setActions(Array.isArray(actionsRes.data) ? actionsRes.data : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="p-8 min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-black uppercase text-[10px]">Command Centre Loading...</p>
      </div>
    </div>
  );

        const currencyMap = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        const activeSymbol = currencyMap[stats?.defaultCurrency || 'INR'] || '₹';

        return (
            <div className="p-8 min-h-screen bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10 flex justify-between items-end">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h2>
                            <p className="text-slate-500 font-medium font-serif italic text-sm">Your business performance at a glance</p>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-tighter">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>Sync Active</span>
                             </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <StatCard 
                            title="Revenue" 
                            amount={stats?.earnedThisMonth} 
                            icon={<CheckCircle />} 
                            color="bg-emerald-500 shadow-emerald-200" 
                            subtitle="Cash settled this month"
                            currencySymbol={activeSymbol}
                        />
                        <StatCard 
                            title="Outstanding" 
                            amount={stats?.pendingAmount} 
                            icon={<Clock />} 
                            color="bg-rose-500 shadow-rose-200" 
                            subtitle="Total collections pending"
                            currencySymbol={activeSymbol}
                        />
                        <StatCard 
                            title="Total Pipeline" 
                            amount={stats?.expectedIncome} 
                            icon={<TrendingUp />} 
                            color="bg-indigo-600 shadow-indigo-200" 
                            subtitle="Overall projected earnings"
                            currencySymbol={activeSymbol}
                        />
                    </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="card h-[480px] flex flex-col">
            <div className="flex items-center space-x-2 mb-8">
               <Zap className="text-amber-500 fill-amber-500" size={20} />
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Priority Actions</h3>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {actions && actions.length > 0 ? actions.map((action, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Bell size={20} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{action?.message || 'New Action'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Due {action?.delay === 0 ? 'Today' : `${action?.delay || 0}d Overdue`}</p>
                    </div>
                  </div>
                  <Link to="/invoices" className="p-2 rounded-full hover:bg-slate-100 text-slate-300 hover:text-indigo-600 transition-all">
                    <ChevronRight size={24} />
                  </Link>
                </div>
              )) : (
                <div className="py-16 text-center opacity-30">
                  <CheckCircle size={32} className="mx-auto mb-3" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Zero Pending Tasks</p>
                </div>
              )}
            </div>
          </div>

          <div className="card h-[480px] flex flex-col">
            <div className="flex justify-between items-center mb-10 border-b border-transparent pb-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
              <Link to="/invoices" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</Link>
            </div>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {(stats?.recentInvoices || []).map(item => (
                <div key={item?._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner uppercase">
                      {item?.clientId?.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{item?.clientId?.name || 'Unknown Client'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Record #{item?._id?.slice(-4).toUpperCase() || 'NA'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">₹{(item?.amount || 0).toLocaleString()}</div>
                    <div className={`text-[9px] font-black uppercase tracking-widest inline-block px-2 py-0.5 rounded-md ${
                        item?.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item?.status || 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recentInvoices || stats?.recentInvoices.length === 0) && (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-20">
                    <Clock size={40} />
                    <p className="text-xs font-black uppercase tracking-widest">No Recent Logs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
