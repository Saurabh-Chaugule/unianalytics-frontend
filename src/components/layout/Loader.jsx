import React from 'react';

const Loader = () => {
  return (
    <div className="w-full space-y-8 fade-in pb-10">
      {/* Top Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-3xl animate-shimmer border border-slate-100 dark:border-slate-700"></div>
        ))}
      </div>
      
      {/* Main Dashboard Skeleton */}
      <div className="h-[500px] rounded-3xl animate-shimmer border border-slate-100 dark:border-slate-700 mt-6"></div>
    </div>
  );
};

export default Loader;