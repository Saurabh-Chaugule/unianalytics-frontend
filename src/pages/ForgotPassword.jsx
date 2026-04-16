/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch('https://unianalytics-api.onrender.com/api/v1/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send code.");
      
      setStep(2);
    } catch (err) {
      if (err.message === 'Failed to fetch') setError('Cannot connect to server. Is the backend running?');
      else setError(err.message || 'Make sure the email is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) return;

    setLoading(true); setError(null);
    try {
      const res = await fetch('https://unianalytics-api.onrender.com/api/v1/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: enteredCode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid code.");
      
      setStep(3);
    } catch (err) {
      setError(err.message || "Incorrect or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const enteredCode = otp.join('');
      const res = await fetch('https://unianalytics-api.onrender.com/api/v1/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: enteredCode, new_password: password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password.");
      
      setStep(4);
      setTimeout(() => navigate('/login'), 3000); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) element.nextSibling.focus();
  };

  // THE FIX: Intelligent Backspace Deletion
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      if (newOtp[index] !== '') {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        e.target.previousSibling.focus();
      }
    }
  };

  return (
    // THE FIX: Added Light/Dark Mode transition classes
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/50 relative transition-colors">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave bg-[length:200%_auto]"></div>

        <div className="p-8 md:p-10">
          {step < 4 && (
            <button onClick={() => navigate('/login')} className="flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white mb-8 transition-colors group">
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Login
            </button>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                <KeyRound size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Password Recovery</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-8">Enter your registered email address to receive a secure 6-digit reset code.</p>
              
              <form onSubmit={handleSendCode}>
                <div className="mb-6">
                  <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@unianalytics.edu" className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"/>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-extrabold text-lg transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                  {loading ? "Connecting to Mail Server..." : "Send Reset Code"}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
               <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6">
                <Mail size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Check your Inbox</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-8">We've sent a secure code to <span className="text-slate-800 dark:text-white">{email}</span>.</p>
              
              <form onSubmit={handleVerifyCode}>
                <div className="flex justify-between gap-2 mb-8">
                  {otp.map((data, index) => (
                    <input 
                      key={index} 
                      type="text" 
                      maxLength="1" 
                      value={data} 
                      onChange={e => handleOtpChange(e.target, index)} 
                      onKeyDown={e => handleOtpKeyDown(e, index)} 
                      onFocus={e => e.target.select()} 
                      className="w-12 h-14 text-center text-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-extrabold" 
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-extrabold text-lg transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                  {loading ? "Verifying Identity..." : "Verify Identity"}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Secure New Password</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-8">Your identity has been verified. Please create a new, strong password.</p>
              
              <form onSubmit={handleResetPassword}>
                <div className="mb-6">
                  <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 pl-12 pr-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading || password.length < 6} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-extrabold text-lg transition-all shadow-lg shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                  {loading ? "Encrypting Database..." : "Initialize New Password"}
                </button>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Access Restored</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Your password has been successfully reset. Redirecting you to secure sign-in...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;