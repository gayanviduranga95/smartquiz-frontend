import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { API_URL } from '../config';
import useThemeMode from '../hooks/useThemeMode';
import { AuthShell, StatusMessage, ThemeToggle } from '../components/AuthLayout';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useThemeMode();
  
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
  const [rememberMe, setRememberMe] = useState(true);

  // Image Crop State
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const file = new File([croppedImageBlob], "profile-pic.jpg", { type: "image/jpeg" });
      setProfilePic(file);
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      setMessage('❌ Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

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
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // --- Persistence Logic ---
        if (rememberMe) {
          localStorage.setItem('smartquiz-user', JSON.stringify({
            id: data.user.id,
            username: data.user.username,
            role: data.user.role
          }));
        }

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

        const response = await fetch(`${API_URL}/api/auth/register`, {
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
  const inputBg = isDarkMode 
    ? 'bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus:border-teal-400' 
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10';
  const toggleBg = isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-slate-100 border-slate-200';
  const toggleBtnActive = isDarkMode 
    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
    : 'bg-white text-teal-600 border-transparent shadow-sm';
  const toggleBtnInactive = isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700';
  const optionBg = isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <AuthShell 
      title="SmartQuiz" 
      subtitle={isLogin ? 'Welcome back! Please log in.' : 'Complete your profile to get started.'}
      isDarkMode={isDarkMode}
      maxWidth={isLogin ? 'max-w-md' : 'max-w-2xl'}
    >
      <ThemeToggle isDarkMode={isDarkMode} toggleTheme={setIsDarkMode} />

      <StatusMessage message={message} isError={message.includes('❌')} isDarkMode={isDarkMode} />

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* --- ONLY SHOW ROLE TOGGLE DURING REGISTRATION --- */}
        {!isLogin && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`flex flex-col sm:flex-row p-1 rounded-xl mb-6 border transition-colors ${toggleBg}`}>
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
                  <div className="flex items-center gap-4">
                    {profilePic && (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-teal-500">
                        <img src={URL.createObjectURL(profilePic)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={onFileChange} className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold cursor-pointer transition ${isDarkMode ? 'text-slate-400 file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30' : 'text-slate-600 file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200'}`} />
                  </div>
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
        <div className={`grid grid-cols-1 ${isLogin ? 'gap-4' : 'md:grid-cols-2 gap-4 pt-2'}`}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} required />
        </div>
        
        {isLogin && (
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className={`text-sm font-bold transition ${isDarkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-700'}`}>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className={`text-sm font-bold transition ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
            >
              Forgot password?
            </Link>
          </div>
        )}

        <button type="submit" disabled={isLoading} className={`w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-black hover:from-teal-400 hover:to-cyan-400 border transition mt-2 disabled:opacity-50 text-lg ${isDarkMode ? 'shadow-[0_0_20px_rgba(20,184,166,0.4)] border-white/20' : 'shadow-lg shadow-teal-500/30 border-transparent'}`}>
          {isLoading ? 'Processing...' : (isLogin ? 'Log In to SmartQuiz' : 'Create Account')}
        </button>
      </form>

      <p className={`text-center mt-8 text-sm font-bold ${textSecondary}`}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)} className={`transition ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>
          {isLogin ? 'Register here' : 'Log in here'}
        </button>
      </p>

      {/* --- IMAGE CROPPER MODAL --- */}
      {showCropper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl overflow-hidden border transition-all ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold">Crop Profile Picture</h2>
              <button onClick={handleCropCancel} className="p-2 hover:bg-white/10 rounded-full transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="relative h-80 bg-slate-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleCropCancel}
                  className={`flex-1 py-3 rounded-xl font-bold border transition ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropSave}
                  className="flex-1 py-3 rounded-xl font-black bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-400 hover:to-cyan-400 shadow-lg shadow-teal-500/20 transition"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
