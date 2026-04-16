/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Calendar } from 'lucide-react';
import useStore from '../store/useStore';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useStore(); 
  
  const [isRegistering, setIsRegistering] = useState(
    new URLSearchParams(window.location.search).get('register') === 'true' || false
  );
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');

  const [pwdStrength, setPwdStrength] = useState(0);

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    let score = 0;
    if (val.length >= 8) score += 1; 
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 1; 
    if (/\d/.test(val) && /[^A-Za-z0-9]/.test(val)) score += 1; 
    setPwdStrength(score);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        if (pwdStrength < 3) {
          throw new Error('Please create a stronger password before proceeding.');
        }

        // 1. Explicit Fetch to Register API
        const regRes = await fetch('https://unianalytics-api.onrender.com/api/v1/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, dob })
        });
        
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.detail || "Registration failed.");

        // 2. Explicit Fetch to Login API (Requires FormData)
        const loginForm = new FormData();
        loginForm.append('username', email);
        loginForm.append('password', password);
        
        const loginRes = await fetch('https://unianalytics-api.onrender.com/api/v1/login', {
          method: 'POST',
          body: loginForm
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.detail || "Auto-login failed.");

        // 3. Save & Redirect (Pass 'username' explicitly since they just created it)
        localStorage.setItem('uni_token', loginData.access_token);
        login(username, loginData.role || 'Teacher', email, dob);
        navigate('/dashboard');

      } else {
        // 1. Standard Login Fetch
        const loginForm = new FormData();
        loginForm.append('username', email);
        loginForm.append('password', password);

        const res = await fetch('https://unianalytics-api.onrender.com/api/v1/login', {
          method: 'POST',
          body: loginForm
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.detail || "Authentication failed. Check credentials.");

        // 2. Save & Redirect (Rely solely on backend data)
        localStorage.setItem('uni_token', resData.access_token);
        login(resData.name, resData.role || 'Teacher', email, resData.dob);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Network Error: Cannot reach the database. Is your backend running?');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row transition-colors">
        
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20 pointer-events-none">
            <svg viewBox="0 0 800 500" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,100 C150,200 350,0 500,100 L500,00 L0,0 Z" fill="white" className="animate-pulse" style={{animationDuration: '4s'}}></path>
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-extrabold text-2xl mb-8 backdrop-blur-sm">U</div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4 transition-all">
              {isRegistering ? "Create your Workspace." : "Welcome back, Educator."}
            </h1>
            <p className="text-blue-100 font-bold transition-all">
              Access your unified dashboard, track performance metrics, and manage your academic pipeline securely.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <p className="text-sm text-blue-200 mb-4 font-bold">
              {isRegistering ? "Already have an account?" : "Don't have an enterprise account?"}
            </p>
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setPassword('');
                setPwdStrength(0);
              }}
              type="button"
              className="px-6 py-2 border-2 border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl font-extrabold transition-all duration-300"
            >
              {isRegistering ? "Back to Login" : "Create Account"}
            </button>
          </div>
        </div>

        <div className="w-full md:w-7/12 p-10 md:p-14 bg-white dark:bg-slate-800 flex flex-col justify-center transition-colors">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              {isRegistering ? "Register Account" : "Secure Sign In"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
              {isRegistering ? "Enter your unique username to initialize." : "Enter your credentials to continue."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {isRegistering && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Unique Username</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input 
                      required type="text" 
                      value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                      placeholder="teacher_123" 
                      className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input 
                      required type="date" 
                      value={dob} onChange={e=>setDob(e.target.value)} 
                      className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  required type="email" 
                  value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="Enter email" 
                  className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                {!isRegistering && (
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password} onChange={handlePasswordChange}
                  placeholder="••••••••" 
                  className="w-full p-4 pl-12 pr-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isRegistering && (
                <div className="mt-3 animate-in fade-in">
                  <div className="flex gap-2">
                    <div className={`h-1.5 w-full rounded-full transition-colors ${pwdStrength >= 1 ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className={`h-1.5 w-full rounded-full transition-colors ${pwdStrength >= 2 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className={`h-1.5 w-full rounded-full transition-colors ${pwdStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  </div>
                  {pwdStrength === 3 && <p className="text-xs text-emerald-500 font-bold mt-2">Strong password!</p>}
                  {pwdStrength > 0 && pwdStrength < 3 && <p className="text-xs text-amber-500 dark:text-amber-400 font-bold mt-2">Add numbers, symbols, and mixed casing.</p>}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white rounded-xl font-extrabold text-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-70 transition-all duration-300 hover:scale-[1.02] bg-[length:200%_auto] hover:bg-right"
            >
              {loading ? "Authenticating..." : (isRegistering ? "Create Workspace" : "Access Workspace")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;