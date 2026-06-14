import React from 'react';

const Card = ({ children, className = '', isDarkMode = false, noPadding = false, hover = true }) => {
  const baseStyles = `rounded-3xl border transition-all duration-300 relative overflow-hidden`;
  const themeStyles = isDarkMode 
    ? 'bg-slate-900/40 border-white/10 backdrop-blur-md' 
    : 'bg-white border-slate-200 shadow-sm';
  const hoverStyles = hover 
    ? (isDarkMode ? 'hover:border-teal-500/50 hover:bg-white/8 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]' : 'hover:border-teal-400 hover:shadow-xl')
    : '';
  const padding = noPadding ? '' : 'p-6 md:p-8';

  return (
    <div className={`${baseStyles} ${themeStyles} ${hoverStyles} ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
