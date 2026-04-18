import React, { useState, useEffect } from 'react';
import API from '../api';
import { Plus, FileText, Send, CheckCircle, Edit, Trash2, X, Eye } from 'lucide-react';

const Agreements = () => {
    const [agreements, setAgreements] = useState([]);
    const [templates, setTemplates] = useState({ system: [], custom: [] });
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingAgreement, setEditingAgreement] = useState(null);
    const [formData, setFormData] = useState({ clientId: '', templateType: 'basic', project: '', amount: '', timeline: '' });

    useEffect(() => {
        fetchData();
        fetchTemplates();
    }, []);

    const fetchData = async () => {
        try {
            const [agRes, clRes] = await Promise.all([
                API.get('/agreements'),
                API.get('/clients')
            ]);
            setAgreements(agRes.data);
            setClients(clRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await API.get('/agreements/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    const handleCreateFromTemplate = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/agreements/template', {
                clientId: formData.clientId,
                templateType: formData.templateType,
                details: {
                    project: formData.project,
                    amount: formData.amount,
                    timeline: formData.timeline
                }
            });
            setEditingAgreement(res.data);
            setShowEditor(true);
            fetchData();
        } catch (err) {
            showNotice('Error creating agreement', 'error');
        }
    };

    const handleSave = async () => {
        try {
            await API.put(`/agreements/${editingAgreement._id}`, {
                content: editingAgreement.content,
                title: editingAgreement.title
            });
            showNotice('Draft saved successfully!');
            setShowEditor(false);
            setEditingAgreement(null);
            fetchData();
        } catch (err) {
            showNotice('Error saving draft', 'error');
        }
    };

    const handleSaveTemplate = async () => {
        try {
            await API.post('/agreements/templates', {
                name: editingAgreement.title.replace(' Agreement', ' Template'),
                content: editingAgreement.content
            });
            showNotice('Template saved successfully!');
            fetchTemplates();
        } catch (err) {
            showNotice('Error saving template', 'error');
        }
    };

    const [notification, setNotification] = useState(null);
    
    const showNotice = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSend = async (id) => {
        try {
            await API.post(`/agreements/${id}/send`);
            showNotice('Agreement sent successfully!');
            fetchData();
        } catch (err) {
            showNotice('Error: Could not send agreement', 'error');
        }
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50">
            {/* 🔹 Toast Notification System */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
                        notification.type === 'error' 
                        ? 'bg-rose-50 border-rose-100 text-rose-700' 
                        : 'bg-white border-indigo-100 text-indigo-700'
                    }`}>
                        {notification.type === 'error' ? <Trash2 size={20} /> : <CheckCircle size={20} />}
                        <span className="font-bold">{notification.msg}</span>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Agreements</h2>
                        <p className="text-slate-500">Draft and send contracts to your clients</p>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingAgreement(null);
                            setShowEditor(!showEditor);
                        }}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>New Agreement</span>
                    </button>
                </div>

                {showEditor && !editingAgreement && (
                    <div className="mb-8 card border-indigo-100 bg-indigo-50/30">
                        <h3 className="text-lg font-bold mb-4">Generate Agreement</h3>
                        <form onSubmit={handleCreateFromTemplate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <select 
                                className="input-field"
                                value={formData.clientId}
                                required
                                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            <select 
                                className="input-field font-bold text-indigo-600"
                                value={formData.templateType}
                                onChange={(e) => setFormData({...formData, templateType: e.target.value})}
                            >
                                <optgroup label="System Templates">
                                    {templates.system.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                                {templates.custom.length > 0 && (
                                    <optgroup label="My Templates">
                                        {templates.custom.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </optgroup>
                                )}
                            </select>
                            <input 
                                type="text" 
                                placeholder="Project Name" 
                                className="input-field"
                                value={formData.project}
                                onChange={(e) => setFormData({...formData, project: e.target.value})}
                            />
                            <input 
                                type="number" 
                                placeholder="Total Amount" 
                                className="input-field"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />
                            <input 
                                type="text" 
                                placeholder="Timeline (e.g. 4 weeks)" 
                                className="input-field"
                                value={formData.timeline}
                                onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                            />
                            <div className="lg:col-span-3 flex justify-end">
                                <button type="submit" className="btn-primary px-8">Generate from Selected</button>
                            </div>
                        </form>
                    </div>
                )}

                {showEditor && editingAgreement && (
                    <div className="mb-8 card border-indigo-200 ring-4 ring-indigo-50/50">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 leading-none mb-1">Agreement Editor</h3>
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Draft Mode</p>
                            </div>
                            <button onClick={() => {setShowEditor(false); setEditingAgreement(null);}} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tighter">Agreement Title</label>
                            <input 
                                type="text"
                                className="input-field font-bold text-lg"
                                value={editingAgreement.title}
                                onChange={(e) => setEditingAgreement({...editingAgreement, title: e.target.value})}
                            />
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tighter">Content (Supports Placeholders)</label>
                            <textarea 
                                className="input-field h-[400px] pt-4 font-mono text-sm leading-relaxed"
                                value={editingAgreement.content}
                                onChange={(e) => setEditingAgreement({...editingAgreement, content: e.target.value})}
                            />
                        </div>
                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                            <button 
                                onClick={handleSaveTemplate}
                                className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-all flex items-center space-x-2"
                            >
                                <Plus size={18} />
                                <span>Save as Template</span>
                            </button>
                            <div className="flex space-x-3">
                                <button onClick={handleSave} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">Save Draft</button>
                                <button onClick={() => handleSend(editingAgreement._id)} className="btn-primary flex items-center space-x-2 shadow-lg shadow-indigo-200">
                                    <Send size={18} />
                                    <span>Finalize & Send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {loading ? <p>Loading...</p> : agreements.length > 0 ? (
                        agreements.map(ag => (
                            <div key={ag._id} className="card flex items-center justify-between hover:shadow-sm">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{ag.title}</h4>
                                        <p className="text-xs text-slate-500">Client: {ag.clientId?.name} • Created {new Date(ag.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        ag.status === 'sent' ? 'bg-indigo-100 text-indigo-700' : 
                                        ag.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {ag.status}
                                    </span>
                                    <button 
                                        onClick={() => {setEditingAgreement(ag); setShowEditor(true);}}
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleSend(ag._id)}
                                        className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                        title="Resend"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center card bg-slate-50 border-dashed border-2 border-slate-200">
                             <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                             <p className="text-slate-500">No agreements yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agreements;
