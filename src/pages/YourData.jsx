/* eslint-disable */
import React, { useState, useRef } from 'react';
import { FolderTree, Trash2, Edit, Plus, Save, X, ArrowLeft, DatabaseZap, CheckCircle2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import useStore from '../store/useStore';

const safeArr = (val) => Array.isArray(val) ? val : [];

const YourData = () => {
  const { globalData, updateMasterData } = useStore();
  const navigate = useNavigate();
  const [path, setPath] = useState([]);
  const [modal, setModal] = useState(null); 
  const [isSaving, setIsSaving] = useState(false); 
  
  const bottomRef = useRef(null);

  const data = JSON.parse(JSON.stringify(safeArr(globalData?.majors)));
  const save = (newData) => updateMasterData(newData);

  const del = {
    major: (i) => { data.splice(i,1); save(data); },
    sub: (mI, i) => { data[mI].subjects.splice(i,1); save(data); },
    div: (mI, sI, i) => { data[mI].subjects[sI].divisions.splice(i,1); save(data); },
    test: (mI, sI, dI, tName) => {
      safeArr(data[mI]?.subjects?.[sI]?.divisions?.[dI]?.students).forEach(st => { 
        st.tests = safeArr(st?.tests).filter(t => t.name !== tName); 
      });
      save(data);
    },
    student: (mI, sI, dI, stI) => { data[mI].subjects[sI].divisions[dI].students.splice(stI, 1); save(data); }
  };

  // THE FIX: Try/Catch block to guarantee the modal closes
  const handleModalSubmit = (e) => {
    e.preventDefault();
    try {
      if (modal.level === 'major') {
        if (modal.type === 'add') data.push({ name: modal.data.name, subjects: [] });
        else data[modal.pIndex].name = modal.data.name;
      } 
      else if (modal.level === 'sub') {
        const m = data[path[0]];
        if (!m.subjects) m.subjects = [];
        if (modal.type === 'add') m.subjects.push({ code: modal.data.code, name: modal.data.name, divisions: [] });
        else { m.subjects[modal.pIndex].code = modal.data.code; m.subjects[modal.pIndex].name = modal.data.name; }
      } 
      else if (modal.level === 'div') {
        const s = data[path[0]].subjects[path[1]];
        if (!s.divisions) s.divisions = [];
        if (modal.type === 'add') s.divisions.push({ name: modal.data.name, students: [] });
        else s.divisions[modal.pIndex].name = modal.data.name;
      }
      save(data);
    } catch (err) {
      console.error("Error saving structure:", err);
    } finally {
      setModal(null); // Guaranteed to close
    }
  };

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 mt-8 text-center animate-in zoom-in bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_rgba(99,102,241,0.15)] transition-colors">
      <DatabaseZap size={56} className="text-indigo-500 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"/>
      <h2 className="text-2xl font-bold dark:text-white mb-2">No Data Available</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Your interactive database is currently empty. Let's add some structures!</p>
      <button onClick={()=>navigate('/add-data')} className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-105 transition-transform">Go to Add Data</button>
    </div>
  );

  const renderBreadcrumbs = () => {
    const crumbs = [{ label: 'All Majors', jump: [] }];
    if(path[0] !== undefined) crumbs.push({ label: data[path[0]]?.name, jump: [path[0]] });
    if(path[1] !== undefined) crumbs.push({ label: data[path[0]]?.subjects?.[path[1]]?.code, jump: [path[0], path[1]] });
    if(path[2] !== undefined) crumbs.push({ label: data[path[0]]?.subjects?.[path[1]]?.divisions?.[path[2]]?.name, jump: [path[0], path[1], path[2]] });
    if(path[3] !== undefined) crumbs.push({ label: path[3], jump: path });

    return (
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex-wrap transition-colors">
        {path.length > 0 && <button onClick={()=>setPath(path.slice(0,-1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded mr-2 transition-colors"><ArrowLeft size={16}/></button>}
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
            <button onClick={()=>setPath(c.jump)} className={`hover:text-indigo-500 hover:underline transition-colors ${i === crumbs.length-1 ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>{c.label}</button>
          </span>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (path.length === 0) { 
      return (
        <div className="space-y-4">
          <button onClick={()=>setModal({type:'add', level:'major', data:{name:''}})} className="w-full py-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex justify-center items-center gap-2 transition-all"><Plus size={18}/> Add New Major</button>
          {safeArr(data).map((m, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={()=>setPath([i])}>
              <div className="flex-1 text-left font-extrabold text-xl text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{m.name} <span className="font-bold text-sm text-slate-400 ml-3 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">{safeArr(m?.subjects).length} Subjects</span></div>
              <div className="flex gap-2"><button onClick={(e)=>{e.stopPropagation(); setModal({type:'edit', level:'major', pIndex: i, data:{name: m.name}});}} className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit size={18}/></button><button onClick={(e)=>{e.stopPropagation(); del.major(i);}} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button></div>
            </div>
          ))}
        </div>
      );
    }
    if (path.length === 1) { 
      const m = data[path[0]];
      if (!m) return null;
      return (
        <div className="space-y-4">
          <button onClick={()=>setModal({type:'add', level:'sub', data:{code:'', name:''}})} className="w-full py-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex justify-center items-center gap-2 transition-all"><Plus size={18}/> Add Subject to {m.name}</button>
          {safeArr(m?.subjects).map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={()=>setPath([...path, i])}>
              <div className="flex-1 text-left"><div className="font-extrabold text-xl text-indigo-500">{s.code}</div><div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{s.name} <span className="font-bold text-xs text-slate-400 ml-2 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-full">{safeArr(s?.divisions).length} Divisions</span></div></div>
              <div className="flex gap-2"><button onClick={(e)=>{e.stopPropagation(); setModal({type:'edit', level:'sub', pIndex: i, data:{code: s.code, name: s.name}});}} className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit size={18}/></button><button onClick={(e)=>{e.stopPropagation(); del.sub(path[0], i);}} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button></div>
            </div>
          ))}
        </div>
      );
    }
    if (path.length === 2) { 
      const s = data[path[0]]?.subjects?.[path[1]];
      if (!s) return null;
      return (
        <div className="space-y-4">
          <button onClick={()=>setModal({type:'add', level:'div', data:{name:''}})} className="w-full py-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex justify-center items-center gap-2 transition-all"><Plus size={18}/> Add Division to {s.code}</button>
          {safeArr(s?.divisions).map((d, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={()=>setPath([...path, i])}>
              <div className="flex-1 text-left font-extrabold text-xl text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{d.name} <span className="font-bold text-sm text-slate-400 ml-3 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">{safeArr(d?.students).length} Students</span></div>
              <div className="flex gap-2"><button onClick={(e)=>{e.stopPropagation(); setModal({type:'edit', level:'div', pIndex: i, data:{name: d.name}});}} className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit size={18}/></button><button onClick={(e)=>{e.stopPropagation(); del.div(path[0], path[1], i);}} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button></div>
            </div>
          ))}
        </div>
      );
    }
    if (path.length === 3) { 
      const d = data[path[0]]?.subjects?.[path[1]]?.divisions?.[path[2]];
      if (!d) return null;
      const uniqueTests = [...new Set(safeArr(d?.students).flatMap(st => safeArr(st?.tests).map(t => t.name)))];
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-indigo-700/50 text-sm text-blue-800 dark:text-indigo-200 font-bold flex items-center gap-3"><span className="text-xl">💡</span> Note: To add a new test, click into any existing test and add a column, or ingest a batch from "Add Data".</div>
          {uniqueTests.map((tName, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={()=>setPath([...path, tName])}>
              <div className="font-extrabold text-xl text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 transition-colors">{tName}</div>
              <div className="flex gap-2">
                <button onClick={(e)=>{e.stopPropagation(); setPath([...path, tName]);}} className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-lg font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2 hover:scale-105 transition-transform"><Edit size={16}/> Edit Marks</button>
                <button onClick={(e)=>{e.stopPropagation(); del.test(path[0], path[1], path[2], tName);}} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button></div>
            </div>
          ))}
        </div>
      );
    }
    if (path.length === 4) { 
      const d = data[path[0]]?.subjects?.[path[1]]?.divisions?.[path[2]];
      if (!d) return null;
      const tName = path[3];
      
      const handleGridSave = (e) => {
        e.preventDefault();
        setIsSaving(true); 

        try {
          // 1. Extract data from the UI Grid
          const rows = e.target.querySelectorAll('tr.student-row');
          rows.forEach((row, i) => {
            if(d.students[i]) {
              d.students[i].rollNo = row.querySelector('.rno').value || d.students[i].rollNo;
              d.students[i].name = row.querySelector('.name').value || d.students[i].name;
              
              if (!d.students[i].tests) d.students[i].tests = [];
              let tIndex = d.students[i].tests.findIndex(t => t.name === tName);
              const newObtained = Number(row.querySelector('.ob').value) || 0;
              
              if (tIndex >= 0) {
                d.students[i].tests[tIndex].obtained = newObtained;
              } else {
                d.students[i].tests.push({ name: tName, obtained: newObtained, max: 100 });
              }
            }
          });
          
          // 2. Save to Master UI Store
          save(data);

          // 3. --- THE FIX: STRICT EXCEL EXPORT ENGINE ---
          const majorName = data[path[0]].name || 'Major';
          const subCode = data[path[0]].subjects[path[1]].code || 'Sub';
          const subName = data[path[0]].subjects[path[1]].name || 'Course';
          const cleanDivName = d.name.replace(/^Div\s+/i, ''); 

          const excelData = safeArr(d.students).map(stu => {
            const tData = safeArr(stu.tests).find(t => t.name === tName) || { obtained: 0, max: 100 };
            return {
              "Major": majorName,
              "Subject Code": subCode,
              "Subject Name": subName,
              "Division": cleanDivName,
              "Roll Number": stu.rollNo,
              "Student Name": stu.name,
              "Test Name": tName,
              "Obtained Marks": tData.obtained,
              "Max Marks": tData.max
            };
          });

          const ws = XLSX.utils.json_to_sheet(excelData);
          ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 }];
          const wb = XLSX.utils.book_new();
          
          // Fix: Ensure sheet names are valid for Excel (Max 31 chars, no special chars)
          const safeSheetName = tName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
          XLSX.utils.book_append_sheet(wb, ws, safeSheetName || "Data"); 
          
          // Fix: Ensure file name is completely safe for all OS
          const safeFileName = `UniAnalytics_${subCode.replace(/[^a-zA-Z0-9]/g, "")}_${tName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
          XLSX.writeFile(wb, safeFileName);

        } catch (error) {
          console.error("Excel Export Error:", error);
          alert("Failed to export Excel. Please ensure test names contain no special characters.");
        } finally {
          // Fix: Guarantees the button returns to normal state even if it errors
          setTimeout(() => setIsSaving(false), 1500);
        }
      };

      const addNewStudentToGrid = () => {
        const newStu = { id: `RN-${Date.now()}`, name: 'New Student', rollNo: `RN-New`, tests: [{ name: tName, obtained: 0, max: 100 }]};
        if(!d.students) d.students = [];
        d.students.push(newStu);
        save(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      };

      return (
        <form onSubmit={handleGridSave} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 relative">
          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-30 shadow-sm">
            <h3 className="font-extrabold text-xl text-indigo-500 dark:text-indigo-400">Live Editor: {tName}</h3>
            <div className="flex gap-3">
              <button type="button" onClick={addNewStudentToGrid} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-sm"><Plus size={18}/> Add Row</button>
              <button 
                type="submit" 
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] ${isSaving ? 'bg-emerald-600 text-white cursor-default scale-105 shadow-[0_0_20px_rgba(16,185,129,0.6)]' : 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-wave text-white hover:scale-105'}`}
              >
                {isSaving ? <CheckCircle2 size={18}/> : <Download size={18}/>}
                {isSaving ? 'Saved & Downloaded!' : 'Save & Export Excel'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[60vh] relative z-10">
            <table className="w-full text-left text-sm relative">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-20 shadow-sm outline outline-1 outline-slate-200 dark:outline-slate-700"><tr><th className="p-5">Roll No</th><th className="p-5">Student Name</th><th className="p-5">Obtained Marks</th><th className="p-5 text-right">Delete</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {safeArr(d?.students).map((st, i) => {
                   const tData = safeArr(st?.tests).find(t => t.name === tName);
                   if (!tData) return null; 
                   return (
                     <tr key={st.id || i} className="student-row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="p-3"><input type="text" defaultValue={st.rollNo} className="rno w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg outline-none font-mono focus:ring-2 ring-indigo-500 transition-all"/></td>
                       <td className="p-3"><input type="text" defaultValue={st.name} className="name w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg outline-none font-bold focus:ring-2 ring-indigo-500 transition-all"/></td>
                       <td className="p-3 relative"><input type="number" defaultValue={tData.obtained} className="ob w-full p-3 bg-blue-50 dark:bg-indigo-900/20 border border-blue-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-lg outline-none font-bold pr-14 focus:ring-2 ring-indigo-500 transition-all"/><span className="absolute right-7 top-6 text-slate-400 font-bold">/ {tData.max}</span></td>
                       <td className="p-3 text-right"><button type="button" onClick={()=>del.student(path[0], path[1], path[2], i)} className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"><Trash2 size={18}/></button></td>
                     </tr>
                   )
                })}
                <tr ref={bottomRef}></tr>
              </tbody>
            </table>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900 dark:text-white"><FolderTree className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" size={32} /> Interactive Data Builder</h1></div>
      {renderBreadcrumbs()}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderContent()}</div>

      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <form onSubmit={handleModalSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4"><h2 className="font-bold text-xl capitalize text-slate-900 dark:text-white">{modal.type} {modal.level}</h2><button type="button" onClick={()=>setModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-400 hover:text-red-500"/></button></div>
              <div className="space-y-4 mb-8">
                {(modal.level === 'major' || modal.level === 'sub' || modal.level === 'div') && (
                  <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Name</label><input required autoFocus type="text" value={modal.data.name} onChange={e=>setModal({...modal, data:{...modal.data, name: e.target.value}})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                )}
                {modal.level === 'sub' && (
                  <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Subject Code</label><input required type="text" value={modal.data.code} onChange={e=>setModal({...modal, data:{...modal.data, code: e.target.value}})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform">Save Context</button>
           </form>
        </div>
      )}
    </div>
  );
};
export default YourData;