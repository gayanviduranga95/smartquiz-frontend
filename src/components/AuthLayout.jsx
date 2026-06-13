import { Link } from 'react-router-dom';

export function AuthShell({ title, subtitle, children, isDarkMode = false, maxWidth = 'max-w-md' }) {
  const themeBg = isDarkMode ? 'bg-slate-950' : 'bg-slate-100';
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]' : 'bg-white/90 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const titleGradient = isDarkMode ? 'from-teal-400 to-cyan-400' : 'from-teal-600 to-cyan-600';

  return (
    <main className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ${themeBg}`}>
      {/* Background Glows */}
      <div className={`absolute top-[-15%] left-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-teal-600/20' : 'bg-teal-300/40'}`} />
      <div className={`absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-300/40'}`} />

      <section className={`backdrop-blur-2xl p-8 sm:p-10 rounded-3xl w-full ${maxWidth} border z-10 relative transition-all duration-500 ${cardBg}`}>
        <h1 className={`text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r mb-2 ${titleGradient}`}>
          {title}
        </h1>
        <p className={`text-center mb-8 font-medium ${textSecondary}`}>{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

export function StatusMessage({ message, isError, isDarkMode = false }) {
  if (!message) return null;
  
  const errorClasses = isDarkMode 
    ? 'bg-red-500/10 text-red-300 border-red-500/20' 
    : 'bg-red-50 text-red-600 border-red-200';
  
  const successClasses = isDarkMode 
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className={`mb-6 p-4 rounded-xl font-bold text-center border animate-in fade-in duration-300 ${isError ? errorClasses : successClasses}`}>
      {message}
    </div>
  );
}

export function ThemeToggle({ isDarkMode, toggleTheme }) {
  return (
    <button 
      onClick={toggleTheme}
      className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md border transition-all z-20 ${isDarkMode ? 'bg-white/10 border-white/20 hover:bg-white/20 text-yellow-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'}`}
      title="Toggle Theme"
    >
      {isDarkMode ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
      )}
    </button>
  );
}
