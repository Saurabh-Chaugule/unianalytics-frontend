import React from 'react';
import { Moon, Sun, Maximize, Minimize } from 'lucide-react';
import useStore from '../../store/useStore';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { isDarkMode, toggleDarkMode, userRole, focusMode, setFocusMode } = useStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* RESTORED BLUE/INDIGO WAVE ANIMATION */}
      <style>{`
        @keyframes waveGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-wave {
          background: linear-gradient(-45deg, #4f46e5, #3b82f6, #6366f1, #4f46e5);
          background-size: 300% 300%;
          animation: waveGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* THE FIX: Always render the Sidebar. It handles its own minimizing now! */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8 transition-colors">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
              {userRole} Workspace
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            
            {/* Quick-Toggle for Focus Mode */}
            <button 
              onClick={() => setFocusMode(!focusMode)} 
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all hover:scale-110 shadow-sm flex items-center gap-2"
              title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {focusMode ? (
                <Minimize size={20} className="text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> 
              ) : (
                <Maximize size={20} />
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button onClick={toggleDarkMode} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all hover:scale-110 shadow-sm">
              {isDarkMode ? (
                <Moon size={20} className="text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]" />
              ) : (
                <Sun size={20} className="text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
              )}
            </button>
            
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative scrollbar-hide text-slate-900 dark:text-slate-100 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;