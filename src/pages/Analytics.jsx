/* eslint-disable */
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import useStore from '../store/useStore';
import Loader from '../components/layout/Loader';

const safeArr = (val) => Array.isArray(val) ? val : [];

const Analytics = () => {
  const { globalData, passThreshold } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  const [fMajor, setFMajor] = useState('All');
  const [fSub, setFSub] = useState('All');
  const [fDiv, setFDiv] = useState('All');
  const [fTest, setFTest] = useState('All');

  useEffect(() => {
    // Clean 0.6s loading state for UI polish
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleMajorChange = (e) => { setFMajor(e.target.value); setFSub('All'); setFDiv('All'); setFTest('All'); };
  const handleSubChange = (e) => { setFSub(e.target.value); setFDiv('All'); setFTest('All'); };
  const handleDivChange = (e) => { setFDiv(e.target.value); setFTest('All'); };

  const mList = ['All', ...new Set(safeArr(globalData?.majors).map(m => m.name))];
  const sList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).map(s => s.code))];
  const dList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).map(d => d?.name?.replace(/^Div\s+/i, '')))];
  const tList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).filter(d => fDiv === 'All' || d.name === fDiv || d?.name?.replace(/^Div\s+/i, '') === fDiv).flatMap(d => safeArr(d?.students)).flatMap(st => safeArr(st?.tests)).map(t => t.name))];

  // STRICT FUNNEL MATH ENGINE
  const stats = useMemo(() => {
    let totalEnrolled = 0;
    let failingCount = 0;
    let combinedObtained = 0;
    let combinedMax = 0;
    let gradeCounts = { A: 0, B: 0, C: 0, F: 0 };
    let testScores = {}; 

    safeArr(globalData?.majors).forEach(m => {
      if (fMajor !== 'All' && m.name !== fMajor) return; 

      safeArr(m?.subjects).forEach(sub => {
        if (fSub !== 'All' && sub.code !== fSub) return; 

        safeArr(sub?.divisions).forEach(div => {
          const cleanDiv = (div?.name || '').replace(/^Div\s+/i, '');
          if (fDiv !== 'All' && cleanDiv !== fDiv) return; 

          safeArr(div?.students).forEach(s => {
            let sObtained = 0;
            let sMax = 0;
            let validTestFound = false;

            safeArr(s?.tests).forEach(t => {
              if (fTest !== 'All' && t.name !== fTest) return; 

              validTestFound = true;
              const ob = t.obtained || 0;
              const mx = t.max || 0;
              sObtained += ob;
              sMax += mx;
              combinedObtained += ob;
              combinedMax += mx;

              if (!testScores[t.name]) testScores[t.name] = { name: t.name, totalObtained: 0, totalMax: 0 };
              testScores[t.name].totalObtained += ob;
              testScores[t.name].totalMax += mx;
            });

            if (validTestFound) {
              totalEnrolled++;
              if (sMax > 0) {
                const p = (sObtained / sMax) * 100;
                if (p < passThreshold) { failingCount++; gradeCounts.F++; }
                else if (p >= 85) gradeCounts.A++;
                else if (p >= 60) gradeCounts.B++;
                else gradeCounts.C++;
              }
            }
          });
        });
      });
    });

    const sysAvg = combinedMax > 0 ? ((combinedObtained / combinedMax) * 100).toFixed(1) : 0;
    
    const chartData = Object.values(testScores).map(ts => ({
      name: ts.name,
      avg: ts.totalMax > 0 ? parseFloat(((ts.totalObtained / ts.totalMax) * 100).toFixed(1)) : 0
    }));

    const pieData = [
      { name: 'A (Excellent)', value: gradeCounts.A, color: '#6366f1' },
      { name: 'B (Good)', value: gradeCounts.B, color: '#10b981' },
      { name: 'C (Average)', value: gradeCounts.C, color: '#f59e0b' },
      { name: 'F (Needs Help)', value: gradeCounts.F, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return { totalEnrolled, sysAvg, failingCount, chartData, pieData };
  }, [globalData, fMajor, fSub, fDiv, fTest, passThreshold]);

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-8 fade-in pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Total Enrollments</p>
          <div className="flex items-baseline gap-2"><h2 className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalEnrolled}</h2><span className="text-xs font-bold text-slate-400">Filtered</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Active Subjects</p>
          <div className="flex items-baseline gap-2"><h2 className="text-4xl font-black text-slate-900 dark:text-white">{fSub === 'All' ? sList.length - 1 : 1}</h2><span className="text-xs font-bold text-slate-400">In View</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">System Avg Marks</p>
          <div className="flex items-baseline gap-2"><h2 className="text-4xl font-black text-emerald-500">{stats.sysAvg}%</h2><span className="text-xs font-bold text-slate-400">Combined</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full"></div>
          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">At-Risk Students</p>
          <div className="flex items-baseline gap-2"><h2 className="text-4xl font-black text-red-500">{stats.failingCount}</h2><span className="text-xs font-bold text-slate-400">Failing (&lt;{passThreshold}%)</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Granular Data Explorer</h2>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select value={fMajor} onChange={handleMajorChange} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"><option value="All">Major: All</option>{mList.filter(m=>m!=='All').map(m=><option key={m} value={m}>{m}</option>)}</select>
            <select value={fSub} onChange={handleSubChange} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"><option value="All">Sub: All</option>{sList.filter(s=>s!=='All').map(s=><option key={s} value={s}>{s}</option>)}</select>
            <select value={fDiv} onChange={handleDivChange} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"><option value="All">Div: All</option>{dList.filter(d=>d!=='All').map(d=><option key={d} value={d}>Div {d}</option>)}</select>
            <select value={fTest} onChange={e=>setFTest(e.target.value)} className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-900/20 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"><option value="All">Test: All</option>{tList.filter(t=>t!=='All').map(t=><option key={t} value={t}>{t}</option>)}</select>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest text-center mb-8">Test Performance Trends (Marks %)</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={35}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} domain={[0, 100]} dx={-10}/>
                  <Tooltip cursor={{fill: '#334155', opacity: 0.05}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold'}} itemStyle={{color: '#4f46e5'}}/>
                  <Bar dataKey="avg" fill="url(#colorAvg)" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700/50 pt-10 lg:pt-0 pl-0 lg:pl-10">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Grade Distribution</h3>
            {stats.pieData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400 font-bold">No Data Available</div>
            ) : (
              <div className="h-[280px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.pieData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {stats.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold'}}/>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalEnrolled}</span>
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Graded</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;