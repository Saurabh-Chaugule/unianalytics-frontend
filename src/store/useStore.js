/* eslint-disable */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

// Helper store just for the non-data settings (so Dark Mode saves locally)
const useSettingsStore = create(
  persist(
    (set) => ({
      userRole: null, userName: '', userEmail: '', userDOB: '',
      isDarkMode: true, isSidebarCollapsed: false,
      focusMode: false, topPerformerToggle: true, passThreshold: 40,
      
      setAuth: (name, role, email, dob) => set({ 
        userName: name || 'Educator', userRole: role || 'Teacher', 
        userEmail: email || 'Not Provided', userDOB: dob || 'Not Provided' 
      }),
      clearAuth: () => set({ userRole: null, userName: '', userEmail: '', userDOB: '' }),
      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDarkMode: newMode };
      }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setFocusMode: (val) => set({ focusMode: Boolean(val) }),
      setTopPerformerToggle: (val) => set({ topPerformerToggle: Boolean(val) }),
      setPassThreshold: (val) => set({ passThreshold: Number(val) })
    }),
    { name: 'uni-analytics-settings' }
  )
);

// MAIN store that handles the massive Cloud Data
const useStore = create((set, get) => ({
  get userRole() { return useSettingsStore.getState().userRole; },
  get userName() { return useSettingsStore.getState().userName; },
  get userEmail() { return useSettingsStore.getState().userEmail; },
  get userDOB() { return useSettingsStore.getState().userDOB; },
  get isDarkMode() { return useSettingsStore.getState().isDarkMode; },
  get isSidebarCollapsed() { return useSettingsStore.getState().isSidebarCollapsed; },
  get focusMode() { return useSettingsStore.getState().focusMode; },
  get topPerformerToggle() { return useSettingsStore.getState().topPerformerToggle; },
  get passThreshold() { return useSettingsStore.getState().passThreshold; },

  toggleDarkMode: () => useSettingsStore.getState().toggleDarkMode(),
  toggleSidebar: () => useSettingsStore.getState().toggleSidebar(),
  setFocusMode: (val) => useSettingsStore.getState().setFocusMode(val),
  setTopPerformerToggle: (val) => useSettingsStore.getState().setTopPerformerToggle(val),
  setPassThreshold: (val) => useSettingsStore.getState().setPassThreshold(val),

  globalData: { majors: [], recentActivities: [] },

  login: async (name, role, email, dob) => {
    useSettingsStore.getState().setAuth(name, role, email, dob);
    
    try {
      const cloudData = await api.getCloudMasterData();
      set(state => ({
        globalData: { ...state.globalData, majors: cloudData }
      }));
    } catch (e) {
      console.error("Login Cloud Fetch Error", e); // Fixed unused 'e'
    }
  },

  logout: () => {
    useSettingsStore.getState().clearAuth();
    set({ globalData: { majors: [], recentActivities: [] } });
  },

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
      console.error("Cloud Sync Error:", error); // Fixed unused 'error'
      alert("Warning: Failed to save changes to the cloud. Please check connection.");
    }
  },

  syncMasterData: async (newData) => {
    const existingMajors = JSON.parse(JSON.stringify(get().globalData?.majors || []));
    // Fixed unused 'isNewDataAdded' by removing it entirely.

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
}));

export default useStore;