import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  isDarkMode = false, 
  className = '',
  icon,
  error
}) => {
  const baseInputStyles = `w-full p-4 rounded-xl border outline-none transition-all duration-300`;
  const themeStyles = isDarkMode
    ? `bg-white/5 text-white border-white/20 focus:border-teal-400 focus:bg-white/10`
    : `bg-slate-50 text-slate-800 border-slate-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10`;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseInputStyles} ${themeStyles} ${icon ? 'pl-12' : ''} ${error ? 'border-rose-400' : ''}`}
        />
      </div>
      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
};

export default Input;
