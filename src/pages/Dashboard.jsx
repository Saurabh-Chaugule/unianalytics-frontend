/* eslint-disable */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, Award, Trash2, DatabaseZap, X, Trophy } from 'lucide-react';
import useStore from '../store/useStore';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

const safeArr = (val) => Array.isArray(val) ? val : [];

const MetricCard = ({ title, value, subtext, icon: Icon, onClick }) => (
  <div onClick={onClick} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(79,70,229,0.2)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] group">
    <div className="flex justify-between mb-4"><div className="p-3 bg-brand-blue/10 dark:bg-indigo-500/20 rounded-xl text-brand-blue dark:text-indigo-400 transition-transform group-hover:scale-110 group-hover:rotate-3"><Icon size={24} /></div></div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
    <div className="flex items-end space-x-2"><h3 className="text-3xl font-medium text-slate-900 dark:text-white">{value}</h3><span className="text-sm font-normal text-slate-400 dark:text-slate-500 mb-1">{subtext}</span></div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { globalData, deleteActivity, deleteAllActivities, userName } = useStore();
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [greeting, setGreeting] = useState('');

  const firstName = userName ? userName.split(' ')[0] : 'Educator';

  useEffect(() => {
    const greetings = [
      "Ready to analyze student performance?",
      "Let's crunch some academic numbers!",
      "Your workspace insights are ready.",
      "Data is looking good today!"
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  const [fMajor, setFMajor] = useState('All');
  const [fSub, setFSub] = useState('All');
  const [fDiv, setFDiv] = useState('All');
  const [fTest, setFTest] = useState('All'); 

  // EXACT CASCADING RESET LOGIC
  const handleMajorChange = (e) => { setFMajor(e.target.value); setFSub('All'); setFDiv('All'); setFTest('All'); };
  const handleSubChange = (e) => { setFSub(e.target.value); setFDiv('All'); setFTest('All'); };
  const handleDivChange = (e) => { setFDiv(e.target.value); setFTest('All'); };

  const stats = useMemo(() => {
    let totalStudents = 0; let totalCourses = 0; let totalMarks = 0; let marksCount = 0; let atRiskCount = 0;
    
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        totalCourses++;
        safeArr(sub?.divisions).forEach(div => {
          totalStudents += safeArr(div?.students).length;
          safeArr(div?.students).forEach(student => {
            let sOb = 0; let sMx = 0;
            safeArr(student?.tests).forEach(t => { 
              sOb += t.obtained || 0; 
              sMx += t.max || 0; 
              totalMarks += t.obtained || 0; 
              marksCount += t.max || 0; 
            });
            if (sMx > 0 && (sOb/sMx)*100 < 40) atRiskCount++;
          });
        });
      });
    });
    
    return { totalStudents, totalCourses, avgMarks: marksCount > 0 ? ((totalMarks/marksCount)*100).toFixed(1) : 0, atRiskCount };
  }, [globalData]);

  // THE FIX: 1:1 EXACT STRING MATCHING MATH ENGINE
  const chartData = useMemo(() => {
    let testMap = {}; let gradeCounts = { A: 0, B: 0, C: 0, F: 0 };
    let totalGraded = 0;
    
    safeArr(globalData?.majors).forEach(m => { 
      if(fMajor !== 'All' && m.name !== fMajor) return;
      safeArr(m?.subjects).forEach(sub => { 
        if(fSub !== 'All' && sub.code !== fSub) return;
        safeArr(sub?.divisions).forEach(div => { 
          if(fDiv !== 'All' && div.name !== fDiv) return; // Exact match, no stripping
          
          safeArr(div?.students).forEach(student => {
            let sOb = 0; let sMx = 0;
            let validTestFound = false;

            safeArr(student?.tests).forEach(test => {
              if(fTest !== 'All' && test.name !== fTest) return; // Exact match
              
              validTestFound = true;
              if(!testMap[test.name]) testMap[test.name] = { ob: 0, mx: 0 };
              testMap[test.name].ob += test.obtained || 0; 
              testMap[test.name].mx += test.max || 0;
              sOb += test.obtained || 0; 
              sMx += test.max || 0;
            });

            if(validTestFound && sMx > 0) {
              totalGraded++;
              let p = (sOb/sMx)*100;
              if(p >= 75) gradeCounts.A++; else if(p >= 60) gradeCounts.B++; else if(p >= 40) gradeCounts.C++; else gradeCounts.F++;
            }
          });
        });
      });
    });
    
    const perf = Object.keys(testMap).map(k => ({ month: k, marks: Number(((testMap[k].ob/testMap[k].mx)*100).toFixed(1)) }));
    const dist = [ {name: 'A (Excellent)', value: gradeCounts.A}, {name: 'B (Good)', value: gradeCounts.B}, {name: 'C (Average)', value: gradeCounts.C}, {name: 'F (Needs Help)', value: gradeCounts.F} ].filter(d => d.value > 0);
    return { perf, dist, totalGraded };
  }, [globalData, fMajor, fSub, fDiv, fTest]);

  // THE FIX: CASCADING LIST GENERATION
  const majorsList = ['All', ...new Set(safeArr(globalData?.majors).map(m => m.name))];
  const subsList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).map(s => s.code))];
  const divsList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).map(d => d.name))];
  const testsList = ['All', ...new Set(safeArr(globalData?.majors).filter(m => fMajor === 'All' || m.name === fMajor).flatMap(m => safeArr(m?.subjects)).filter(s => fSub === 'All' || s.code === fSub).flatMap(s => safeArr(s?.divisions)).filter(d => fDiv === 'All' || d.name === fDiv).flatMap(d => safeArr(d?.students)).flatMap(st => safeArr(st?.tests)).map(t => t.name))];

  return (
    <div className="space-y-6 fade-in pb-10">
      <style>{`
        @keyframes welcomeGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-welcome-wave {
          background: linear-gradient(-45deg, #e11d48, #f59e0b, #4f46e5, #10b981, #e11d48);
          background-size: 300% 300%;
          animation: welcomeGlow 6s ease-in-out infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors">
        <div className="animate-in fade-in-up duration-500">
          <h1 className="text-5xl font-normal leading-tight text-slate-900 dark:text-white">
            Welcome, <span className="animate-welcome-wave">{firstName}!</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xl mt-2">{greeting}</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/rankings')} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] hover:scale-105 transition-transform flex items-center gap-2">
            <Trophy size={18}/> View Rankings
          </button>
        </div>
      </div>
      
      {safeArr(globalData?.majors).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 mt-8 text-center animate-in zoom-in bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_rgba(99,102,241,0.15)] transition-colors">
          <DatabaseZap size={56} className="text-indigo-500 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"/>
          <h2 className="text-2xl font-medium dark:text-white mb-2">Workspace Empty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Your database currently has no records. Let's fix that!</p>
          <button onClick={() => navigate('/add-data')} className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-medium shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-105 transition-transform">
            Go to Add Data Hub
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard title="Total Enrollments" value={stats.totalStudents} subtext="System Wide" icon={Users} onClick={() => navigate('/enrollments')} />
            <MetricCard title="Active Subjects" value={stats.totalCourses} subtext="System Wide" icon={BookOpen} onClick={() => navigate('/courses')} />
            <MetricCard title="System Avg Marks" value={`${stats.avgMarks}%`} subtext="Combined Test Avg" icon={Award} onClick={() => navigate('/analytics')} />
            <MetricCard title="At-Risk Students" value={stats.atRiskCount} subtext="Failing (<40%)" icon={TrendingUp} onClick={() => navigate('/at-risk')} />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] transition-colors">
            <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white whitespace-nowrap">Granular Data Explorer</h3>
              <div className="flex flex-wrap gap-2 justify-end">
                <select value={fMajor} onChange={handleMajorChange} className="p-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border rounded-lg text-sm font-medium outline-none focus:ring-2 ring-indigo-500 transition-colors">
                  {majorsList.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-normal">Major: {m}</option>)}
                </select>
                <select value={fSub} onChange={handleSubChange} className="p-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border rounded-lg text-sm font-medium outline-none focus:ring-2 ring-indigo-500 transition-colors">
                  {subsList.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-normal">Sub: {s}</option>)}
                </select>
                <select value={fDiv} onChange={handleDivChange} className="p-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border rounded-lg text-sm font-medium outline-none focus:ring-2 ring-indigo-500 transition-colors">
                  {divsList.map(d => <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-normal">{d === 'All' ? 'Div: All' : (d.toLowerCase().startsWith('div') ? d : `Div: ${d}`)}</option>)}
                </select>
                <select value={fTest} onChange={e=>setFTest(e.target.value)} className="p-2 bg-blue-50 dark:bg-indigo-900/40 border border-blue-200 dark:border-indigo-500/50 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-300 outline-none focus:ring-2 ring-indigo-500 transition-colors">
                  {testsList.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium">Test: {t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-72">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mb-4 uppercase tracking-widest">Test Performance Trends (Marks %)</h4>
                {chartData.perf.length === 0 ? <div className="h-full flex items-center justify-center text-slate-400 font-medium animate-in fade-in">No tests match filter</div> : (
                  <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-500">
                    <BarChart data={chartData.perf}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'medium'}}/>
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'medium'}}/>
                      <RechartsTooltip 
                        cursor={{fill:'rgba(99,102,241,0.1)'}} 
                        contentStyle={{backgroundColor: '#0f172a', borderRadius:'12px', border:'1px solid #334155', boxShadow:'0 10px 25px rgba(0,0,0,0.5)', color: '#f8fafc'}}
                        itemStyle={{color: '#818cf8', fontWeight: 'medium'}}
                      />
                      <Bar dataKey="marks" fill="url(#colorUv)" radius={[6,6,0,0]} barSize={40}>
                        <defs>
                          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="flex flex-col items-center justify-start">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-widest mb-2">Grade Distribution</h4>
                {chartData.dist.length === 0 ? <div className="h-48 flex items-center justify-center text-slate-400 font-medium animate-in fade-in">No grades match filter</div> : (
                  <>
                    <div className="h-48 w-full relative flex justify-center items-center animate-in zoom-in-95 duration-500">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData.dist} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                            {chartData.dist.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center pointer-events-none"><span className="block text-2xl font-medium dark:text-white">{chartData.totalGraded}</span><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-widest">Graded</span></div>
                    </div>
                    <div className="w-full mt-4 space-y-2 px-4 overflow-y-auto max-h-40 scrollbar-hide">
                      {chartData.dist.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-in slide-in-from-right-4" style={{animationDelay: `${i * 50}ms`}}>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: COLORS[i % COLORS.length]}}></div><span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span></div>
                          <span className="font-medium dark:text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] mt-8 overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
              <h3 className="font-medium text-lg dark:text-white">Audit Log (Recent 10)</h3>
              <div className="space-x-3"><button onClick={deleteAllActivities} className="text-sm text-red-500 font-medium hover:underline">Delete All</button><button onClick={()=>setShowAllLogs(true)} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View All</button></div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-medium transition-colors"><tr><th className="px-6 py-4">Action</th><th className="px-6 py-4">Target</th><th className="px-6 py-4">Time</th><th className="px-6 py-4 text-right">Delete</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 transition-colors">
                {safeArr(globalData?.recentActivities).slice(0, 10).map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"><td className="px-6 py-4 font-normal text-slate-900 dark:text-slate-200">{act.action}</td><td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-normal">{act.target}</td><td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">{act.time}</td><td className="px-6 py-4 text-right"><button onClick={() => deleteActivity(act.id)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16}/></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAllLogs && (
        <div style={{ zIndex: 9999 }} className="fixed inset-0 flex justify-center items-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 transition-colors">
                <h2 className="font-semibold text-2xl text-slate-900 dark:text-white flex items-center gap-2"><DatabaseZap className="text-indigo-500" /> Full Audit History</h2>
                <button onClick={()=>setShowAllLogs(false)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all group"><X size={20} className="text-slate-400 group-hover:text-red-500"/></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-3 bg-white dark:bg-slate-800 flex-1 scrollbar-hide transition-colors">
                 {safeArr(globalData?.recentActivities).length === 0 ? (
                   <div className="text-center text-slate-500 dark:text-slate-400 py-10 font-medium text-lg">No audit logs available.</div>
                 ) : (
                   safeArr(globalData?.recentActivities).map(act => (
                     <div key={act.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all bg-white dark:bg-slate-800 group transition-colors">
                       <div><span className="font-medium text-base text-slate-900 dark:text-white block mb-1">{act.action}</span><span className="font-normal text-sm text-indigo-500 dark:text-indigo-400">{act.target}</span></div>
                       <div className="flex items-center gap-4"><span className="text-[10px] font-medium tracking-widest uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 transition-colors">{act.time}</span><button onClick={() => deleteActivity(act.id)} className="p-2.5 text-red-400 bg-red-50/50 dark:bg-red-500/10 hover:text-white hover:bg-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 size={16}/></button></div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;