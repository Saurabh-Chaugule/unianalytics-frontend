/* eslint-disable */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const AtRisk = () => {
  const navigate = useNavigate();
  // THE FIX: Pull passThreshold from the global store
  const { globalData, passThreshold } = useStore();

  const atRiskStudents = useMemo(() => {
    let list = [];
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        safeArr(sub?.divisions).forEach(div => {
          safeArr(div?.students).forEach(s => {
            let ob = 0; let mx = 0;
            let worstTest = { name: 'N/A', p: 100, ob: 0, mx: 0 };
            
            safeArr(s?.tests).forEach(t => {
              ob += t.obtained || 0; mx += t.max || 0;
              let p = t.max > 0 ? (t.obtained/t.max)*100 : 0;
              if(p < worstTest.p) {
                worstTest = { name: t.name, p, ob: t.obtained, mx: t.max };
              }
            });
            
            let overall = mx > 0 ? (ob/mx)*100 : 0;
            
            // THE FIX: Dynamic filter using your custom setting
            if(overall < passThreshold && mx > 0) {
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
                percentage: worstTest.p.toFixed(1)
              });
            }
          });
        });
      });
    });
    
    return list.sort((a, b) => a.percentage - b.percentage);
  }, [globalData, passThreshold]);

  return (
    <div className="space-y-6 fade-in pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold mb-2 transition-colors">
        <ArrowLeft size={18} /> <span>Back</span>
      </button>
      
      <div>
        <h1 className="text-3xl font-extrabold flex gap-3 text-slate-900 dark:text-white items-center">
          <AlertTriangle className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={32} /> 
          Intervention Required
        </h1>
        {/* THE FIX: Dynamic text display */}
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
          Students scoring below {passThreshold}% combined across all tests.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(239,68,68,0.15)] overflow-hidden mt-6">
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
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-emerald-500 dark:text-emerald-400 font-extrabold text-lg flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">🎉</span>
                    No students currently at risk!
                  </td>
                </tr>
              ) : (
                atRiskStudents.map((student) => (
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