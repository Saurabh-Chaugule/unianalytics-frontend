/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Filter, X } from 'lucide-react';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const AtRisk = () => {
  const navigate = useNavigate();
  const { globalData, passThreshold } = useStore();
  
  // --- FILTER STATE ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [fMajor, setFMajor] = useState('All');
  const [fSub, setFSub] = useState('All');
  const [fDiv, setFDiv] = useState('All');
  const [fTest, setFTest] = useState('All');

  const handleMajorChange = (e) => { setFMajor(e.target.value); setFSub('All'); setFDiv('All'); setFTest('All'); };
  const handleSubChange = (e) => { setFSub(e.target.value); setFDiv('All'); setFTest('All'); };
  const handleDivChange = (e) => { setFDiv(e.target.value); setFTest('All'); };

  // --- CASCADING DROPDOWN LISTS ---
  const mList = ['All', ...new Set(safeArr(globalData?.majors).map(m => m.name))];
  const sList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).map(s => s.code))];
  const dList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).map(d => d.name))];
  const tList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).filter(d => fDiv === 'All' || d.name === fDiv).flatMap(d => safeArr(d?.students)).flatMap(st => safeArr(st?.tests)).map(t => t.name))];

  // --- STRICT MATH ENGINE ---
  const atRiskStudents = useMemo(() => {
    let list = [];
    safeArr(globalData?.majors).forEach(m => {
      if (fMajor !== 'All' && m.name !== fMajor) return;
      
      safeArr(m?.subjects).forEach(sub => {
        if (fSub !== 'All' && sub.code !== fSub) return;
        
        safeArr(sub?.divisions).forEach(div => {
          if (fDiv !== 'All' && div.name !== fDiv) return;
          
          safeArr(div?.students).forEach(s => {
            let ob = 0; let mx = 0;
            let worstTest = { name: 'N/A', p: 100, ob: 0, mx: 0 };
            let validTestFound = false;
            
            safeArr(s?.tests).forEach(t => {
              if (fTest !== 'All' && t.name !== fTest) return;
              
              validTestFound = true;
              ob += t.obtained || 0; 
              mx += t.max || 0;
              let p = t.max > 0 ? (t.obtained/t.max)*100 : 0;
              if(p < worstTest.p) {
                worstTest = { name: t.name, p, ob: t.obtained, mx: t.max };
              }
            });
            
            if (validTestFound && mx > 0) {
              let overall = (ob/mx)*100;
              if(overall < passThreshold) {
                const cleanDiv = (div?.name || '').replace(/^Div\s+/i, '');
                list.push({ 
                  id: `${s.rollNo}-${sub.code}`, 
                  rollNo: s.rollNo, 
                  name: s.name, 
                  major: m.name,
                  subject: sub.name,
                  subCode: sub.code,
                  div: cleanDiv,
                  failingTest: worstTest.name, 
                  marks: `${worstTest.ob} / ${worstTest.mx}`,
                  percentage: worstTest.p.toFixed(1),
                  overallPercentage: overall
                });
              }
            }
          });
        });
      });
    });
    
    // Sort by whoever is doing the worst overall
    return list.sort((a, b) => a.overallPercentage - b.overallPercentage);
  }, [globalData, passThreshold, fMajor, fSub, fDiv, fTest]);

  // THE FIX: DOM Rendering Limit (Anti-Lag for massive datasets)
  const displayedAtRisk = atRiskStudents.slice(0, 100);

  return (
    <div className="space-y-6 fade-in pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold mb-2 transition-colors">
        <ArrowLeft size={18} /> <span>Back</span>
      </button>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex gap-3 text-slate-900 dark:text-white items-center">
            <AlertTriangle className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={32} /> 
            Intervention Required
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Students scoring below {passThreshold}% combined across selected tests.
          </p>
        </div>

        {/* ADVANCED FILTER BUTTON & MODAL */}
        <div className="relative z-20">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:scale-105 ${isFilterOpen || fMajor!=='All' || fSub!=='All' || fDiv!=='All' || fTest!=='All' ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-500 animate-wave text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-500/50'}`}>
            <Filter size={18} /><span>Advanced Filter</span>
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-6 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-extrabold text-lg dark:text-white">Comb Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-full p-2"><X size={18}/></button>
              </div>
              <div className="space-y-4 mb-8">
                <div><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Major</label><select value={fMajor} onChange={handleMajorChange} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 ring-red-500 transition-all">{mList.map(m=><option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m}</option>)}</select></div>
                <div><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Subject</label><select value={fSub} onChange={handleSubChange} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 ring-red-500 transition-all">{sList.map(s=><option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{s}</option>)}</select></div>
                <div><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Division</label><select value={fDiv} onChange={handleDivChange} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 ring-red-500 transition-all">{dList.map(d=><option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{d === 'All' ? 'All' : (d.toLowerCase().startsWith('div') ? d : `Div ${d}`)}</option>)}</select></div>
                <div><label className="text-[10px] font-extrabold text-red-500 dark:text-red-400 uppercase tracking-widest block mb-1">Specific Test</label><select value={fTest} onChange={e=>setFTest(e.target.value)} className="w-full p-3 border border-red-200 dark:border-red-900/50 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-extrabold outline-none focus:ring-2 ring-red-500 transition-all">{tList.map(t=><option key={t} value={t} className="bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-bold">{t}</option>)}</select></div>
              </div>
              <div className="flex gap-3"><button onClick={() => { setFMajor('All'); setFSub('All'); setFDiv('All'); setFTest('All'); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Reset Filters</button></div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(239,68,68,0.15)] overflow-hidden mt-6 relative z-10">
        
        {/* WARNING BANNER FOR MASSIVE LISTS */}
        {atRiskStudents.length > 100 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-3 text-center text-sm font-bold border-b border-amber-100 dark:border-amber-900/50">
            Showing top 100 of {atRiskStudents.length.toLocaleString()} at-risk students. Use the advanced filter to narrow this list.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 uppercase text-[11px] font-extrabold tracking-widest border-b border-red-100 dark:border-red-900/50">
              <tr>
                <th className="px-6 py-5">Roll No</th>
                <th className="px-6 py-5">Student Name</th>
                <th className="px-6 py-5">Academic Context</th>
                <th className="px-6 py-5">Worst Test</th>
                <th className="px-6 py-5 text-right">Worst Test Marks (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {displayedAtRisk.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-emerald-500 dark:text-emerald-400 font-extrabold text-lg flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">🎉</span>
                    No students currently at risk with these filters!
                  </td>
                </tr>
              ) : (
                displayedAtRisk.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-5 font-mono font-extrabold text-slate-500 dark:text-slate-400 text-base">{student.rollNo}</td>
                    <td className="px-6 py-5 font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{student.name}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {student.subject} <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs ml-1">({student.subCode})</span>
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 shadow-sm">{student.major}</span>
                          <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-700/50 shadow-sm">Div {student.div}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 dark:border-red-500/30 shadow-sm">
                        {student.failingTest}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="font-extrabold text-xl text-red-500 dark:text-red-400">{student.marks}</div>
                      <div className="text-xs font-bold text-red-400 dark:text-red-500 mt-1">{student.percentage}%</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtRisk;