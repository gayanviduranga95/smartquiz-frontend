import React from 'react';

const Sidebar = ({ isDarkMode, activeTab, setActiveTab, tabs, user, onLogout }) => {
  const sidebarBg = isDarkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const titleGradient = isDarkMode ? 'from-teal-400 to-cyan-400' : 'from-teal-600 to-cyan-600';

  return (
    <aside className={`w-72 backdrop-blur-2xl border-r flex flex-col hidden lg:flex z-10 shadow-2xl transition-all duration-500 ${sidebarBg}`}>
      <div className={`p-8 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="flex items-center gap-4 mb-2">
          <div className={`p-2 rounded-2xl ${isDarkMode ? 'bg-teal-500/20' : 'bg-teal-500'}`}>
            <img src="/assets/favicon.png" alt="Logo" className="w-8 h-8 brightness-0 invert" />
          </div>
          <div>
            <h1 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tighter ${titleGradient}`}>SmartQuiz</h1>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-teal-500/70' : 'text-teal-600'}`}>{user.role} Portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-2 overflow-y-auto">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Main Menu</p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all duration-300 group ${
              activeTab === tab.id
                ? (isDarkMode ? 'bg-teal-500/20 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.15)]' : 'bg-teal-500 text-white shadow-lg shadow-teal-500/30')
                : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')
            }`}
          >
            <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
            {activeTab === tab.id && (
              <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-teal-400' : 'bg-white'}`} />
            )}
          </button>
        ))}
      </div>

      <div className={`p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
        <div className={`p-4 rounded-2xl mb-4 flex items-center gap-3 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-500 text-white'}`}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-black truncate ${textPrimary}`}>{user.username}</p>
            <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Active Session</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all duration-300 border ${
            isDarkMode 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
              : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
          }`}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
