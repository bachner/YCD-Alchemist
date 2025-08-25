import React from 'react';

const ProgressBar = ({ current, total, label, className = '' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <div className={`progress-bar-container ${className}`}>
      {label && (
        <div className="progress-label mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{current} / {total}</span>
        </div>
      )}
      
      <div className="progress-bar-track bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="progress-bar-fill bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="progress-percentage text-center mt-1">
        <span className="text-xs font-medium text-emerald-600">{percentage}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;
