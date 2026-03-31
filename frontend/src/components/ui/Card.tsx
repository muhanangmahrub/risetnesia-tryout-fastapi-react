import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 border-b border-slate-200 bg-slate-50/50 ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
