/* eslint-disable */
import React, { useState, useRef } from 'react';
import { User, ShieldCheck, Sliders, Monitor, HardDrive, AlertTriangle, Download, Upload, Trash2, Eye, EyeOff, KeyRound, Mail, Lock, CheckCircle2, X, ArrowRight, UserX } from 'lucide-react';
import * as XLSX from 'xlsx';
import useStore from '../store/useStore';
import apiClient from '../api'; 

const safeArr = (val) => Array.isArray(val) ? val : [];

const Settings = () => {
  const { 
    globalData, updateMasterData, userName, userEmail, userDOB, userRole, 
    isDarkMode, toggleDarkMode, logout,
    focusMode, setFocusMode,
    topPerformerToggle, setTopPerformerToggle,
    passThreshold, setPassThreshold
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [saveNotify, setSaveNotify] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const [forgotModal, setForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false); 
  const fileInputRef = useRef(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: 'loading', text: 'Verifying current password...' });
    
    try {
      const token = localStorage.getItem('uni_token');
      const res = await fetch('https://unianalytics-api.onrender.com/api/v1/user/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          old_password: oldPassword, 
          new_password: newPassword 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update password');
      }
      
      setPassMsg({ type: 'success', text: 'Password successfully updated!' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message });
    }
    
    setTimeout(() => setPassMsg({ type: '', text: '' }), 5000); 
  };

  const openForgotModal = () => {
    setForgotModal(true);
    setForgotStep(1);
    setResetEmail(userEmail || ''); 
    setResetOtp(['', '', '', '', '', '']);
    setResetNewPass('');
    setResetError('');
    // THE FIX: Clean slate just in case they open it manually
    setOldPassword('');
    setNewPassword('');
    setPassMsg({ type: '', text: '' });
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setResetLoading(true); setResetError('');
    try {
      await apiClient.post('/request-otp', { email: resetEmail });
      setForgotStep(2);
    } catch (err) { setResetError(err.response?.data?.detail || "Failed to send code. Ensure this is your registered email."); } 
    finally { setResetLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const enteredCode = resetOtp.join('');
    if (enteredCode.length !== 6) return;
    setResetLoading(true); setResetError('');
    try {
      await apiClient.post('/verify-otp', { email: resetEmail, code: enteredCode });
      setForgotStep(3);
    } catch (err) { setResetError(err.response?.data?.detail || "Incorrect or expired code."); } 
    finally { setResetLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true); setResetError('');
    try {
      const enteredCode = resetOtp.join('');
      await apiClient.post('/reset-password', { email: resetEmail, code: enteredCode, new_password: resetNewPass });
      setForgotStep(4);
      setTimeout(() => { 
        setForgotModal(false); 
        setForgotStep(1); 
        // THE FIX: Wipe the background password boxes so they don't persist
        setOldPassword('');
        setNewPassword('');
        setPassMsg({ type: '', text: '' });
      }, 3000);
    } catch (err) { setResetError(err.response?.data?.detail || "Failed to secure new password."); } 
    finally { setResetLoading(false); }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...resetOtp];
    newOtp[index] = element.value;
    setResetOtp(newOtp);
    if (element.nextSibling && element.value) element.nextSibling.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...resetOtp];
      if (newOtp[index] !== '') {
        newOtp[index] = '';
        setResetOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setResetOtp(newOtp);
        e.target.previousSibling.focus();
      }
    }
  };

  const handleExportExcel = () => {
    const exportData = [];
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        safeArr(sub?.divisions).forEach(div => {
          safeArr(div?.students).forEach(stu => {
            safeArr(stu?.tests).forEach(t => {
              exportData.push({
                "Major": m.name, "Subject Code": sub.code, "Subject Name": sub.name,
                "Division": div.name.replace(/^Div\s+/i, ''), "Roll Number": stu.rollNo,
                "Student Name": stu.name, "Test Name": t.name, "Obtained Marks": t.obtained, "Max Marks": t.max
              });
            });
          });
        });
      });
    });

    if (exportData.length === 0) { alert("No data to export!"); return; }
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database_Backup");
    XLSX.writeFile(wb, `UniAnalytics_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const majorsMap = {};
        
        rows.forEach((row, index) => {
          const keys = Object.keys(row).reduce((acc, k) => { acc[k.toLowerCase().trim()] = row[k]; return acc; }, {});
          const major = keys['major'] || 'Default Major';
          const subCode = keys['subject code'] || 'SUB101';
          const subName = keys['subject name'] || 'Unknown Subject';
          const div = keys['division'] || 'A';
          const rollNo = keys['roll number'] || `UNK-${index}`;
          const stuName = keys['student name'] || 'Unknown';
          const testName = keys['test name'] || 'Assessment';
          const ob = Number(keys['obtained marks']) || 0;
          const mx = Number(keys['max marks']) || 100;

          if (!majorsMap[major]) majorsMap[major] = { name: major, subjects: {} };
          if (!majorsMap[major].subjects[subCode]) majorsMap[major].subjects[subCode] = { code: subCode, name: subName, divisions: {} };
          if (!majorsMap[major].subjects[subCode].divisions[div]) majorsMap[major].subjects[subCode].divisions[div] = { name: `Div ${div}`, students: {} };
          if (!majorsMap[major].subjects[subCode].divisions[div].students[rollNo]) majorsMap[major].subjects[subCode].divisions[div].students[rollNo] = { rollNo, name: stuName, tests: [] };
          majorsMap[major].subjects[subCode].divisions[div].students[rollNo].tests.push({ name: testName, obtained: ob, max: mx });
        });

        const formattedData = Object.values(majorsMap).map(m => ({
          name: m.name, subjects: Object.values(m.subjects).map(s => ({
            code: s.code, name: s.name, divisions: Object.values(s.divisions).map(d => ({ name: d.name, students: Object.values(d.students) }))
          }))
        }));

        updateMasterData(formattedData);
        alert("Backup restored successfully!");
      } catch (err) { alert("Failed to read Excel file. Please use the exact backup format."); }
    };
    reader.readAsArrayBuffer(file);
  };

  const executeDeleteAllData = () => {
    updateMasterData([]); 
    setDeleteModal(false);
  };

  const executeDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('uni_token');
      
      if (token) {
        await fetch('https://unianalytics-api.onrender.com/api/v1/user', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });
      }

      updateMasterData([]);
      logout();
      localStorage.removeItem('uni-analytics-storage');
      localStorage.removeItem('uni_token'); 
      
      window.location.href = '/login?register=true';

    } catch (err) {
      console.error("Failed to delete account from database:", err);
      alert("Failed to delete account. Please check your connection.");
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Workspace Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2 flex-shrink-0">
          {[
            { id: 'profile', icon: User, label: 'Teacher Profile' },
            { id: 'security', icon: ShieldCheck, label: 'Password & Security' },
            { id: 'grading', icon: Sliders, label: 'Grading & Analytics' },
            { id: 'ui', icon: Monitor, label: 'System & UI' },
            { id: 'data', icon: HardDrive, label: 'Data & Backups' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-indigo-500/50'}`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] min-h-[500px]">
          
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Teacher Profile</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Your registered credentials and personal details.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Username</label><input type="text" disabled value={userName || 'Educator'} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-not-allowed"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Registered Email</label><input type="email" disabled value={userEmail || 'Not Provided'} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-not-allowed"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Date of Birth</label><input type="text" disabled value={userDOB || 'Not Provided'} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-not-allowed"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Account Role</label><input type="text" disabled value={userRole || 'Teacher'} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-not-allowed uppercase tracking-wider"/></div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><UserX size={20}/> Account Management</h3>
                <div className="p-5 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Delete Teacher Account</h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Permanently remove your profile, credentials, and completely wipe your active workspace.</p>
                  </div>
                  <button onClick={() => setDeleteAccountModal(true)} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-sm whitespace-nowrap flex items-center gap-2">
                    <Trash2 size={18}/> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Password & Security</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Update your password or recover your account.</p>
              </div>

              <div className="max-w-md">
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Current Password</label>
                    <div className="relative">
                      <input type={showPwd ? "text" : "password"} required value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 pr-12 transition-all font-medium"/>
                      <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-4 text-slate-400 hover:text-indigo-500 transition-colors">{showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">New Password</label>
                    <input type={showPwd ? "text" : "password"} required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-medium"/>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-[0_0_15px_rgba(79,70,229,0.4)]">Update Password</button>
                    
                    {/* THE FIX: Button pulses red if they enter the wrong password */}
                    <button 
                      type="button" 
                      onClick={openForgotModal} 
                      className={`text-sm font-bold transition-colors ${passMsg.type === 'error' ? 'text-red-500 hover:text-red-600 underline decoration-red-500 decoration-2 underline-offset-4 animate-pulse' : 'text-indigo-500 hover:text-indigo-600 hover:underline'}`}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  
                  {passMsg.text && (
                    <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 animate-in fade-in border ${passMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : passMsg.type === 'loading' ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400'}`}>
                      {passMsg.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0"/> : passMsg.type === 'error' ? <AlertTriangle size={18} className="mt-0.5 flex-shrink-0"/> : null}
                      <div className="flex-1">
                        <p className="text-sm font-bold">{passMsg.text}</p>
                        {/* Removed the redundant link here! */}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'grading' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Grading & Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Configure how the system analyzes and flags student performance.</p>
              </div>
              
              <div className="max-w-md">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Global Pass/Fail Threshold (%)</label>
                <div className="flex items-center gap-4">
                  <input type="number" min="0" max="100" value={passThreshold} onChange={e=>setPassThreshold(e.target.value)} className="w-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl font-bold text-xl text-center outline-none focus:ring-2 ring-indigo-500 transition-all"/>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Students scoring below this combined percentage will appear in the "At Risk" intervention list.</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Highlight Top Performers</h4>
                    <p className="text-sm font-medium text-slate-500">Visually highlight students scoring &gt; 90% with gold badges.</p>
                  </div>
                  <button onClick={() => setTopPerformerToggle(!topPerformerToggle)} className={`w-14 h-8 rounded-full transition-colors relative shadow-inner flex items-center ${topPerformerToggle ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full absolute transition-transform transform shadow-sm ${topPerformerToggle ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <button 
                  onClick={() => {
                    setSaveNotify(true);
                    setTimeout(() => setSaveNotify(false), 2000);
                  }}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform"
                >
                  Save Configurations
                </button>
                {saveNotify && <span className="text-emerald-500 font-bold animate-in fade-in flex items-center gap-2"><CheckCircle2 size={18}/> Saved!</span>}
              </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">System & UI</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Customize your workspace appearance and layout.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Force Dark Mode</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">Keep the dashboard in dark mode regardless of OS settings.</p>
                  </div>
                  <button onClick={toggleDarkMode} className={`w-14 h-8 rounded-full transition-colors relative shadow-inner flex items-center ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full absolute transition-transform transform shadow-sm ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Enable Focus Mode</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">Automatically hide the side navigation menu when logging in to maximize workspace.</p>
                  </div>
                  <button onClick={() => setFocusMode(!focusMode)} className={`w-14 h-8 rounded-full transition-colors relative shadow-inner flex items-center ${focusMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full absolute transition-transform transform shadow-sm ${focusMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Data Management</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Export, import, or completely wipe your workspace database.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl flex flex-col justify-between transition-colors">
                  <div>
                    <h4 className="font-extrabold text-lg text-indigo-900 dark:text-indigo-400 mb-2 flex items-center gap-2"><Download size={20}/> Export to Excel</h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">Download a perfectly formatted .xlsx file containing all your majors, subjects, divisions, and student marks.</p>
                  </div>
                  <button onClick={handleExportExcel} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-[0_4px_15px_rgba(79,70,229,0.3)]">Download .XLSX Backup</button>
                </div>

                <div className="p-6 border border-emerald-100 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl flex flex-col justify-between transition-colors">
                  <div>
                    <h4 className="font-extrabold text-lg text-emerald-900 dark:text-emerald-400 mb-2 flex items-center gap-2"><Upload size={20}/> Import Backup</h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">Restore your workspace from a previously exported UniAnalytics .xlsx backup file.</p>
                  </div>
                  <input type="file" accept=".xlsx" className="hidden" ref={fileInputRef} onChange={handleImportExcel}/>
                  <button onClick={() => fileInputRef.current.click()} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-[0_4px_15px_rgba(16,185,129,0.3)]">Select Excel File</button>
                </div>
              </div>

              <div className="mt-8 p-6 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-3xl transition-colors">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h4 className="font-extrabold text-lg text-red-600 dark:text-red-400 mb-1 flex items-center gap-2"><AlertTriangle size={20}/> Danger Zone</h4>
                    <p className="text-sm font-bold text-red-500/80 dark:text-red-400/80">Permanently delete ALL data in your current workspace.</p>
                  </div>
                  <button onClick={()=>setDeleteModal(true)} className="px-6 py-3 bg-red-100 dark:bg-red-500/20 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-red-200 dark:border-red-500/50 whitespace-nowrap shadow-sm"><Trash2 size={18}/> Delete All Data</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS BELOW (Forgot Password, Delete DB, Delete Account) */}
      {forgotModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 relative animate-in zoom-in-95">
              <button onClick={()=>setForgotModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-900 rounded-full transition-colors"><X size={18}/></button>
              
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 text-center">Account Recovery</h2>
              
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOTP} className="space-y-4 mt-6 animate-in slide-in-from-right-4">
                  <p className="text-sm font-medium text-slate-500 text-center mb-4">Verify your email to receive a secure OTP code.</p>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                      <input required type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="teacher@university.edu" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"/>
                    </div>
                  </div>
                  <button type="submit" disabled={resetLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                    {resetLoading ? 'Sending...' : 'Send Verification Code'} <ArrowRight size={18}/>
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyCode} className="space-y-6 mt-6 animate-in slide-in-from-right-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 rounded-xl text-center">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Code sent to <strong>{resetEmail}</strong></p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block text-center">Enter 6-Digit Code</label>
                    <div className="flex justify-between gap-2">
                      {resetOtp.map((data, index) => (
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
                  </div>
                  <button type="submit" disabled={resetLoading || resetOtp.join('').length < 6} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-bold transition-colors">
                    {resetLoading ? 'Verifying...' : 'Verify Identity'}
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-6 mt-6 animate-in slide-in-from-right-4">
                  <p className="text-sm font-medium text-slate-500 text-center mb-4">Identity verified. Please create a new password.</p>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                      <input required type={showPwd ? "text" : "password"} value={resetNewPass} onChange={e=>setResetNewPass(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"/>
                      <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-4 text-slate-400 hover:text-indigo-500 transition-colors">{showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                    </div>
                  </div>
                  <button type="submit" disabled={resetLoading || resetNewPass.length < 6} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {resetLoading ? 'Encrypting...' : 'Secure & Save Password'}
                  </button>
                </form>
              )}

              {forgotStep === 4 && (
                <div className="py-8 text-center animate-in zoom-in">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]"><CheckCircle2 size={40}/></div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Password Secured!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Closing recovery window...</p>
                </div>
              )}

              {resetError && <p className="text-center text-sm font-bold text-red-500 mt-6 bg-red-50 dark:bg-red-500/10 py-2 rounded-lg animate-in fade-in">{resetError}</p>}
           </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-[0_10px_40px_rgba(239,68,68,0.2)] border border-red-100 dark:border-red-900/50 text-center animate-in zoom-in-95 transition-colors">
              <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={48}/></div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Wipe Database?</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">This will instantly wipe ALL active workspace data. Your account remains, but records are lost. This cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={()=>setDeleteModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button onClick={executeDeleteAllData} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors">Yes, Delete Data</button>
              </div>
           </div>
        </div>
      )}

      {deleteAccountModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-[0_10px_40px_rgba(239,68,68,0.2)] border border-red-100 dark:border-red-900/50 text-center animate-in zoom-in-95 transition-colors">
              <div className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(239,68,68,0.5)]"><UserX size={48}/></div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Delete Account?</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">This action is permanent. Your profile, settings, and all workspace records will be utterly destroyed and you will be signed out.</p>
              <div className="flex gap-4">
                <button onClick={()=>setDeleteAccountModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button onClick={executeDeleteAccount} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors">Nuke Account</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;