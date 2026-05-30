import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Basic Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Shared Registration Data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Colombo');
  
  // Teacher Specific Registration Data
  const [subjects, setSubjects] = useState(''); 
  const [qualifications, setQualifications] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  
  // Student Specific Registration Data
  const [grade, setGrade] = useState('Grade 10');
  const [schoolName, setSchoolName] = useState('');
  const [parentContact, setParentContact] = useState('');
  
  // System State
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const districts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", 
    "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", 
    "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", 
    "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", 
    "Trincomalee", "Vavuniya"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const response = await fetch('https://quiz-platform-tau.vercel.app/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setMessage('✅ Login successful! Redirecting...');
        
        setTimeout(() => {
          if (data.user.role === 'teacher') {
            navigate('/teacher', { state: { username: data.user.username, userId: data.user.id } });
          } else {
            navigate('/student', { state: { username: data.user.username, userId: data.user.id } });
          }
        }, 1000);

      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('role', role); 
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('district', district);
        
        if (role === 'teacher') {
          formData.append('subjects', subjects);
          formData.append('qualifications', qualifications);
          if (profilePic) formData.append('profilePic', profilePic);
        }
        
        if (role === 'student') {
          formData.append('grade', grade);
          formData.append('schoolName', schoolName);
          formData.append('parentContact', parentContact);
        }

        const response = await fetch('https://quiz-platform-tau.vercel.app/api/auth/register', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setMessage('✅ Successfully registered! You can now log in.');
        setIsLogin(true); 
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Theme Classes ---
  const themeBg = isDarkMode ? 'bg-slate-950' : 'bg-slate-100';
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/90 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]';
  const textPrimary = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const titleGradient = isDarkMode ? 'from-teal-400 to-cyan-400' : 'from-teal-600 to-cyan-600';
  const inputBg = isDarkMode 
    ? 'bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus:border-teal-400' 
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10';
  const toggleBg = isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-slate-100 border-slate-200';
  const toggleBtnActive = isDarkMode 
    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
    : 'bg-white text-teal-600 border-transparent shadow-sm';
  const toggleBtnInactive = isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700';
  const optionBg = isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800';

  return (
    <div className={`min-h-screen font-sans flex items-center justify-center p-4 py-12 relative overflow-hidden transition-colors duration-500 ${themeBg} ${textPrimary}`}>
      
      {/* Theme Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md border transition-all z-20 ${isDarkMode ? 'bg-white/10 border-white/20 hover:bg-white/20 text-yellow-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'}`}
        title="Toggle Theme"
      >
        {isDarkMode ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
        )}
      </button>

      {/* CINEMATIC BOKEH BACKGROUND GLOWS */}
      <div className={`absolute top-[-15%] left-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-teal-600/20' : 'bg-teal-300/40'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-300/40'}`}></div>

      <div className={`backdrop-blur-2xl p-10 rounded-3xl w-full max-w-2xl border z-10 relative transition-all duration-500 ${cardBg}`}>
        
        <div className="flex items-center justify-center mb-4 gap-3">
          <img src="/logo.png" alt="SmartQuiz Logo" className="h-12 object-contain" />
        </div>
        <h1 className={`text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r mb-2 ${titleGradient}`}>SmartQuiz</h1>
        <p className={`text-center mb-8 font-medium ${textSecondary}`}>
          {isLogin ? 'Welcome back! Please log in.' : 'Complete your profile to get started.'}
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-center border ${
            message.includes('❌') 
              ? (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')
              : (isDarkMode ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- ONLY SHOW ROLE TOGGLE DURING REGISTRATION --- */}
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className={`flex p-1 rounded-xl mb-6 border transition-colors ${toggleBg}`}>
                <button 
                  type="button" 
                  onClick={() => setRole('student')} 
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border ${role === 'student' ? toggleBtnActive : toggleBtnInactive}`}
                >
                  Student Registration
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('teacher')} 
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border ${role === 'teacher' ? toggleBtnActive : toggleBtnInactive}`}
                >
                  Teacher Registration
                </button>
              </div>

              {/* Shared Contact Info */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6 mb-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <input type="text" placeholder="Full Legal Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={!isLogin} />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={!isLogin} />
                <input type="tel" placeholder="WhatsApp / Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={!isLogin} />
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition cursor-pointer ${inputBg}`} required={!isLogin}>
                  {districts.map(d => <option className={optionBg} key={d} value={d}>{d} District</option>)}
                </select>
              </div>

              {/* Teacher Specific Fields */}
              {role === 'teacher' && (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6 mb-4 animate-in fade-in duration-300 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <input type="text" placeholder="Subjects (e.g. Maths, ICT, Science)" value={subjects} onChange={(e) => setSubjects(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={role === 'teacher' && !isLogin} />
                  <input type="text" placeholder="Qualifications (e.g. BSc Engineering)" value={qualifications} onChange={(e) => setQualifications(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={role === 'teacher' && !isLogin} />
                  <div className={`md:col-span-2 p-4 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-teal-500/30 bg-teal-500/5' : 'border-teal-300 bg-teal-50'}`}>
                    <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>Upload Profile Picture (Optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold cursor-pointer transition ${isDarkMode ? 'text-slate-400 file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30' : 'text-slate-600 file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200'}`} />
                  </div>
                </div>
              )}

              {/* Student Specific Fields */}
              {role === 'student' && (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6 mb-4 animate-in fade-in duration-300 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <input type="text" placeholder="School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={role === 'student' && !isLogin} />
                  <input type="tel" placeholder="Parent/Guardian Contact" value={parentContact} onChange={(e) => setParentContact(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required={role === 'student' && !isLogin} />
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className={`md:col-span-2 w-full p-4 border rounded-xl font-medium focus:outline-none transition cursor-pointer ${inputBg}`} required={role === 'student' && !isLogin}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option className={optionBg} key={n} value={`Grade ${n}`}>Grade {n}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Account Credentials (Always Visible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required />
          </div>

          <button type="submit" disabled={isLoading} className={`w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-black hover:from-teal-400 hover:to-cyan-400 border transition mt-6 disabled:opacity-50 text-lg ${isDarkMode ? 'shadow-[0_0_20px_rgba(20,184,166,0.4)] border-white/20' : 'shadow-lg shadow-teal-500/30 border-transparent'}`}>
            {isLoading ? 'Processing...' : (isLogin ? 'Log In to SmartQuiz' : 'Create Account')}
          </button>
        </form>

        <p className={`text-center mt-8 text-sm font-bold ${textSecondary}`}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className={`transition ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>
            {isLogin ? 'Register here' : 'Log in here'}
          </button>
        </p>

      </div>
    </div>
  );
}