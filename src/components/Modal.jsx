import React from 'react';

const Modal = ({ isOpen, onClose, title, children, isDarkMode = false, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-md transition-opacity ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-800/40'}`}
        onClick={onClose}
      />
      
      {/* Modal Body */}
      <div className={`relative w-full ${sizes[size]} animate-in zoom-in-95 duration-200`}>
        <div className={`rounded-3xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-teal-300'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
