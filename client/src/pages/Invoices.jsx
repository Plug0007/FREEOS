import React, { useState, useEffect } from 'react';
import API from '../api';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Clock, 
  Zap, 
  CheckCircle, 
  X, 
  CreditCard,
  DollarSign,
  Euro,
  CircleDashed,
  RefreshCw
} from 'lucide-react';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'UPI', date: new Date().toISOString().split('T')[0] });
    const [formData, setFormData] = useState({ 
        clientId: '', 
        totalAmount: '', 
        dueDate: '', 
        currency: 'INR',
        split: 'Full',
        reminderOverrides: { upcomingDays: '', followUpDays: '', overdueDays: '' }
    });

    const currencyMap = {
        'INR': { symbol: '₹', icon: <span className="font-bold">₹</span> },
        'USD': { symbol: '$', icon: <DollarSign size={16} /> },
        'EUR': { symbol: '€', icon: <Euro size={16} /> },
        'GBP': { symbol: '£', icon: <span className="font-bold">£</span> }
    };

    useEffect(() => {
        fetchInvoices();
        fetchClients();
    }, []);

    const [notification, setNotification] = useState(null);
    
    const showNotice = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchInvoices = async () => {
        try {
            const res = await API.get('/invoices');
            // 🔹 Defensive update
            setInvoices(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            showNotice('Error: Could not sync invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            showNotice('Error: Could not load client list', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/invoices', formData);
            setFormData({ 
                clientId: '', 
                totalAmount: '', 
                dueDate: '', 
                currency: 'INR',
                split: 'Full',
                reminderOverrides: { upcomingDays: '', followUpDays: '', overdueDays: '' }
            });
            setShowAddForm(false);
            showNotice('Invoice deployed successfully!');
            fetchInvoices();
        } catch (err) {
            showNotice('Error creating invoice', 'error');
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        setShowPaymentModal(false);
        const amountRecorded = paymentData.amount;
        
        try {
            await API.post('/payments', {
                ...paymentData,
                invoiceId: selectedInvoice._id
            });
            
            const sym = currencyMap[selectedInvoice?.currency || 'INR']?.symbol || '₹';
            showNotice(`Success: ${sym}${Number(amountRecorded || 0).toLocaleString()} collected!`);
            fetchInvoices();
        } catch (err) {
            showNotice('Syncing...', 'info');
            fetchInvoices(); 
        }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/invoices/${id}`);
            showNotice('Invoice removed from pipeline');
            fetchInvoices();
        } catch (err) {
            showNotice('Error deleting invoice', 'error');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700';
            case 'overdue': return 'bg-rose-100 text-rose-700';
            case 'partial': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-200 text-slate-600';
        }
    };

    const filteredInvoices = invoices.filter(i => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return i.status !== 'paid';
        if (filterStatus === 'settled') return i.status === 'paid';
        return i.status === filterStatus;
    });

    const activeInvoices = filteredInvoices.filter(i => i.status !== 'paid');

    if (loading) return (
        <div className="p-8 min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-black uppercase text-[10px]">Syncing Pipeline...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 min-h-screen bg-slate-50">
            {notification && (
                <div className={`fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
                        notification.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-white border-indigo-100 text-indigo-700'
                    }`}>
                        <CheckCircle size={20} />
                        <span className="font-bold">{notification.msg}</span>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Invoice Hub</h2>
                        <p className="text-slate-500 font-medium italic">Monitor revenue and collection velocity</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        {['all', 'active', 'settled'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{s}</button>
                        ))}
                    </div>
                </header>

                <div className="mb-12">
                   <div className="flex items-center space-x-2 mb-6 text-indigo-600">
                       <Zap size={20} className="fill-indigo-600" />
                       <h3 className="text-xl font-black uppercase tracking-tight">Active Pipeline</h3>
                   </div>
                   <div className="card overflow-hidden bg-white shadow-sm border border-slate-100">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Client & ID</th>
                                    <th className="px-6 py-4 text-center">Projected</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeInvoices.map(invoice => (
                                    <tr key={invoice?._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900">{invoice?.clientId?.name || 'Unknown Client'}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-black">Ref: #{invoice?._id?.slice(-6).toUpperCase() || 'NA'}</div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="font-black text-slate-900">
                                                {currencyMap[invoice?.currency || 'INR']?.symbol || '₹'}
                                                {(invoice?.totalAmount || 0).toLocaleString()}
                                            </div>
                                            <div className="text-[9px] text-indigo-500 font-bold uppercase">
                                                Coll: {currencyMap[invoice?.currency || 'INR']?.symbol || '₹'}
                                                {(invoice?.paidAmount || 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusStyle(invoice?.status)}`}>
                                                {invoice?.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button onClick={() => {setSelectedInvoice(invoice); setShowPaymentModal(true);}} className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Log Cash</button>
                                            <button onClick={() => window.open(`/pay/${invoice?._id}`, '_blank')} className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Client View</button>
                                            <button onClick={() => handleDelete(invoice?._id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {activeInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">No Active Revenue</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                   </div>
                </div>

                {/* Modals */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-8 border-b flex justify-between items-center">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Deploy Invoice</h3>
                                <button onClick={() => setShowAddForm(false)}><X size={28} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-text">Client</label>
                                        <select className="input-field py-3 font-bold" required value={formData.clientId} onChange={(e) => setFormData({...formData, clientId: e.target.value})}>
                                            <option value="">Choose Client</option>
                                            {clients.map(c => <option key={c?._id} value={c?._id}>{c?.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-text">Currency</label>
                                        <select className="input-field py-3 font-bold" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                                            <option value="INR">INR (₹)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-text">Total Amount</label>
                                        <input type="number" className="input-field py-3 font-black text-xl" required placeholder="0.00" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="label-text">Due Date</label>
                                        <input type="date" className="input-field py-3 font-bold" required value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-3 font-black text-slate-400 uppercase text-xs">Cancel</button>
                                    <button type="submit" className="btn-primary px-12 py-3 h-auto">Create Invoice</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showPaymentModal && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[40px] p-10 max-w-md w-full animate-in zoom-in duration-300">
                             <h3 className="text-3xl font-black text-slate-900 mb-6">Collect Payment</h3>
                             <div className="bg-slate-50 p-6 rounded-2xl mb-6">
                                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Outstanding</p>
                                 <p className="text-4xl font-black text-slate-900">
                                    {currencyMap[selectedInvoice?.currency || 'INR']?.symbol || '₹'}
                                    {((selectedInvoice?.totalAmount || 0) - (selectedInvoice?.paidAmount || 0)).toLocaleString()}
                                 </p>
                             </div>
                             <input type="number" className="input-field py-4 text-2xl font-black text-center mb-6" value={paymentData.amount} placeholder="Amount" onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} />
                             <div className="flex gap-4">
                                 <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400">Cancel</button>
                                 <button onClick={handlePaymentSubmit} className="flex-1 btn-primary bg-slate-900 h-auto py-4 rounded-2xl">Confirm</button>
                             </div>
                        </div>
                    </div>
                )}
            </div>
            
            <button onClick={() => setShowAddForm(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40">
                <Plus size={40} strokeWidth={3} />
            </button>
        </div>
    );
};

export default Invoices;
