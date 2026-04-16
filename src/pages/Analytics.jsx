/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, BarChart2, Search } from 'lucide-react';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const Analytics = () => {
  const navigate = useNavigate();
  const { globalData } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const subjectStats = useMemo(() => {
    let stats = [];
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        let totalMarks = 0; let marksCount = 0; let highest = 0; let lowest = 100; let studentCount = 0;
        
        safeArr(sub?.divisions).forEach(div => {
          safeArr(div?.students).forEach(s => {
            studentCount++;
            let stObtained = 0; let stMax = 0;
            safeArr(s?.tests).forEach(t => { 
              stObtained += t.obtained || 0; 
              stMax += t.max || 0; 
            });
            let p = stMax > 0 ? (stObtained/stMax)*100 : 0;
            if(p > highest) highest = p;
            if(p < lowest) lowest = p;
            totalMarks += stObtained; marksCount += stMax;
          });
        });
        
        if(lowest === 100 && studentCount === 0) lowest = 0;
        let avg = marksCount > 0 ? ((totalMarks/marksCount)*100).toFixed(1) : 0;
        stats.push({ subject: `${sub.name} (${sub.code})`, avgMarks: avg, highest: highest.toFixed(1), lowest: lowest.toFixed(1), totalStudents: studentCount });
      });
    });
    return stats;
  }, [globalData]);

  // THE FIX: Filter analytics based on search input
  const filteredStats = subjectStats.filter(stat => 
    stat.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold transition-colors">
        <ArrowLeft size={18} /> <span>Back</span>
      </button>
      <div>
        <h1 className="text-3xl font-extrabold flex gap-3 text-slate-900 dark:text-white">
          <Award className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" size={32} /> 
          Subject-Wise Marks Analysis
        </h1>
      </div>

      {/* THE FIX: Search Bar */}
      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
        <input 
          type="text" 
          placeholder="Search subjects by name or code..." 
          value={searchTerm} 
          onChange={e=>setSearchTerm(e.target.value)} 
          className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl outline-none font-semibold focus:ring-2 ring-indigo-500 transition-all text-base shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {subjectStats.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg col-span-3 text-center py-10">No data available.</p>
        ) : filteredStats.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg col-span-3 text-center py-10">No subjects match your search.</p>
        ) : (
          filteredStats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 group animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors pr-4">{stat.subject}</h3>
                <BarChart2 className="text-indigo-400 dark:text-indigo-500 group-hover:scale-110 transition-transform mt-1 flex-shrink-0" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-bold text-sm">Class Average</span><span className="font-extrabold text-2xl text-indigo-600 dark:text-indigo-400">{stat.avgMarks}%</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-bold text-sm">Highest Mark</span><span className="font-extrabold text-lg text-emerald-500 dark:text-emerald-400">{stat.highest}%</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 font-bold text-sm">Lowest Mark</span><span className="font-extrabold text-lg text-red-500 dark:text-red-400">{stat.lowest}%</span></div>
                <div className="pt-5 mt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center"><span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Graded</span><span className="font-extrabold text-slate-900 dark:text-white">{stat.totalStudents} Students</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Analytics;