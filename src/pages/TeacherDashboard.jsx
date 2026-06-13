import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function TeacherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const username = location.state?.username || 'Teacher';
  const userId = location.state?.userId; 

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterPerformance, setStudentFilterPerformance] = useState('All'); 

  // Student Data
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [studentScores, setStudentScores] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  // Analytics Data
  const [analytics, setAnalytics] = useState({
    totalQuizzes: 0,
    totalStudents: 0,
    totalAttempts: 0,
    averageScore: 0,
    pendingRequests: 0
  });
  const [topStudents, setTopStudents] = useState([]);

  // Quiz Builder State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizGrade, setQuizGrade] = useState('Grade 10');
  const [quizAgeGroup, setQuizAgeGroup] = useState('11-13');
  const [quizImageOnly, setQuizImageOnly] = useState(false);
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [numQuestions, setNumQuestions] = useState(5);
  const [draftQuestions, setDraftQuestions] = useState([]); 
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '', subjects: '', district: '', qualifications: '', profilePic: ''
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [dataError, setDataError] = useState('');

  // Image Crop State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (!userId) { navigate('/'); return; }
    fetchRequests();
    fetchScores();
    fetchMyQuizzes();
  }, [userId, navigate]);

  // Calculate analytics
  useEffect(() => {
    const totalAttempts = studentScores.length;
    const averageScore = studentScores.length > 0 
      ? (studentScores.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 100, 0) / studentScores.length).toFixed(1)
      : 0;
    
    const uniqueStudents = new Set(studentScores.map(s => s.studentId?._id)).size;
    
    setAnalytics({
      totalQuizzes: myQuizzes.length,
      totalStudents: uniqueStudents,
      totalAttempts,
      averageScore,
      pendingRequests: enrollmentRequests.filter(r => r.status === 'pending').length
    });
    
    // Get top 3 students
    const studentPerformance = {};
    studentScores.forEach(score => {
      const studentId = score.studentId?._id;
      if (!studentPerformance[studentId]) {
        studentPerformance[studentId] = {
          name: score.studentId?.fullName || score.studentId?.username,
          totalScore: 0,
          attempts: 0
        };
      }
      studentPerformance[studentId].totalScore += (score.score / score.totalQuestions) * 100;
      studentPerformance[studentId].attempts += 1;
    });
    
    const topThree = Object.entries(studentPerformance)
      .map(([id, data]) => ({ id, ...data, average: (data.totalScore / data.attempts).toFixed(1) }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);
    
    setTopStudents(topThree);
  }, [studentScores, myQuizzes, enrollmentRequests]);

  // API Calls
  const fetchRequests = async () => {
    try {
      const res = await fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/teacher-requests/${userId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.message || 'Failed to fetch requests');
      setEnrollmentRequests(data);
    } catch (error) {
      console.error(error);
      setEnrollmentRequests([]);
      setDataError('Dashboard data could not be loaded. Please refresh and try again.');
    }
  };

  const fetchScores = async () => {
    try {
      const res = await fetch(`https://quiz-platform-tau.vercel.app/api/scores/teacher/${userId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.message || 'Failed to fetch scores');
      setStudentScores(data);
    } catch (error) {
      console.error(error);
      setStudentScores([]);
      setDataError('Dashboard data could not be loaded. Please refresh and try again.');
    }
  };

  const fetchMyQuizzes = async () => {
    try {
      const res = await fetch(`https://quiz-platform-tau.vercel.app/api/quizzes/teacher/${userId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.message || 'Failed to fetch quizzes');
      setMyQuizzes(data);
    } catch (error) {
      console.error(error);
      setMyQuizzes([]);
      setDataError('Dashboard data could not be loaded. Please refresh and try again.');
    }
  };

  const handleUpdateProfile = async () => {
    setProfileMessage('Saving...');
    try {
      const formData = new FormData();
      formData.append('fullName', profileData.fullName);
      formData.append('subjects', profileData.subjects);
      formData.append('district', profileData.district);
      formData.append('qualifications', profileData.qualifications);
      
      if (profilePicFile) {
        formData.append('profilePic', profilePicFile);
      }

      const response = await fetch(`https://quiz-platform-tau.vercel.app/api/auth/profile/${userId}`, {
        method: 'PUT',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData({ ...profileData, profilePic: data.user.profilePic });
        setProfileMessage('✅ Profile updated successfully!');
        setTimeout(() => { setIsProfileModalOpen(false); setProfileMessage(''); setProfilePicFile(null); setProfilePicPreview(''); }, 1500);
      } else { setProfileMessage('❌ Failed to update profile'); }
    } catch (error) { 
      console.error(error);
      setProfileMessage('❌ Failed to update profile'); 
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target?.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    
    try {
      const image = new Image();
      image.src = cropImage;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        
        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], 'profile-pic.jpg', { type: 'image/jpeg' });
          setProfilePicFile(croppedFile);
          setProfilePicPreview(canvas.toDataURL('image/jpeg'));
          setIsCropModalOpen(false);
          setCropImage(null);
        }, 'image/jpeg', 0.9);
      };
    } catch (error) {
      console.error('Crop error:', error);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Delete this quiz? Students will lose access.")) return;
    try {
      await fetch(`https://quiz-platform-tau.vercel.app/api/quizzes/${quizId}`, { method: 'DELETE' });
      fetchMyQuizzes(); 
    } catch (error) { console.error(error); }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      const res = await fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/approve/${enrollmentId}`, { method: 'PUT' });
      if (res.ok) fetchRequests();
    } catch (error) { console.error(error); }
  };

  const handleDecline = async (enrollmentId) => {
    try {
      const res = await fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/decline/${enrollmentId}`, { method: 'PUT' });
      if (res.ok) fetchRequests();
    } catch (error) { console.error(error); }
  };

  const handleSaveEdit = async () => {
    try {
      await fetch(`https://quiz-platform-tau.vercel.app/api/quizzes/${editingQuiz._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingQuiz.title,
          grade: editingQuiz.grade,
          ageGroup: editingQuiz.ageGroup || '',
          imageOnly: !!editingQuiz.imageOnly,
          questions: editingQuiz.questions
        })
      });
      setEditingQuiz(null);
      fetchMyQuizzes(); 
    } catch (error) { console.error(error); }
  };

  const updateEditingQuestion = (qIndex, field, value) => {
    setEditingQuiz(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const updateEditingOption = (qIndex, optIndex, value) => {
    setEditingQuiz(prev => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[qIndex].options];
      newOptions[optIndex] = value;
      newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
      return { ...prev, questions: newQuestions };
    });
  };

  // Filter functions
  const filteredQuizzes = myQuizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === 'All' || quiz.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const filteredStudentScores = studentScores.filter(score => {
    const matchesSearch = (score.studentId?.fullName || score.studentId?.username || '').toLowerCase().includes(studentSearchQuery.toLowerCase());
    const percentage = (score.score / score.totalQuestions) * 100;
    let matchesPerformance = true;
    if (studentFilterPerformance === 'Excellent') matchesPerformance = percentage >= 80;
    else if (studentFilterPerformance === 'Good') matchesPerformance = percentage >= 60 && percentage < 80;
    else if (studentFilterPerformance === 'Needs Improvement') matchesPerformance = percentage < 60;
    return matchesSearch && matchesPerformance;
  });

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;
    setIsGenerating(true); setAiError(''); setSaveMessage('');
    const formData = new FormData();
    formData.append('media', selectedFile);
    formData.append('numQuestions', numQuestions);
    formData.append('ageGroup', quizAgeGroup);
    formData.append('imageOnly', quizImageOnly ? 'true' : 'false');
    try {
      const response = await fetch('https://quiz-platform-tau.vercel.app/api/ai/generate', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed to generate questions.');
      const aiQuestions = await response.json();
      setDraftQuestions([...draftQuestions, ...aiQuestions]);
      setSaveMessage('✅ Questions generated! Review and publish below.');
    } catch (error) { setAiError(error.message); } 
    finally { setIsGenerating(false); }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleAddManualQuestion = () => {
    setDraftQuestions([...draftQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: '', hint: '', explanation: '', image: '' }]);
  };

  const handleDraftQuestionImage = (qIndex, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...draftQuestions];
      updated[qIndex] = { ...updated[qIndex], image: reader.result };
      setDraftQuestions(updated);
    };
    reader.readAsDataURL(file);
  };

  const updateDraftQuestion = (qIndex, field, value) => {
    const updated = [...draftQuestions];
    updated[qIndex][field] = value;
    setDraftQuestions(updated);
  };

  const updateDraftOption = (qIndex, optIndex, value) => {
    const updated = [...draftQuestions];
    updated[qIndex].options[optIndex] = value;
    setDraftQuestions(updated);
  };

  const removeDraftQuestion = (index) => {
    setDraftQuestions(draftQuestions.filter((_, i) => i !== index));
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle || draftQuestions.length === 0) return;
    setIsSaving(true); setSaveMessage('Saving...');
    try {
      const response = await fetch('https://quiz-platform-tau.vercel.app/api/quizzes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: quizTitle, 
          teacherId: userId, 
          grade: quizGrade, 
          ageGroup: quizAgeGroup,
          imageOnly: quizImageOnly,
          timeLimit: quizTimeLimit, 
          questions: draftQuestions 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSaveMessage('✅ ' + data.message);
        fetchMyQuizzes(); 
        setTimeout(() => { setDraftQuestions([]); setQuizTitle(''); setSelectedFile(null); setSaveMessage(''); }, 2000);
      } else throw new Error(data.message);
    } catch (error) { setSaveMessage('❌ Failed to save quiz'); } 
    finally { setIsSaving(false); }
  };

  // Theme Classes
  const themeBg = isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800';
  const navBg = isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200';
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10 backdrop-blur-md shadow-xl' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const titleGradient = isDarkMode ? 'from-teal-400 to-cyan-400' : 'from-teal-600 to-cyan-600';
  const inputBg = isDarkMode 
    ? 'bg-slate-900/50 border-white/10 text-white focus:border-teal-400' 
    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500';
  const ageGroupOptions = [
    { value: '6-8', label: '6–8 years' },
    { value: '9-10', label: '9–10 years' },
    { value: '11-13', label: '11–13 years' },
    { value: '14-16', label: '14–16 years' },
    { value: '17+', label: '17+ years' }
  ];

  const tabItems = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'manage-quizzes', label: '📚 Quizzes', icon: '📚' },
    { id: 'quiz-builder', label: '🪄 Create', icon: '🪄' },
    { id: 'student-scores', label: '📈 Results', icon: '📈' },
    { id: 'student-requests', label: '👨‍🎓 Roster', icon: '👨‍🎓' }
  ];

  return (
    <div className={`min-h-screen font-sans flex flex-col relative overflow-hidden transition-colors duration-500 ${themeBg}`}>
      {dataError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[calc(100%-2rem)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-bold text-red-700 shadow-lg">
          {dataError}
        </div>
      )}
      
      {/* Background Glows */}
      <div className={`absolute top-[-15%] left-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-teal-600/20' : 'bg-teal-300/40'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-300/40'}`}></div>

      {/* Clean Navbar */}
      <nav className={`${navBg} border-b sticky top-0 z-50 backdrop-blur-2xl transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo & Branding */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => { setActiveTab('dashboard'); }}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('dashboard'); }}
              title="Go to Dashboard"
            >
              {profileData.profilePic ? (
                <img 
                  src={profileData.profilePic} 
                  alt="Profile" 
                  className="h-10 w-10 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 flex-shrink-0 border-2 border-teal-500" 
                />
              ) : (
                <img 
                  src="/assets/logo.png" 
                  alt="SmartQuiz Logo" 
                  className="h-10 object-contain transition-transform duration-300 group-hover:scale-105 flex-shrink-0" 
                  loading="lazy"
                />
              )}
              <div className="hidden sm:block">
                <h1 className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${titleGradient}`}>SmartQuiz</h1>
                <p className={`text-xs font-bold ${textSecondary}`}>Educator</p>
              </div>
            </div>

            {/* Center: User Info */}
            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
              <span className="text-lg">👨‍🏫</span>
              <span className="font-bold text-sm">{username}</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-white/10 text-yellow-300' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Toggle Theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={() => {
                  // Fetch current profile data when opening modal
                  fetch(`https://quiz-platform-tau.vercel.app/api/auth/profile/${userId}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.user) {
                        setProfileData({
                          fullName: data.user.fullName || '',
                          subjects: data.user.subjects || '',
                          district: data.user.district || '',
                          qualifications: data.user.qualifications || '',
                          profilePic: data.user.profilePic || ''
                        });
                      }
                    })
                    .catch(err => console.error('Failed to fetch profile:', err));
                  setIsProfileModalOpen(true);
                }}
                className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                title="Profile Settings"
              >
                ⚙️
              </button>
              <button 
                onClick={() => navigate('/')}
                className={`px-4 py-2 rounded-lg font-bold transition text-sm ${isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
              >
                🚪 Exit
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`md:hidden pb-4 pt-2 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="grid grid-cols-2 gap-2">
                {tabItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
                      activeTab === item.id
                        ? isDarkMode ? 'bg-teal-500/30 text-teal-300' : 'bg-teal-100 text-teal-700'
                        : isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Desktop Tab Navigation */}
      <div className={`hidden md:flex border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/30'}`}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex space-x-1">
          {tabItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-4 font-bold border-b-2 transition ${
                activeTab === item.id
                  ? isDarkMode ? 'border-teal-400 text-teal-300' : 'border-teal-600 text-teal-700'
                  : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h1 className={`text-4xl font-black mb-2 ${textPrimary}`}>Welcome back! 👋</h1>
              <p className={`text-lg font-medium mb-8 ${textSecondary}`}>Here's your class overview</p>
              
              {/* Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Quizzes', value: analytics.totalQuizzes, icon: '📚', color: 'teal' },
                  { label: 'Students', value: analytics.totalStudents, icon: '👨‍🎓', color: 'cyan' },
                  { label: 'Attempts', value: analytics.totalAttempts, icon: '📝', color: 'emerald' },
                  { label: 'Avg Score', value: `${analytics.averageScore}%`, icon: '⭐', color: 'amber' },
                  { label: 'Pending', value: analytics.pendingRequests, icon: '🔔', color: analytics.pendingRequests > 0 ? 'red' : 'slate', highlight: analytics.pendingRequests > 0 }
                ].map((stat, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${cardBg}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-3xl font-black ${stat.highlight ? 'text-red-500' : textPrimary}`}>{stat.value}</p>
                        <p className={`text-xs font-bold mt-2 ${textSecondary}`}>{stat.label}</p>
                      </div>
                      <div className="text-2xl">{stat.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leaderboard & Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Students */}
                <div className={`p-6 rounded-2xl border ${cardBg}`}>
                  <h3 className={`text-lg font-black mb-4 ${textPrimary}`}>🏆 Top Students</h3>
                  <div className="space-y-2">
                    {topStudents.length > 0 ? topStudents.map((s, idx) => (
                      <div key={s.id} className={`p-3 rounded-lg flex justify-between items-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                          <span className="font-bold text-sm">{s.name}</span>
                        </div>
                        <span className="font-black text-teal-500">{s.average}%</span>
                      </div>
                    )) : (
                      <p className={`text-center py-6 ${textSecondary}`}>No data yet</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={`p-6 rounded-2xl border ${cardBg}`}>
                  <h3 className={`text-lg font-black mb-4 ${textPrimary}`}>⚡ Quick Actions</h3>
                  <div className="space-y-2">
                    <button onClick={() => setActiveTab('quiz-builder')} className={`w-full p-3 rounded-lg font-bold text-sm transition text-left ${isDarkMode ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>➕ New Quiz</button>
                    <button onClick={() => setActiveTab('student-requests')} className={`w-full p-3 rounded-lg font-bold text-sm transition text-left ${isDarkMode ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}>👨‍🎓 Requests ({analytics.pendingRequests})</button>
                    <button onClick={() => setActiveTab('student-scores')} className={`w-full p-3 rounded-lg font-bold text-sm transition text-left ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>📊 Results</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAGE QUIZZES TAB */}
          {activeTab === 'manage-quizzes' && (
            <div className="animate-in fade-in duration-300">
              <h1 className={`text-3xl font-black mb-6 ${textPrimary}`}>📚 My Quizzes</h1>
              
              {!editingQuiz ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`p-3 border rounded-lg focus:outline-none ${inputBg}`} />
                    <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className={`p-3 border rounded-lg focus:outline-none ${inputBg}`}>
                      <option value="All">All Grades</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option key={n} value={`Grade ${n}`}>Grade {n}</option>)}
                    </select>
                    <div className={`p-3 rounded-lg font-bold ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>{filteredQuizzes.length} found</div>
                  </div>

                  {filteredQuizzes.length === 0 ? (
                    <div className={`p-12 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                      <p className="text-4xl mb-2">📚</p>
                      <p className={`font-bold ${textSecondary}`}>No quizzes yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredQuizzes.map(quiz => {
                        const attempts = studentScores.filter(s => s.quizId?._id === quiz._id).length;
                        const avg = attempts > 0 
                          ? (studentScores.filter(s => s.quizId?._id === quiz._id).reduce((sum, s) => sum + (s.score / s.totalQuestions) * 100, 0) / attempts).toFixed(1)
                          : 'N/A';
                        
                        return (
                          <div key={quiz._id} className={`p-4 rounded-xl border transition hover:-translate-y-1 ${cardBg}`}>
                            <h3 className={`font-bold text-sm mb-2 ${textPrimary}`}>{quiz.title}</h3>
                            <div className={`text-xs ${textSecondary} mb-3 space-y-1`}>
                              <p>🎓 {quiz.grade}</p>
                              <p>📝 {quiz.questions?.length} Q's</p>
                              <p>📊 {attempts} attempts · {avg}%</p>
                            </div>
                            {quiz.ageGroup && <div className={`mb-3 inline-flex text-[11px] font-bold px-2 py-1 rounded-full border ${isDarkMode ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}>Age {quiz.ageGroup}</div>}
                            <div className="flex gap-2">
                              <button onClick={() => setEditingQuiz(quiz)} className={`flex-1 px-2 py-2 rounded text-xs font-bold transition ${isDarkMode ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>✏️ Edit</button>
                              <button onClick={() => handleDeleteQuiz(quiz._id)} className={`flex-1 px-2 py-2 rounded text-xs font-bold transition ${isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>🗑️ Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setEditingQuiz(null)} className={`flex items-center gap-2 font-bold ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>← Back</button>
                  <div className={`p-6 rounded-2xl border space-y-4 ${cardBg}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-xs font-bold mb-1 block ${textSecondary}`}>Title</label>
                        <input type="text" value={editingQuiz.title} onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`} />
                      </div>
                      <div>
                        <label className={`text-xs font-bold mb-1 block ${textSecondary}`}>Grade</label>
                        <select value={editingQuiz.grade} onChange={(e) => setEditingQuiz({...editingQuiz, grade: e.target.value})} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`}>
                          {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option key={n} value={`Grade ${n}`}>Grade {n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs font-bold mb-1 block ${textSecondary}`}>Age Group</label>
                        <select value={editingQuiz.ageGroup || ''} onChange={(e) => setEditingQuiz({...editingQuiz, ageGroup: e.target.value})} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`}>
                          <option value="">Not set</option>
                          {ageGroupOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 md:col-span-2">
                        <input id="edit-image-only" type="checkbox" checked={!!editingQuiz.imageOnly} onChange={(e) => setEditingQuiz({ ...editingQuiz, imageOnly: e.target.checked })} />
                        <label htmlFor="edit-image-only" className={`text-sm font-bold ${textSecondary}`}>Image-only quiz</label>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {editingQuiz.questions.map((q, qIdx) => (
                        <div key={qIdx} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                          <p className={`text-xs font-bold mb-2 ${textSecondary}`}>Q{qIdx + 1}</p>
                          <textarea value={q.questionText} onChange={(e) => updateEditingQuestion(qIdx, 'questionText', e.target.value)} placeholder={editingQuiz.imageOnly ? 'Optional short prompt' : 'Question text'} className={`w-full p-2 border rounded text-sm mb-2 focus:outline-none ${inputBg}`} rows="2" />
                          {q.image && <img src={q.image} alt={`Question ${qIdx + 1}`} className="mb-2 w-full max-h-48 object-contain rounded-lg border" />}
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((o, oIdx) => (
                              <input key={oIdx} type="text" value={o} onChange={(e) => updateEditingOption(qIdx, oIdx, e.target.value)} className={`p-2 border rounded text-xs focus:outline-none ${inputBg}`} />
                            ))}
                          </div>
                            <textarea value={q.hint || ''} onChange={(e) => updateEditingQuestion(qIdx, 'hint', e.target.value)} className={`w-full mt-2 p-2 border rounded text-xs focus:outline-none ${inputBg}`} rows="2" placeholder="Hint for students" />
                            <textarea value={q.explanation || ''} onChange={(e) => updateEditingQuestion(qIdx, 'explanation', e.target.value)} className={`w-full mt-2 p-2 border rounded text-xs focus:outline-none ${inputBg}`} rows="2" placeholder="Answer explanation" />
                          <select value={q.correctAnswer} onChange={(e) => updateEditingQuestion(qIdx, 'correctAnswer', e.target.value)} className={`w-full mt-2 p-2 border rounded text-xs focus:outline-none ${inputBg}`}>
                            {q.options.map((o, i) => <option key={i} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    
                    <button onClick={handleSaveEdit} className={`w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 transition`}>💾 Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUIZ BUILDER TAB */}
          {activeTab === 'quiz-builder' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <h1 className={`text-3xl font-black ${textPrimary}`}>🪄 Create Quiz</h1>
              
              <div className={`p-6 rounded-2xl border ${cardBg}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className={`text-xs font-bold mb-2 block ${textSecondary}`}>Title</label>
                    <input type="text" placeholder="Quiz name" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-bold mb-2 block ${textSecondary}`}>Grade</label>
                    <select value={quizGrade} onChange={(e) => setQuizGrade(e.target.value)} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`}>
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option key={n} value={`Grade ${n}`}>Grade {n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-bold mb-2 block ${textSecondary}`}>Age Group</label>
                    <select value={quizAgeGroup} onChange={(e) => setQuizAgeGroup(e.target.value)} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`}>
                      {ageGroupOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 self-end pb-2">
                    <input id="image-only" type="checkbox" checked={quizImageOnly} onChange={(e) => setQuizImageOnly(e.target.checked)} />
                    <label htmlFor="image-only" className={`text-sm font-bold ${textSecondary}`}>Image-only quiz</label>
                  </div>
                  <div>
                    <label className={`text-xs font-bold mb-2 block ${textSecondary}`}>Time (min)</label>
                    <input type="number" min="0" value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(Number(e.target.value))} className={`w-full p-3 border rounded-lg focus:outline-none ${inputBg}`} />
                  </div>
                </div>

                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-200' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                  AI will tailor wording, examples, and difficulty for the selected age group.
                </div>

                {/* PDF / Image Upload */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition mb-4 ${
                    selectedFile
                      ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
                      : isDarkMode ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-300'
                  }`}
                >
                  <input type="file" id="media" accept=".pdf,image/*" onChange={(e) => setSelectedFile(e.target.files?.[0])} className="hidden" />
                  <label htmlFor="media" className="cursor-pointer block">
                    <p className="text-3xl mb-2">{selectedFile ? '✅' : '📄🖼️'}</p>
                    <p className="font-bold">{selectedFile ? selectedFile.name : 'Drop PDF or Image / Click'}</p>
                  </label>
                </div>

                {/* AI Generate */}
                <div className="flex gap-3 mb-4">
                  <input type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} placeholder="# Questions" className={`w-24 p-3 border rounded-lg focus:outline-none ${inputBg}`} />
                  <button onClick={handleGenerateQuiz} disabled={!selectedFile || isGenerating} className={`flex-1 font-bold py-3 rounded-lg transition ${
                    !selectedFile || isGenerating
                      ? isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-300 text-slate-500'
                      : isDarkMode ? 'bg-teal-500 text-white hover:bg-teal-400' : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}>
                    {isGenerating ? '⏳ Generating...' : '🚀 Generate'}
                  </button>
                </div>

                {aiError && <p className={`p-3 rounded-lg font-bold mb-4 ${isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>❌ {aiError}</p>}
                {saveMessage && <p className={`p-3 rounded-lg font-bold mb-4 ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>{saveMessage}</p>}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {draftQuestions.map((q, qIdx) => (
                  <div key={qIdx} className={`p-6 rounded-2xl border relative ${cardBg}`}>
                    <button onClick={() => removeDraftQuestion(qIdx)} className={`absolute top-4 right-4 font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>✕</button>
                    <p className={`text-xs font-bold mb-2 ${textSecondary}`}>Question {qIdx + 1}</p>
                    <textarea value={q.questionText} onChange={(e) => updateDraftQuestion(qIdx, 'questionText', e.target.value)} placeholder={quizImageOnly ? 'Optional short prompt' : 'Question text'} className={`w-full p-3 border rounded-lg mb-3 focus:outline-none ${inputBg}`} rows="2" />
                    {q.image && (
                      <img src={q.image} alt={`Question ${qIdx + 1}`} className="mb-3 w-full max-h-56 object-contain rounded-lg border" />
                    )}
                    <div className="mb-3 flex items-center gap-3">
                      <label className={`text-xs font-bold px-3 py-2 rounded-lg border cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'}`}>
                        📷 Add Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftQuestionImage(qIdx, e.target.files?.[0])} />
                      </label>
                      {q.image && <button type="button" onClick={() => updateDraftQuestion(qIdx, 'image', '')} className={`text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Remove image</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {q.options.map((o, oIdx) => (
                        <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} value={o} onChange={(e) => updateDraftOption(qIdx, oIdx, e.target.value)} className={`p-2 border rounded focus:outline-none text-sm ${inputBg}`} />
                      ))}
                    </div>
                      <textarea value={q.hint || ''} onChange={(e) => updateDraftQuestion(qIdx, 'hint', e.target.value)} className={`w-full p-2 border rounded focus:outline-none text-sm mb-3 ${inputBg}`} rows="2" placeholder="Hint for students" />
                      <textarea value={q.explanation || ''} onChange={(e) => updateDraftQuestion(qIdx, 'explanation', e.target.value)} className={`w-full p-2 border rounded focus:outline-none text-sm mb-3 ${inputBg}`} rows="2" placeholder="Answer explanation" />
                    <select value={q.correctAnswer} onChange={(e) => updateDraftQuestion(qIdx, 'correctAnswer', e.target.value)} className={`w-full p-2 border rounded focus:outline-none text-sm font-bold ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
                      <option value="">Select Answer</option>
                      {q.options.filter(o => o).map((o, i) => <option key={i} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sticky bottom-8">
                <button onClick={handleAddManualQuestion} className={`flex-1 border-2 border-dashed font-bold py-3 rounded-lg transition ${isDarkMode ? 'bg-white/5 border-teal-500/50 text-teal-300 hover:bg-white/10' : 'bg-white/80 border-teal-400 text-teal-700 hover:bg-teal-50'}`}>➕ Add Question</button>
                {draftQuestions.length > 0 && (
                  <button onClick={handleSaveQuiz} disabled={!quizTitle || isSaving} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition">
                    {isSaving ? 'Saving...' : '💾 Publish'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STUDENT RESULTS TAB */}
          {activeTab === 'student-scores' && (
            <div className="animate-in fade-in duration-300">
              <h1 className={`text-3xl font-black mb-6 ${textPrimary}`}>📈 Student Performance</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input type="text" placeholder="🔍 Student name" value={studentSearchQuery} onChange={(e) => setStudentSearchQuery(e.target.value)} className={`p-3 border rounded-lg focus:outline-none ${inputBg}`} />
                <select value={studentFilterPerformance} onChange={(e) => setStudentFilterPerformance(e.target.value)} className={`p-3 border rounded-lg focus:outline-none ${inputBg}`}>
                  <option value="All">All Levels</option>
                  <option value="Excellent">Excellent (80%+)</option>
                  <option value="Good">Good (60-79%)</option>
                  <option value="Needs Improvement">Needs Help (&lt;60%)</option>
                </select>
                <div className={`p-3 rounded-lg font-bold ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>{filteredStudentScores.length} results</div>
              </div>

              {filteredStudentScores.length === 0 ? (
                <div className={`p-12 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                  <p className="text-3xl mb-2">📊</p>
                  <p className={`font-bold ${textSecondary}`}>No results</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudentScores.map(s => {
                    const pct = (s.score / s.totalQuestions) * 100;
                    const color = pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red';
                    return (
                      <div key={s._id} className={`p-4 rounded-xl border flex justify-between items-center ${cardBg}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${isDarkMode ? 'bg-teal-500/30' : 'bg-teal-200'}`}>{s.studentId?.fullName?.[0] || '?'}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm truncate ${textPrimary}`}>{s.studentId?.fullName || s.studentId?.username}</p>
                            <p className={`text-xs ${textSecondary}`}>{s.quizId?.title}</p>
                          </div>
                        </div>
                        <div className={`font-black text-lg ${
                          color === 'emerald' ? 'text-emerald-500' :
                          color === 'amber' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {pct.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CLASS ROSTER TAB */}
          {activeTab === 'student-requests' && (
            <div className="animate-in fade-in duration-300">
              <h1 className={`text-3xl font-black mb-6 ${textPrimary}`}>👨‍🎓 Class Roster</h1>
              {(() => {
                const visibleRequests = enrollmentRequests.filter(r => r.status !== 'declined');
                return (
                  <>
              
                  {visibleRequests.length === 0 ? (
                    <div className={`p-12 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                      <p className="text-3xl mb-2">👨‍🎓</p>
                      <p className={`font-bold ${textSecondary}`}>No requests</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleRequests.map(r => (
                        <div key={r._id} className={`p-4 rounded-xl border ${cardBg}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${isDarkMode ? 'bg-teal-500/30' : 'bg-teal-200'}`}>{r.studentId?.fullName?.[0] || '?'}</div>
                            <div className="flex-1">
                              <p className={`font-bold ${textPrimary}`}>{r.studentId?.fullName || r.studentId?.username}</p>
                              <p className={`text-xs ${textSecondary}`}>{r.grade}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${r.status === 'pending' ? (isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700') : (isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700')}`}>
                              {r.status === 'pending' ? '⏳ Pending' : '✅ Approved'}
                            </span>
                          </div>
                          {r.status === 'pending' ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => handleApprove(r._id)} className={`w-full font-bold py-2 rounded-lg transition text-sm ${isDarkMode ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>✓ Approve</button>
                              <button onClick={() => handleDecline(r._id)} className={`w-full font-bold py-2 rounded-lg transition text-sm ${isDarkMode ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>✕ Decline</button>
                            </div>
                          ) : (
                            <div className={`w-full text-center font-bold py-2 rounded-lg text-sm ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>✓ Enrolled</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  </>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* CROP MODAL */}
      {isCropModalOpen && (
        <div className={`fixed inset-0 backdrop-blur-lg flex items-center justify-center p-4 z-50 transition-colors ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-800/40'}`}>
          <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full border animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900/90 border-teal-500/30' : 'bg-white border-teal-300'}`}>
            <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>Crop Your Photo</h3>
            
            <div className="relative w-full h-80 bg-slate-900 rounded-lg mb-4 overflow-hidden">
              {cropImage && (
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="mb-4">
              <label className={`text-xs font-bold block mb-2 ${textSecondary}`}>Zoom</label>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsCropModalOpen(false);
                  setCropImage(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold transition ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleCropConfirm}
                className="flex-1 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 transition"
              >
                ✓ Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className={`fixed inset-0 backdrop-blur-lg flex items-center justify-center p-4 z-50 transition-colors ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-800/40'}`}>
          <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full border animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] ${isDarkMode ? 'bg-slate-900/90 border-teal-500/30' : 'bg-white border-teal-300'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${textPrimary}`}>Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className={`font-bold transition ${isDarkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}>✕</button>
            </div>
            
            {/* Profile Picture Upload */}
            <div className="mb-6">
              <label className={`text-xs font-bold mb-3 block ${textSecondary}`}>Profile Picture</label>
              <div className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition mb-3 ${profilePicFile || profilePicPreview ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300') : (isDarkMode ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-300')}`}>
                <input 
                  type="file" 
                  id="profilePicInput" 
                  accept="image/*" 
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
                <label htmlFor="profilePicInput" className="cursor-pointer block">
                  {profilePicPreview ? (
                    <div className="space-y-2">
                      <img src={profilePicPreview} alt="Preview" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-teal-500" />
                      <p className="text-xs font-bold">📷 Change Photo</p>
                    </div>
                  ) : profileData.profilePic ? (
                    <div className="space-y-2">
                      <img src={profileData.profilePic} alt="Current" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-teal-500" />
                      <p className="text-xs font-bold">📷 Change Photo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-2xl">📷</p>
                      <p className="text-xs font-bold">Click or Drag Photo</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <input type="text" placeholder="Full Name" value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} className={`w-full p-3 border rounded-lg text-sm focus:outline-none ${inputBg}`} />
              <input type="text" placeholder="Subjects" value={profileData.subjects} onChange={(e) => setProfileData({...profileData, subjects: e.target.value})} className={`w-full p-3 border rounded-lg text-sm focus:outline-none ${inputBg}`} />
              <input type="text" placeholder="District" value={profileData.district} onChange={(e) => setProfileData({...profileData, district: e.target.value})} className={`w-full p-3 border rounded-lg text-sm focus:outline-none ${inputBg}`} />
              <input type="text" placeholder="Qualifications" value={profileData.qualifications} onChange={(e) => setProfileData({...profileData, qualifications: e.target.value})} className={`w-full p-3 border rounded-lg text-sm focus:outline-none ${inputBg}`} />
            </div>
            {profileMessage && <div className={`mb-3 p-3 rounded-lg font-bold text-center text-sm border ${profileMessage.includes('❌') ? (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200') : (isDarkMode ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}`}>{profileMessage}</div>}
            <button onClick={handleUpdateProfile} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
