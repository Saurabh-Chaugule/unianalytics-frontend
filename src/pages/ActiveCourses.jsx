/* eslint-disable */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Users, ArrowLeft } from 'lucide-react';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const ActiveCourses = () => {
  const navigate = useNavigate();
  const { globalData } = useStore();

  const courses = useMemo(() => {
    let list = [];
    safeArr(globalData?.majors).forEach(m => {
      safeArr(m?.subjects).forEach(sub => {
        const enrichedDivisions = safeArr(sub?.divisions).map(div => {
          let stuCount = safeArr(div?.students).length;
          return { ...div, stuCount };
        });
        list.push({ ...sub, major: m.name, divisions: enrichedDivisions });
      });
    });
    return list;
  }, [globalData]);

  const getTotalStudents = (divisions) => safeArr(divisions).reduce((acc, div) => acc + (div.stuCount || 0), 0);

  return (
  <div className="space-y-6 fade-in pb-10">
    <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold w-fit transition-colors">
      <ArrowLeft size={18} /> <span>Back to Dashboard</span>
    </button>

    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <BookOpen className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" size={32}/> 
          Active Courses & Divisions
        </h1>
      </div>
      <button onClick={() => navigate('/add-data')} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-brand-blue via-indigo-500 to-brand-blue animate-wave text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform">
        <Plus size={18} /> <span>Add Course Data</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {courses.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 col-span-3 text-center py-10 font-bold text-lg">No courses available. Go to Add Data Hub.</p>
      ) : (
        courses.map((course) => (
          <div key={course.code} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-brand-blue/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
              <BookOpen size={24} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 pr-8 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {course.name}
            </h3>

            <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-4 font-bold">
              {course.code} <span className="text-indigo-500 dark:text-indigo-400 ml-1 font-semibold">• {course.major}</span>
            </p>

            <div className="space-y-2 mb-4">
              {safeArr(course.divisions).map((div, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">{div.name}</span>
                  <div className="flex space-x-3 text-slate-500 dark:text-slate-400 font-bold">
                    <span>Students: {div.stuCount}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 bg-blue-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg border border-blue-100 dark:border-indigo-500/30">Total Enrolled</span>
              <div className="flex items-center space-x-1 text-slate-900 dark:text-white font-extrabold text-xl">
                <Users size={18} className="text-indigo-500 dark:text-indigo-400 mr-1" /> 
                <span>{getTotalStudents(course.divisions)}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
};

export default ActiveCourses;