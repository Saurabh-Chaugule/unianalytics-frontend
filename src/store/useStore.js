/* eslint-disable */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

const useStore = create(
  persist(
    (set, get) => ({
      // --- 1. Auth & User State ---
      isAuthenticated: !!localStorage.getItem('uni_token'),
      userRole: 'Teacher', 
      userName: '', 
      userEmail: '', 
      userDOB: '',

      // --- 2. UI & Settings State ---
      isDarkMode: true, 
      isSidebarCollapsed: false,
      focusMode: false, 
      topPerformerToggle: true, 
      passThreshold: 40,

      // --- 3. Massive Data State (RAM & Cloud only) ---
      globalData: { majors: [], recentActivities: [] },
      isDataLoaded: false, // THE FIX: Flag to track if RAM has data

      // =========================================
      // ACTIONS
      // =========================================

      // THE FIX: Centralized Cloud Fetcher
      loadCloudData: async () => {
        try {
          const cloudData = await api.getCloudMasterData();
          set(state => ({
            globalData: { ...state.globalData, majors: cloudData },
            isDataLoaded: true
          }));
        } catch (e) {
          console.error("Cloud Fetch Error on Refresh", e);
          set({ isDataLoaded: true }); // Prevent infinite loop if offline
        }
      },

      login: async (name, role, email, dob) => {
        const finalName = name || (email ? email.split('@')[0] : 'Educator');
        
        set({ 
          isAuthenticated: true, 
          userName: finalName, 
          userRole: role || 'Teacher', 
          userEmail: email || 'Not Provided', 
          userDOB: dob || 'Not Provided',
          isDataLoaded: false // Reset flag on login
        });
        
        // Use the new centralized fetcher
        await get().loadCloudData();
      },

      logout: () => {
        localStorage.removeItem('uni_token');
        set({ 
          isAuthenticated: false, 
          userRole: 'Teacher', 
          userName: '', 
          userEmail: '', 
          userDOB: '', 
          globalData: { majors: [], recentActivities: [] },
          isDataLoaded: false
        });
      },

      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDarkMode: newMode };
      }),

      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setFocusMode: (val) => set({ focusMode: Boolean(val) }),
      setTopPerformerToggle: (val) => set({ topPerformerToggle: Boolean(val) }),
      setPassThreshold: (val) => set({ passThreshold: Number(val) }),

      updateMasterData: async (newMajors) => {
        set((state) => ({
          globalData: { 
            ...state.globalData, 
            majors: newMajors, 
            recentActivities: [{ id: `ACT_${Date.now()}`, action: 'Data Altered', target: 'Live Database', status: 'Completed', time: new Date().toLocaleTimeString() }, ...(state.globalData?.recentActivities || [])].slice(0, 50) 
          }
        }));

        try {
          await api.syncCloudMasterData(newMajors);
        } catch (error) {
          console.error("Cloud Sync Error:", error);
        }
      },

      syncMasterData: async (newData) => {
        const existingMajors = JSON.parse(JSON.stringify(get().globalData?.majors || []));

        newData.forEach(newMajor => {
          let mIdx = existingMajors.findIndex(m => m.name === newMajor.name);
          if (mIdx < 0) { existingMajors.push(newMajor); }
          else {
            newMajor.subjects.forEach(newSub => {
              let sIdx = existingMajors[mIdx].subjects.findIndex(s => s.code === newSub.code);
              if (sIdx < 0) { existingMajors[mIdx].subjects.push(newSub); }
              else {
                newSub.divisions.forEach(newDiv => {
                  let dIdx = existingMajors[mIdx].subjects[sIdx].divisions.findIndex(d => d.name === newDiv.name);
                  if (dIdx < 0) { existingMajors[mIdx].subjects[sIdx].divisions.push(newDiv); }
                  else {
                    newDiv.students.forEach(newStu => {
                      let stuIdx = existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students.findIndex(st => st.rollNo === newStu.rollNo);
                      if (stuIdx < 0) { existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students.push(newStu); }
                      else {
                        newStu.tests.forEach(newTest => {
                          let tIdx = existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students[stuIdx].tests.findIndex(t => t.name === newTest.name);
                          if (tIdx < 0) {
                            existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students[stuIdx].tests.push(newTest);
                          } else {
                            existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students[stuIdx].tests[tIdx] = newTest;
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });

        await get().updateMasterData(existingMajors);
      },

      deleteActivity: (id) => set((state) => ({ globalData: { ...state.globalData, recentActivities: (state.globalData?.recentActivities || []).filter(a => a.id !== id) } })),
      deleteAllActivities: () => set((state) => ({ globalData: { ...state.globalData, recentActivities: [] } }))
    }),
    {
      name: 'uni-analytics-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        userName: state.userName,
        userEmail: state.userEmail,
        userDOB: state.userDOB,
        isDarkMode: state.isDarkMode,
        isSidebarCollapsed: state.isSidebarCollapsed,
        focusMode: state.focusMode,
        topPerformerToggle: state.topPerformerToggle,
        passThreshold: state.passThreshold,
      }),
    }
  )
);

export default useStore;