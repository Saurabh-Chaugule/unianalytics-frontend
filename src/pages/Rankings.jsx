/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Trophy, Filter, X } from 'lucide-react';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const Rankings = () => {
  const navigate = useNavigate();
  // THE FIX: Pull topPerformerToggle from the store
  const { globalData, topPerformerToggle } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [fMajor, setFMajor] = useState('All');
  const [fSub, setFSub] = useState('All');
  const [fDiv, setFDiv] = useState('All');
  const [fTest, setFTest] = useState('All');
  const [minMarks, setMinMarks] = useState(0);

  const handleMajorChange = (e) => { setFMajor(e.target.value); setFSub('All'); setFDiv('All'); setFTest('All'); };
  const handleSubChange = (e) => { setFSub(e.target.value); setFDiv('All'); setFTest('All'); };
  const handleDivChange = (e) => { setFDiv(e.target.value); setFTest('All'); };

  const allStudents = useMemo(() => {
    let list = [];
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        safeArr(sub?.divisions).forEach(div => {
          safeArr(div?.students).forEach(s => {
            let tOb = 0; let tMx = 0; 
            let testDetails = [];
            
            safeArr(s?.tests).forEach(t => { 
              if(fTest === 'All' || t.name === fTest) { 
                tOb += t.obtained || 0; 
                tMx += t.max || 0; 
                testDetails.push({ name: t.name, ob: t.obtained || 0, mx: t.max || 0 });
              }
            });
            
            if(tMx > 0) {
              const cleanDiv = (div?.name || '').replace(/^Div\s+/i, '');
              list.push({ 
                id: `${s.rollNo}-${sub.code}`, 
                name: s.name, 
                rollNo: s.rollNo, 
                major: m.name, 
                subject: sub.code, 
                div: cleanDiv, 
                testDetails: testDetails,
                marks: tOb, 
                max: tMx, 
                p: (tOb/tMx)*100 
              });
            }
          });
        });
      });
    });
    return list;
  }, [globalData, fTest]);

  const filtered = allStudents
    .filter(s => fMajor === 'All' || s.major === fMajor)
    .filter(s => fSub === 'All' || s.subject === fSub)
    .filter(s => fDiv === 'All' || s.div === fDiv || s.div === fDiv.replace(/^Div\s+/i, ''))
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(s => s.p >= minMarks)
    .sort((a,b) => b.p - a.p).map((s, i) => ({...s, rank: i+1}));

  const mList = ['All', ...new Set(safeArr(globalData?.majors).map(m => m.name))];
  const sList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).map(s => s.code))];
  const dList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).map(d => d?.name?.replace(/^Div\s+/i, '')))];
  const tList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).filter(d => fDiv === 'All' || d.name === fDiv || d?.name?.replace(/^Div\s+/i, '') === fDiv).flatMap(d => safeArr(d?.students)).flatMap(st => safeArr(st?.tests)).map(t => t.name))];

  return (
    <div className="space-y-6 fade-in pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold mb-2 transition-colors"><ArrowLeft size={18} /> <span>Back</span></button>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
      <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900 dark:text-white">
        <Trophy className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" size={32} /> 
        Student Rankings
      </h1>
      <div className="relative">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:scale-105 ${isFilterOpen || fMajor!=='All' || fSub!=='All' || fDiv!=='All' || fTest!=='All' || minMarks > 0 ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400 animate-wave text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'}`}><Filter size={18} /><span>Advanced Filter</span></button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 p-6 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-3"><h3 className="font-extrabold text-lg dark:text-white">Comb Filters</h3><button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-full p-2"><X size={18}/></button></div>
              <div className="space-y-4 mb-8">
                <div><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Major</label><select value={fMajor} onChange={handleMajorChange} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all">{mList.map(m=><option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m}</option>)}</select></div>
                <div><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Subject</label><select value={fSub} onChange={handleSubChange} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all">{sList.map(s=><option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{s}</option>)}</select></div>
                <div><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Division</label><select value={fDiv} onChange={handleDivChange} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all">{dList.map(d=><option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{d}</option>)}</select></div>
                <div><label className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-1">Specific Test</label><select value={fTest} onChange={e=>setFTest(e.target.value)} className="w-full p-3 border border-indigo-200 dark:border-indigo-500/50 rounded-xl text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-extrabold outline-none focus:ring-2 ring-sky-500 transition-all">{tList.map(t=><option key={t} value={t} className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-bold">{t}</option>)}</select></div>
                <div className="pt-3">
                  <div className="flex justify-between mb-2"><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Min Percentage</label><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/30">{minMarks}% +</span></div>
                  <input type="range" min="0" max="100" value={minMarks} onChange={(e) => setMinMarks(Number(e.target.value))} className="w-full accent-indigo-500"/>
                </div>
              </div>
              <div className="flex gap-3"><button onClick={() => { setFMajor('All'); setFSub('All'); setFDiv('All'); setFTest('All'); setMinMarks(0); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Reset All</button></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 relative"><Search className="absolute left-10 top-9 text-slate-400" size={20}/><input type="text" placeholder="Search Roll No or Name..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none font-semibold focus:ring-2 ring-indigo-500 transition-all text-base"/></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-extrabold tracking-widest"><tr><th className="px-6 py-5">Rank</th><th className="px-6 py-5">Roll No & Name</th><th className="px-6 py-5">Academic Context</th><th className="px-6 py-5 text-right">Combined Marks (%)</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">{filtered.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold text-lg">No rankings match filters.</td></tr> : filtered.map(s => (
            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
              <td className="px-6 py-5 align-top"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base transition-transform group-hover:scale-110 ${s.rank === 1 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : s.rank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-md' : s.rank === 3 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>{s.rank}</div></td>
              
              <td className="px-6 py-5 align-top">
                <div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{s.name}</div>
                <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-1 mb-1">{s.rollNo}</div>
                
                {/* THE FIX: Show Gold Badge if Top Performer feature is ON and they score 90+ */}
                {topPerformerToggle && s.p >= 90 && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-extrabold border border-amber-200 dark:border-amber-700/50 shadow-sm mt-1">
                    ⭐ Top Performer
                  </span>
                )}
              </td>
              
              <td className="px-6 py-5">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">{s.major}</span>
                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">{s.subject} (Div {s.div})</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {s.testDetails.map((td, index) => (
                      <span key={index} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded text-[11px] font-extrabold border border-indigo-200 dark:border-indigo-500/50 shadow-sm">
                        {td.name}: {td.ob} / {td.mx}
                      </span>
                    ))}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-right align-top"><div className="font-extrabold text-xl text-slate-900 dark:text-white">{s.marks} <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/ {s.max}</span></div><div className={`text-xs font-extrabold mt-1 ${s.p >= 75 ? 'text-emerald-500 dark:text-emerald-400' : s.p >= 60 ? 'text-indigo-500 dark:text-indigo-400' : s.p >= 40 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>{s.p.toFixed(1)}%</div></td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  );
};
export default Rankings;