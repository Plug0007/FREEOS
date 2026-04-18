import React, { useState, useEffect } from 'react';
import API from '../api';
import { User, CreditCard, Mail, Bell, Shield, Save, Clock } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    businessName: '',
    upiId: '',
    bankDetails: '',
    telegramUsername: '',
    emailReminders: true,
    telegramNotifications: false,
    reminderSettings: {
      upcomingDays: 1,
      followUpDays: 2,
      overdueDays: 5
    },
    defaultCurrency: 'INR'
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/settings');
        setSettings(res.data);
      } catch (err) {
        console.error('Settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Re-use loading state or create a saving state
    try {
      // 🔹 Explicitly ensuring we send the current settings state
      await API.post('/settings', { settings });
      setSaved(true);
      
      // 🔹 FORCED SYNC: Reload after 1 second to update the entire app context
      setTimeout(() => {
          window.location.reload();
      }, 1000);
      
    } catch (err) {
      console.error('Settings save error:', err);
      alert('Failed to save settings. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="ml-64 p-8">Loading Settings...</div>;

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
            <p className="text-slate-500">Manage your profile and preferences</p>
          </div>
          {saved && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold animate-fade-in">
              Changes Saved!
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Profile */}
          <section className="card">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-50 pb-4">
              <User className="text-indigo-600" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Business Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.businessName}
                  onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                  placeholder="e.g. Acme Creative"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Native Currency</label>
                  <select 
                    className="input-field"
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telegram</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">@</span>
                    <input 
                      type="text" 
                      className="input-field pl-8" 
                      value={settings.telegramUsername}
                      onChange={(e) => setSettings({...settings, telegramUsername: e.target.value})}
                      placeholder="user"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Preferences */}
          <section className="card">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-50 pb-4">
              <CreditCard className="text-indigo-600" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.upiId}
                  onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                  placeholder="user@upi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account Details</label>
                <textarea 
                  className="input-field h-24 pt-2" 
                  value={settings.bankDetails}
                  onChange={(e) => setSettings({...settings, bankDetails: e.target.value})}
                  placeholder="Acc No, IFSC, Branch..."
                />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="card">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-50 pb-4">
              <Bell className="text-indigo-600" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Notifications & Reminders</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Mail className="text-slate-400" size={20} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Email Reminders</div>
                    <div className="text-xs text-slate-500">Send automated reminders to clients</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.emailReminders}
                    onChange={(e) => setSettings({...settings, emailReminders: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="text-slate-400" size={20} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Telegram Notifications</div>
                    <div className="text-xs text-slate-500">Get updates about your payments (Soon)</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.telegramNotifications}
                    onChange={(e) => setSettings({...settings, telegramNotifications: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Reminder Timing Controls */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                   <Clock size={14} className="mr-2" /> Global Automation Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Upcoming Days</label>
                      <input 
                        type="number" 
                        className="w-full text-lg font-black text-indigo-600 focus:outline-none"
                        value={settings.reminderSettings.upcomingDays}
                        onChange={(e) => setSettings({...settings, reminderSettings: {...settings.reminderSettings, upcomingDays: parseInt(e.target.value)}})}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Days before due</p>
                   </div>
                   <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Follow-up Days</label>
                      <input 
                        type="number" 
                        className="w-full text-lg font-black text-indigo-600 focus:outline-none"
                        value={settings.reminderSettings.followUpDays}
                        onChange={(e) => setSettings({...settings, reminderSettings: {...settings.reminderSettings, followUpDays: parseInt(e.target.value)}})}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Days after due</p>
                   </div>
                   <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Overdue Notice</label>
                      <input 
                        type="number" 
                        className="w-full text-lg font-black text-indigo-600 focus:outline-none"
                        value={settings.reminderSettings.overdueDays}
                        onChange={(e) => setSettings({...settings, reminderSettings: {...settings.reminderSettings, overdueDays: parseInt(e.target.value)}})}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Final notice trigger</p>
                   </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-6">
            <button type="submit" disabled={loading} className="btn-primary px-10 py-4 flex items-center space-x-2 shadow-lg shadow-indigo-200 disabled:opacity-50">
              <Save size={20} />
              <span>{loading ? 'Saving Settings...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
