import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, BookOpen, Database, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, FolderTree, Users } from 'lucide-react';
import useStore from '../../store/useStore';

const Sidebar = () => {
  const { logout, isSidebarCollapsed, toggleSidebar, focusMode } = useStore();
  const navigate = useNavigate();

  const isCollapsed = isSidebarCollapsed || focusMode;

  // ==========================================
  // THE FIX: True Secure Logout
  // ==========================================
  const handleLogout = () => {
    // 1. Destroy the security token so the Auth Guard lets you leave
    localStorage.removeItem('uni_token');
    
    // 2. Wipe the Zustand global memory
    logout();
    
    // 3. Navigate cleanly to the login screen
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Enrollments', path: '/enrollments', icon: Users },
    { name: 'Rankings', path: '/rankings', icon: Trophy },
    { name: 'Add Data', path: '/add-data', icon: Database },
    { name: 'Your Data', path: '/your-data', icon: FolderTree },
    { name: 'Courses', path: '/courses', icon: BookOpen },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 h-screen flex flex-col border-r border-slate-100 dark:border-slate-800 transition-all duration-300 relative z-20`}>
      <style>{`
        @keyframes logoGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-logo-wave {
          background: linear-gradient(-45deg, #4f46e5, #3b82f6, #6366f1, #4f46e5);
          background-size: 300% 300%;
          animation: logoGlow 4s ease-in-out infinite;
        }
      `}</style>

      <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-colors`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 animate-logo-wave text-white rounded-lg flex items-center justify-center font-extrabold text-2xl shadow-[0_0_15px_rgba(79,70,229,0.3)] shrink-0 transition-transform hover:scale-110">
            U
          </div>
          {!isCollapsed && <h1 className="text-2xl font-normal text-slate-900 dark:text-white flex items-center gap-2">UniAnalytics</h1>}
        </div>
        
        {!focusMode && (
          <button onClick={toggleSidebar} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 absolute -right-3 top-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm transition-colors">
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navLinks.map((link) => (
          <NavLink key={link.name} to={link.path} className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl font-medium transition-all group ${isActive ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 animate-wave text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'}`} title={isCollapsed ? link.name : ''}>
            <link.icon size={20} /> {!isCollapsed && <span>{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
        {/* THE FIX: Point the button to the new handleLogout function */}
        <button onClick={handleLogout} className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all shadow-none hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]`}>
          <LogOut size={20} /> {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;