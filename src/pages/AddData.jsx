/* eslint-disable */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Database, FileSpreadsheet, CheckCircle2, Server, ArrowLeft, Plus, ArrowRight, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import useStore from '../store/useStore';

const AddData = () => {
  const navigate = useNavigate();
  const { syncMasterData } = useStore();
  const [activeTab, setActiveTab] = useState('excel');
  
  // --- EXCEL UPLOAD STATE ---
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const fileInputRef = useRef(null);

  // --- MANUAL BATCH STATE ---
  const [step, setStep] = useState(1);
  const [batchInfo, setBatchInfo] = useState({ major: '', subCode: '', subName: '', division: '', testName: '', max: 100, numStudents: 5 });
  const [studentsGrid, setStudentsGrid] = useState([]);

  // ==========================================
  // EXCEL / CSV LOGIC
  // ==========================================
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Major": "Computer Science",
      "Subject Code": "CS101",
      "Subject Name": "Data Structures",
      "Division": "A",
      "Roll Number": "CS-001",
      "Student Name": "John Doe",
      "Test Name": "Midterm 1",
      "Obtained Marks": 85,
      "Max Marks": 100
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "UniAnalytics_Template.xlsx");
  };

  const processExcel = (file) => {
    setStatus({ type: 'loading', msg: 'Parsing file...' });
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet);

        if (rows.length === 0) {
          setStatus({ type: 'error', msg: 'The file is empty.' });
          return;
        }

        const majorsMap = {};

        rows.forEach((row, index) => {
          const keys = Object.keys(row).reduce((acc, k) => {
            acc[k.toLowerCase().trim()] = row[k];
            return acc;
          }, {});

          const major = keys['major'] || 'Default Major';
          const subCode = keys['subject code'] || keys['sub code'] || keys['code'] || 'SUB101';
          const subName = keys['subject name'] || keys['subject'] || 'Unknown Subject';
          const div = keys['division'] || keys['div'] || 'A';
          const rollNo = keys['roll number'] || keys['roll no'] || keys['id'] || `UNK-${index}`;
          const stuName = keys['student name'] || keys['name'] || keys['student'] || 'Unknown Student';
          const testName = keys['test name'] || keys['test'] || keys['exam'] || 'Assessment';
          const ob = Number(keys['obtained marks'] || keys['obtained'] || keys['score'] || 0);
          const mx = Number(keys['max marks'] || keys['total'] || keys['max'] || 100);

          if (!majorsMap[major]) majorsMap[major] = { name: major, subjects: {} };
          if (!majorsMap[major].subjects[subCode]) majorsMap[major].subjects[subCode] = { code: subCode, name: subName, divisions: {} };
          if (!majorsMap[major].subjects[subCode].divisions[div]) majorsMap[major].subjects[subCode].divisions[div] = { name: `Div ${div}`, students: {} };
          if (!majorsMap[major].subjects[subCode].divisions[div].students[rollNo]) majorsMap[major].subjects[subCode].divisions[div].students[rollNo] = { rollNo, name: stuName, tests: [] };

          majorsMap[major].subjects[subCode].divisions[div].students[rollNo].tests.push({ name: testName, obtained: ob, max: mx });
        });

        const formattedData = Object.values(majorsMap).map(m => ({
          name: m.name,
          subjects: Object.values(m.subjects).map(s => ({
            code: s.code,
            name: s.name,
            divisions: Object.values(s.divisions).map(d => ({
              name: d.name,
              students: Object.values(d.students)
            }))
          }))
        }));

        syncMasterData(formattedData);
        setStatus({ type: 'success', msg: `Successfully imported ${rows.length} records! You can view them in the Dashboard.` });

      } catch (error) {
        setStatus({ type: 'error', msg: 'Failed to read file. Please ensure it is a valid .xlsx or .csv file.' });
      }
    };

    reader.onerror = () => setStatus({ type: 'error', msg: 'File reading failed.' });
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processExcel(file);
  };

  // ==========================================
  // MANUAL BATCH LOGIC
  // ==========================================
  const generateGrid = (e) => {
    e.preventDefault();
    const grid = Array.from({ length: batchInfo.numStudents }, (_, i) => ({ rollNo: `RN-${i+1}`, name: `Student ${i+1}`, obtained: 0 }));
    setStudentsGrid(grid);
    setStep(2);
  };

  const updateGrid = (index, field, value) => {
    const newGrid = [...studentsGrid];
    newGrid[index][field] = value;
    setStudentsGrid(newGrid);
  };

  const handleBatchSubmit = () => {
    const manualData = [{
      name: batchInfo.major,
      subjects: [{
        code: batchInfo.subCode, name: batchInfo.subName,
        divisions: [{
          name: batchInfo.division,
          students: studentsGrid.map(s => ({
            id: s.rollNo, name: s.name, rollNo: s.rollNo,
            tests: [{ name: batchInfo.testName, obtained: Number(s.obtained), max: Number(batchInfo.max) }]
          }))
        }]
      }]
    }];
    syncMasterData(manualData);
    setStep(3); 
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 font-bold mb-2 transition-colors">
        <ArrowLeft size={18} /> <span>Back</span>
      </button>
      
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900 dark:text-white">
          <Server className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" size={32} /> 
          Data Ingestion Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Upload student academic records to populate your dashboard.</p>
      </div>
      
      {/* TAB TOGGLE */}
      <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl w-fit border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
        <button 
          onClick={() => {setActiveTab('excel'); setStep(1);}} 
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'excel' ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
          <div className="flex items-center gap-2"><FileSpreadsheet size={16}/> File Upload</div>
        </button>

        <button onClick={() => setActiveTab('manual')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'manual' ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
          <div className="flex items-center gap-2"><Database size={16}/> Manual Batch Builder</div>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)] relative overflow-hidden">
        
        {/* EXCEL UPLOAD VIEW */}
        {activeTab === 'excel' ? (
          <div className="animate-in fade-in slide-in-from-left-4">
            {status.type === 'success' ? (
              <div className="max-w-md mx-auto text-center py-10">
                <div className="w-24 h-24 mx-auto bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.5)]"><CheckCircle2 size={48}/></div>
                <h2 className="text-2xl font-bold mb-2 dark:text-white">{status.msg}</h2>
                <div className="space-y-3 mt-8">
                  <button onClick={() => setStatus({ type: 'idle', msg: '' })} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Upload Another File</button>
                  <button onClick={() => navigate('/your-data')} className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-2xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform">View "Your Data"</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="p-8 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors flex flex-col items-center justify-center text-center min-h-[300px] group bg-slate-50/50 dark:bg-slate-900/20"
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform ${status.type === 'loading' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 animate-pulse' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 group-hover:scale-110'}`}>
                    <Upload size={36} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Import CSV / Excel</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mb-8">
                    Drag and drop your .xlsx or .csv file here, or click to browse.
                  </p>

                  <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files[0]) processExcel(e.target.files[0]); }} />
                  <button onClick={() => fileInputRef.current.click()} disabled={status.type === 'loading'} className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform w-full max-w-xs disabled:opacity-50">
                    {status.type === 'loading' ? 'Processing...' : 'Browse Files'}
                  </button>
                </div>

                {/* Instructions Zone */}
                <div className="flex flex-col justify-center">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center mb-6">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Required Format</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                    To ensure accurate charts, your file needs specific columns. Use the button below to download an exact, pre-formatted template.
                  </p>
                  <ul className="text-sm font-bold text-slate-600 dark:text-slate-300 space-y-2 mb-8">
                    <li>• Major <span className="text-slate-400 font-normal">(e.g., Computer Science)</span></li>
                    <li>• Subject Code <span className="text-slate-400 font-normal">(e.g., CS101)</span></li>
                    <li>• Roll Number & Student Name</li>
                    <li>• Test Name, Obtained Marks, Max Marks</li>
                  </ul>
                  <button onClick={downloadTemplate} className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-fit">
                    <Download size={18} /> Download Template
                  </button>
                </div>
              </div>
            )}
            
            {status.type === 'error' && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="text-red-500" />
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{status.msg}</p>
              </div>
            )}
          </div>
        ) : (

        /* MANUAL BUILDER VIEW */
          <div className="animate-in fade-in slide-in-from-right-4">
            {step === 1 && (
              <form onSubmit={generateGrid} className="max-w-2xl mx-auto space-y-6">
                 <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-700 pb-2 dark:text-white">Step 1: Define Context</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Major</label><input required type="text" value={batchInfo.major} onChange={e=>setBatchInfo({...batchInfo, major: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Subject Code</label><input required type="text" value={batchInfo.subCode} onChange={e=>setBatchInfo({...batchInfo, subCode: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Subject Name</label><input required type="text" value={batchInfo.subName} onChange={e=>setBatchInfo({...batchInfo, subName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Division</label><input required type="text" value={batchInfo.division} onChange={e=>setBatchInfo({...batchInfo, division: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Test Name</label><input required type="text" value={batchInfo.testName} onChange={e=>setBatchInfo({...batchInfo, testName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Default Max Marks</label><input required type="number" value={batchInfo.max} onChange={e=>setBatchInfo({...batchInfo, max: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all"/></div>
                    <div><label className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1 block">Number of Students</label><input required type="number" min="1" max="100" value={batchInfo.numStudents} onChange={e=>setBatchInfo({...batchInfo, numStudents: e.target.value})} className="w-full p-3 bg-blue-50 dark:bg-indigo-900/20 border border-blue-200 dark:border-indigo-500/50 rounded-xl outline-none font-bold text-indigo-600 dark:text-indigo-300 focus:ring-2 ring-indigo-500 transition-all"/></div>
                 </div>
                 {/* THE FIX: Added Cancel Option next to Proceed */}
                 <div className="flex gap-4 pt-2">
                   <button type="button" onClick={() => {setActiveTab('excel'); setStep(1);}} className="w-1/3 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-105 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-transform">Proceed to Roster <ArrowRight size={18}/></button>
                 </div>
              </form>
            )}
            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                 <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4"><h2 className="text-xl font-bold dark:text-white">Step 2: Enter Student Marks</h2><button onClick={()=>setStep(1)} className="text-slate-400 hover:text-indigo-500 text-sm font-bold transition-colors">← Edit Context</button></div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-mono text-slate-500 dark:text-slate-400 mb-4 border border-slate-200 dark:border-slate-700">{batchInfo.major} &gt; {batchInfo.subCode} &gt; {batchInfo.division} &gt; {batchInfo.testName} (Max: {batchInfo.max})</div>
                 <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl relative">
                   <table className="w-full text-left">
                     <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-xs uppercase sticky top-0 shadow-sm z-10">
                       <tr><th className="p-4">Roll No</th><th className="p-4">Name</th><th className="p-4">Obtained Marks</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                       {studentsGrid.map((s, i) => (
                         <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="p-3"><input type="text" value={s.rollNo} onChange={(e)=>updateGrid(i, 'rollNo', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none font-mono focus:ring-2 ring-indigo-500 transition-all"/></td>
                           <td className="p-3"><input type="text" value={s.name} onChange={(e)=>updateGrid(i, 'name', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none font-bold focus:ring-2 ring-indigo-500 transition-all"/></td>
                           <td className="p-3"><input type="number" value={s.obtained} onChange={(e)=>updateGrid(i, 'obtained', e.target.value)} className="w-full p-2 bg-blue-50 dark:bg-indigo-900/20 border border-blue-200 dark:border-indigo-500/50 rounded-lg outline-none font-bold text-indigo-600 dark:text-indigo-300 focus:ring-2 ring-indigo-500 transition-all"/></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
                 {/* THE FIX: Styled to match the blue/indigo theme and added Cancel option */}
                 <div className="flex gap-4 pt-2">
                   <button type="button" onClick={() => {setActiveTab('excel'); setStep(1);}} className="w-1/3 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                   <button onClick={handleBatchSubmit} className="flex-1 py-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-105 transition-transform flex items-center justify-center"><Plus className="mr-2" size={20}/> Inject Batch Data</button>
                 </div>
              </div>
            )}
            {step === 3 && (
              <div className="max-w-md mx-auto text-center animate-in zoom-in py-10">
                 <div className="w-24 h-24 mx-auto bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.5)]"><CheckCircle2 size={48}/></div>
                 <h2 className="text-2xl font-bold mb-2 dark:text-white">Batch Data Injected!</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Your manual records have been merged into the global database.</p>
                 <div className="space-y-3">
                   <button onClick={() => { setStep(1); setBatchInfo({ major: '', subCode: '', subName: '', division: '', testName: '', max: 100, numStudents: 5 }); }} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Add Another Batch</button>
                   <button onClick={() => navigate('/your-data')} className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-wave text-white rounded-2xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform">View "Your Data"</button>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddData;