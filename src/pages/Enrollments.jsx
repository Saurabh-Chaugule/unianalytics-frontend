/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Users } from 'lucide-react';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const Enrollments = () => {
  const navigate = useNavigate();
  const { globalData } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const allStudents = useMemo(() => {
    let map = {};
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        safeArr(sub?.divisions).forEach(div => {
          safeArr(div?.students).forEach(s => {
            if (!map[s.rollNo]) {
              map[s.rollNo] = { id: s.rollNo, name: s.name, rollNo: s.rollNo, majors: new Set(), divs: new Set() };
            }
            map[s.rollNo].majors.add(m.name);
            const cleanDiv = (div?.name || '').replace(/^Div\s+/i, '');
            map[s.rollNo].divs.add(`${sub.code} (Div ${cleanDiv})`);
          });
        });
      });
    });
    
    return Object.values(map).map(s => ({
      ...s,
      majorStr: Array.from(s.majors).join(', '),
      divStr: Array.from(s.divs).join(', ')
    })).sort((a, b) => a.rollNo.localeCompare(b.rollNo));
  }, [globalData]);

  const filtered = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 fade-in pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold mb-2 transition-colors"><ArrowLeft size={18} /> <span>Back</span></button>
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-normal flex gap-3 text-slate-900 dark:text-white items-center"><Users className="text-brand-blue" size={32} /> Master Student Directory</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 relative"><Search className="absolute left-10 top-9 text-slate-400" size={20}/><input type="text" placeholder="Search Directory by Roll No or Name..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none font-semibold focus:ring-2 ring-indigo-500 transition-all text-base"/></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-extrabold tracking-widest">
              <tr><th className="px-6 py-5">Roll No</th><th className="px-6 py-5">Student Name</th><th className="px-6 py-5">Academic Context</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold text-lg">No students found.</td></tr> : filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <td className="px-6 py-5 font-mono font-extrabold text-slate-500 dark:text-slate-400 text-base">{s.rollNo}</td>
                <td className="px-6 py-5"><div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{s.name}</div></td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 dark:border-indigo-500/30 shadow-sm">{s.majorStr}</span>
                    <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-500/30 shadow-sm">{s.divStr}</span>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Enrollments;