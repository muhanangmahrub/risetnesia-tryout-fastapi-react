import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', labelClassName = '', inputClassName = '', id, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={inputId} className={`block text-sm font-medium mb-1.5 ${labelClassName || 'text-slate-700'}`}>
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:ring-brand-500 focus:border-brand-500'
        } ${inputClassName || 'bg-white text-slate-900 placeholder-slate-400'}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
