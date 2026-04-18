import React, { useState, useEffect } from 'react';
import API from '../api';
import { Plus, Search, Mail, Briefcase, FileJson, MessageSquare, Users, CheckCircle, X } from 'lucide-react';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importType, setImportType] = useState('manual'); // 'manual', 'json', 'chat'
  const [chatText, setChatText] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    project: '', 
    paymentTerms: '50/50',
    budget: '',
    chatHistory: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await API.get('/clients');
      setClients(res.data);
    } catch (err) {
      showNotice('Sync Failed: Could not load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/clients', formData);
      setFormData({ 
        name: '', 
        email: '', 
        project: '', 
        paymentTerms: '50/50',
        budget: '',
        chatHistory: []
      });
      setShowAddForm(false);
      setImportType('manual');
      showNotice('Relationship Activated!');
      fetchClients();
    } catch (err) {
      const errorMsg = err.response?.data?.details || 'Failed to onboard client';
      showNotice(errorMsg, 'error');
    }
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const clientsToAdd = Array.isArray(data) ? data : [data];
        
        let successCount = 0;
        let failCount = 0;

        for (const item of clientsToAdd) {
          // 🔹 Intelligent Mapping logic (Matches backend logic)
          const payload = {
            name: item.name || item.client || item.clientName || item.customer || item.fullName,
            email: item.email || item.emailAddress || item.contact || '',
            project: item.project || item.title || item.subject || item.description || '',
            paymentTerms: item.paymentTerms || '50/50',
            budget: Number(item.budget || item.amount || item.total || item.price || item.cost) || 0,
            chatHistory: item.chatHistory || item.history || item.messages || []
          };

          // 🔹 Validation Guard
          if (!payload.name) {
            console.error('[IMPORT FAIL] Missing required Name field for item:', item);
            failCount++;
            continue;
          }

          await API.post('/clients', payload);
          successCount++;
        }

        fetchClients();
        setShowAddForm(false);
        
        if (successCount > 0) {
            showNotice(`Synced ${successCount} relationships! ${failCount > 0 ? `(${failCount} skipped due to invalid data)` : ''}`);
        } else {
            showNotice('Failed: No valid client names found in file', 'error');
        }
      } catch (err) {
        showNotice('Invalid JSON Knowledge file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const [editingChat, setEditingChat] = useState(null); // For the history modal

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        setChatText(text);
        
        // 🔹 Trigger Smart Extraction
        const res = await API.post('/clients/import', { chatText: text });
        const { name, email, project, budget, history } = res.data;
        
        setFormData({
            ...formData,
            name: name || '',
            email: email || '',
            project: project || '',
            budget: budget || '',
            chatHistory: history || []
        });
        
        showNotice('WhatsApp Intelligence Synced!');
        setImportType('manual');
      } catch (err) {
        showNotice('Extraction Failed: Clean up chat log and retry', 'error');
      }
    };
    reader.readAsText(file);
  };

  const [notification, setNotification] = useState(null);
  const showNotice = (msg, type = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleChatParse = async () => {
    if (!chatText.trim()) return;
    try {
      const res = await API.post('/clients/import', { chatText });
      const { name, email, project, budget, history } = res.data;
      
      setFormData({
        ...formData,
        name: name || '',
        email: email || '',
        project: project || '',
        budget: budget || '',
        chatHistory: history || []
      });
      
      showNotice('Chat Intel Extracted!');
      setImportType('manual');
    } catch (err) {
      showNotice('Intelligence Sync Failed', 'error');
    }
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      {/* 🔹 Intelligence Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
                notification.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-white border-indigo-100 text-indigo-700'
            }`}>
                <CheckCircle size={20} />
                <span className="font-bold">{notification.msg}</span>
            </div>
        </div>
      )}

      {/* 🔹 Chat Intelligence Timeline Modal */}
      {editingChat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[80vh] flex flex-col">
                <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Relationship Timeline</h3>
                        <p className="text-xs text-indigo-600 font-black uppercase tracking-widest">{editingChat.name}</p>
                    </div>
                    <button onClick={() => setEditingChat(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30">
                    {editingChat.chatHistory?.length > 0 ? editingChat.chatHistory.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender.toLowerCase().includes('me') ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm ${
                                msg.sender.toLowerCase().includes('me') ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'
                            }`}>
                                <p className="font-medium">{msg.content}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{msg.date} • {msg.sender}</span>
                        </div>
                    )) : (
                        <div className="text-center py-20 opacity-30">
                            <MessageSquare size={48} className="mx-auto mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs">No Conversation Details Synced</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Client Hub</h2>
            <p className="text-slate-500 font-medium italic">Manage your working relationships and conversation logs</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center space-x-2 shadow-xl shadow-indigo-100"
          >
            <Plus size={20} />
            <span className="font-black uppercase tracking-widest text-xs">Add Client</span>
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 card border-indigo-100 bg-indigo-50/10 ring-4 ring-indigo-50/50">
            <div className="flex space-x-6 mb-6 border-b border-indigo-100 pb-2 overflow-x-auto">
              {['manual', 'chat', 'json'].map(type => (
                <button 
                  key={type}
                  onClick={() => setImportType(type)}
                  className={`pb-2 px-1 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${importType === type ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                >
                  {type === 'chat' ? 'Sync WhatsApp' : type === 'manual' ? 'Manual Entry' : 'JSON Feed'}
                </button>
              ))}
            </div>

            {importType === 'manual' && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Client Name</label>
                    <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="input-field font-bold py-3"
                    value={formData.name}
                    required
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Email Address</label>
                    <input 
                    type="email" 
                    placeholder="e.g. client@brand.com" 
                    className="input-field font-bold py-3"
                    value={formData.email}
                    required
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Gross Budget (₹)</label>
                    <input 
                    type="number" 
                    placeholder="Amount" 
                    className="input-field font-black text-indigo-600 py-3"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    />
                </div>
                <div className="lg:col-span-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Project Title</label>
                    <input 
                    type="text" 
                    placeholder="Brief Project Name" 
                    className="input-field font-medium py-3"
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Structure</label>
                    <select 
                    className="input-field font-bold py-3"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    >
                    <option value="50/50">50/50 Split</option>
                    <option value="Full">Full Payment</option>
                    <option value="Custom">Custom Terms</option>
                    </select>
                </div>
                <div className="lg:col-span-5 flex justify-end space-x-4 pt-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2 text-slate-400 hover:text-slate-600 font-bold uppercase text-xs tracking-widest transition-colors">Discard</button>
                  <button type="submit" className="btn-primary px-10 shadow-lg shadow-indigo-100">Activate Relationship</button>
                </div>
              </form>
            )}

            {importType === 'json' && (
              <div className="py-10 text-center border-2 border-dashed border-indigo-200 rounded-[32px] bg-white">
                <FileJson size={48} className="mx-auto text-indigo-200 mb-4" />
                <p className="text-slate-500 font-bold text-sm mb-6">Drop a JSON feed containing client intelligence</p>
                <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" id="json-upload" />
                <label htmlFor="json-upload" className="btn-primary cursor-pointer inline-block px-10">Choose File</label>
              </div>
            )}

            {importType === 'chat' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-indigo-600">
                        <MessageSquare size={20} className="fill-indigo-600 text-white" />
                        <span className="text-xs font-black uppercase tracking-widest">Intelligence Extraction</span>
                    </div>
                    <label className="text-[10px] font-black text-indigo-600 cursor-pointer bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                        Upload .txt File
                        <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
                <textarea 
                  className="input-field h-40 pt-4 font-mono text-sm leading-relaxed border-2 border-indigo-100 focus:border-indigo-600"
                  placeholder="[17/04/24, 10:24 AM] Client Name: My budget is 50,000 for the app..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                />
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleChatParse} className="btn-primary px-8 shadow-xl shadow-indigo-200">Start Scan</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Syncing Relationship Hub...</p>
          ) : clients.length > 0 ? (
            clients.map(client => (
              <div key={client._id} className="card group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-slate-100 relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-10 -mt-10 group-hover:bg-indigo-600/10 transition-colors"></div>
                
                <div className="flex items-start justify-between mb-6 relative">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center font-black text-2xl shadow-xl shadow-slate-200">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 ${
                        client.paymentTerms === '50/50' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                        {client.paymentTerms}
                    </span>
                    {client.budget > 0 && (
                        <span className="text-xl font-black text-indigo-600 tracking-tight">₹{client.budget.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{client.name}</h3>
                <div className="space-y-3 text-slate-500 mb-8">
                  <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm font-bold truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Briefcase size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">{client.project || 'Lead Relationship'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-slate-50 bg-slate-50/30 -mx-8 -mb-8 px-8">
                  <div className="flex items-center space-x-4">
                      <button onClick={() => setEditingChat(client)} className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors group/btn">
                        <MessageSquare size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                      </button>
                  </div>
                  <button className="text-slate-300 hover:text-slate-900 transition-colors"><Plus size={20} /></button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center card bg-slate-50/30 border-dashed border-2 border-slate-200">
              <Users size={64} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Relationship Pipeline Empty</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="mt-6 text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:underline"
              >
                Onboard First Relationship
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
