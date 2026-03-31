import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
