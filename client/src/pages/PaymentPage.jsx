import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle, ShieldCheck, ArrowRight, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 🔹 Dynamic API detection (fixes localhost issue on different devices)
const getBaseURL = () => {
    const { hostname, protocol } = window.location;
    // If we're on a local IP/hostname but not localhost, assume backend is on 5001
    if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
        return `${protocol}//${hostname}:5001/api`;
    }
    return 'http://localhost:5001/api';
};

const API = axios.create({ baseURL: getBaseURL() });

const PaymentPage = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [rzpKey, setRzpKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // 'idle', 'processing', 'success', 'error'
  const [error, setError] = useState('');

  const currencyMap = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const { data: inv } = await API.get(`/invoices/public/${invoiceId}`);
      setInvoice(inv);
      const { data: keyRes } = await API.get('/payments/key');
      setRzpKey(keyRes.key);
    } catch (err) {
      console.error("📍 [HANDSHAKE ERROR]", err);
      const msg = err.response?.data?.message || err.message || 'Connection failed';
      setError(msg);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (status === 'processing') return;
    setStatus('processing');
    setError('');

    try {
      // 🔹 Isolated order creation path
      const { data: order } = await API.post('/payments/create-order', { invoiceId });
      
      const options = {
        key: rzpKey, 
        amount: order.amount,
        currency: order.currency || "INR",
        name: "FREEOS Finance",
        description: `Ref: ${invoice._id.slice(-6).toUpperCase()}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 🔹 Isolated verification path
            const verifyRes = await API.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice._id
            });
            if (verifyRes.data.success) {
              setStatus('success');
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Verification failed.');
            setStatus('error');
          }
        },
        prefill: { name: invoice.clientName },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: function() {
            setStatus('idle');
          }
        }
      };

      if (!window.Razorpay) {
          throw new Error('Razorpay SDK not loaded. Please refresh.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        setError(r.error.description);
        setStatus('error');
      });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.message || err.message || 'Gateway error.';
      setError(msg);
      setStatus('error');
    }
  };

  const simulatePayment = async () => {
    setStatus('processing');
    try {
      await API.post('/payments/verify-payment', {
        razorpay_order_id: `mock_${Date.now()}`,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: 'mock_sig',
        invoiceId: invoice._id,
        amount: (invoice.totalAmount - (invoice.paidAmount || 0))
      });
      setStatus('success');
    } catch (err) {
      setError('Simulation failed');
      setStatus('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
      >
        <RefreshCw className="text-indigo-600" size={32} />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl text-center border border-indigo-50"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            >
              <CheckCircle size={80} className="text-emerald-500 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Payment Success</h2>
            <p className="text-slate-500 mb-8 italic">Your record has been updated on the ledger.</p>
            <button 
              onClick={() => window.close()} 
              className="text-indigo-600 font-black uppercase text-xs tracking-widest hover:underline"
            >
              Close Portal
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="payment-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl w-full"
          >
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-indigo-50 relative">
              <div className="p-10 border-b bg-indigo-50/10">
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-indigo-100"
                >
                  Outstanding Balance
                </motion.span>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-6xl font-black text-slate-900 mt-4 tracking-tighter"
                >
                  {currencyMap[invoice.currency || 'INR'] || '₹'}
                  {(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString()}
                </motion.h2>
                <p className="text-sm font-bold text-slate-400 mt-2 uppercase">Bill for: {invoice.clientName}</p>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Projected</span>
                        <span className="text-slate-900 font-bold">{currencyMap[invoice.currency || 'INR'] || '₹'}{invoice.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Already Collected</span>
                        <span className="text-emerald-600 font-bold">{currencyMap[invoice.currency || 'INR'] || '₹'}{invoice.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-100"></div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center space-x-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100"
                  >
                    <AlertCircle size={18} />
                    <span className="text-xs font-bold uppercase tracking-tighter">{error}</span>
                  </motion.div>
                )}

                <div className="grid gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={status === 'processing'}
                    onClick={handlePayNow} 
                    className={cn(
                        "w-full py-5 rounded-[24px] flex items-center justify-center space-x-3 shadow-xl transition-all font-black uppercase tracking-widest text-sm",
                        status === 'processing' ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white shadow-indigo-200"
                    )}
                  >
                    {status === 'processing' ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Contacting Gateway...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={18} />
                            <span>Secure Checkout</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                  </motion.button>

                  <button 
                    onClick={simulatePayment} 
                    disabled={status === 'processing'}
                    className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] border-2 border-dashed rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    Demo: Simulate Handshake
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex items-center justify-center gap-4 grayscale opacity-50">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4" />
                  <div className="h-4 w-px bg-slate-300"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={12} />
                      SSL Encrypted
                  </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
