import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // 1. DEFAULT TO NULL (Forces Auth Guard to kick unauthorized users to login)
      userRole: null, 
      userName: '', 
      userEmail: '', 
      userDOB: '',             
      isDarkMode: true, 
      isSidebarCollapsed: false, 
      
      // --- GLOBAL SETTINGS STATE ---
      focusMode: false,
      topPerformerToggle: true,
      passThreshold: 40,
      
      globalData: { majors: [], recentActivities: [] },

      setUserRole: (role) => set({ userRole: role }),
      
      // 2. UPGRADED LOGIN: Strict overwrite. Never inherit old state data.
      login: (name, role, email, dob) => set({ 
        userName: name || 'Educator', 
        userRole: role || 'Teacher', 
        userEmail: email || 'Not Provided', 
        userDOB: dob || 'Not Provided' 
      }),

      // 3. UPGRADED LOGOUT: Total Data Nuke. Wipes all session variables instantly.
      logout: () => set({ 
        userRole: null,
        userName: '',
        userEmail: '',
        userDOB: '',
        globalData: { majors: [], recentActivities: [] } 
      }),

      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDarkMode: newMode };
      }),

      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      
      // --- SETTINGS ACTIONS ---
      setFocusMode: (val) => set({ focusMode: Boolean(val) }),
      setTopPerformerToggle: (val) => set({ topPerformerToggle: Boolean(val) }),
      setPassThreshold: (val) => set({ passThreshold: Number(val) }), // Forces clean numbers

      syncMasterData: (newData) => set((state) => {
        const existingMajors = JSON.parse(JSON.stringify(state.globalData?.majors || []));
        let isNewDataAdded = false;

        newData.forEach(newMajor => {
          let mIdx = existingMajors.findIndex(m => m.name === newMajor.name);
          if (mIdx < 0) { existingMajors.push(newMajor); isNewDataAdded = true; }
          else {
            newMajor.subjects.forEach(newSub => {
              let sIdx = existingMajors[mIdx].subjects.findIndex(s => s.code === newSub.code);
              if (sIdx < 0) { existingMajors[mIdx].subjects.push(newSub); isNewDataAdded = true; }
              else {
                newSub.divisions.forEach(newDiv => {
                  let dIdx = existingMajors[mIdx].subjects[sIdx].divisions.findIndex(d => d.name === newDiv.name);
                  if (dIdx < 0) { existingMajors[mIdx].subjects[sIdx].divisions.push(newDiv); isNewDataAdded = true; }
                  else {
                    newDiv.students.forEach(newStu => {
                      let stuIdx = existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students.findIndex(st => st.rollNo === newStu.rollNo);
                      if (stuIdx < 0) { existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students.push(newStu); isNewDataAdded = true; }
                      else {
                        newStu.tests.forEach(newTest => {
                          let tIdx = existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students[stuIdx].tests.findIndex(t => t.name === newTest.name);
                          if (tIdx < 0) {
                            existingMajors[mIdx].subjects[sIdx].divisions[dIdx].students[stuIdx].tests.push(newTest);
                            isNewDataAdded = true;
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

        return {
          globalData: {
            ...state.globalData, majors: existingMajors,
            recentActivities: [{ id: `ACT_${Date.now()}`, action: isNewDataAdded ? 'Data Ingested' : 'Data Updated', target: 'Database Merge', status: 'Completed', time: new Date().toLocaleTimeString() }, ...(state.globalData?.recentActivities || [])]
          }
        };
      }),

      updateMasterData: (newMajors) => set((state) => ({
        globalData: { ...state.globalData, majors: newMajors, recentActivities: [{ id: `ACT_${Date.now()}`, action: 'Data Altered', target: 'Live Editor', status: 'Completed', time: new Date().toLocaleTimeString() }, ...(state.globalData?.recentActivities || [])] }
      })),

      deleteActivity: (id) => set((state) => ({ globalData: { ...state.globalData, recentActivities: (state.globalData?.recentActivities || []).filter(a => a.id !== id) } })),
      deleteAllActivities: () => set((state) => ({ globalData: { ...state.globalData, recentActivities: [] } }))
    }),
    {
      name: 'uni-analytics-storage',
      partialize: (state) => ({ 
        userRole: state.userRole, 
        userName: state.userName, 
        userEmail: state.userEmail, 
        userDOB: state.userDOB,     
        isDarkMode: state.isDarkMode, 
        isSidebarCollapsed: state.isSidebarCollapsed,
        // Guaranteed to persist on page refresh:
        focusMode: state.focusMode,
        topPerformerToggle: state.topPerformerToggle,
        passThreshold: state.passThreshold,
        globalData: state.globalData
      }),
    }
  )
);

export default useStore;