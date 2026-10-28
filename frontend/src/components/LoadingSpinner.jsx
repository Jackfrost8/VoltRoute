import React from 'react';

export function LoadingSpinner({ size = 'md', text = 'Loading...', message }) {
  const displayText = message || text;
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses} border-slate-700 border-t-emerald-500 rounded-full animate-spin`}
      />
      {displayText && <p className="text-xs text-slate-400 font-medium tracking-wide">{displayText}</p>}
    </div>
  );
}

export default LoadingSpinner;
