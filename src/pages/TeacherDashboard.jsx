import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const username = location.state?.username || 'Teacher';
  const userId = location.state?.userId; 

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [activeTab, setActiveTab] = useState('manage-quizzes'); 

  // --- Student Data ---
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [studentScores, setStudentScores] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null); 

  // --- Hybrid Builder State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const [quizTitle, setQuizTitle] = useState('');
  const [quizGrade, setQuizGrade] = useState('Grade 10');
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [numQuestions, setNumQuestions] = useState(5);
  const [draftQuestions, setDraftQuestions] = useState([]); 
  
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Profile Settings State ---
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '', subjects: '', district: '', qualifications: ''
  });
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    if (!userId) { navigate('/'); return; }
    fetchRequests();
    fetchScores();
    fetchMyQuizzes();
  }, [userId, navigate]);

  const fetchRequests = async () => {
    const res = await fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/teacher-requests/${userId}`);
    setEnrollmentRequests(await res.json());
  };

  const fetchScores = async () => {
    const res = await fetch(`https://quiz-platform-tau.vercel.app/api/scores/teacher/${userId}`);
    setStudentScores(await res.json());
  };

  const fetchMyQuizzes = async () => {
    const res = await fetch(`https://quiz-platform-tau.vercel.app/api/quizzes/teacher/${userId}`);
    setMyQuizzes(await res.json());
  };

  const handleUpdateProfile = async () => {
    setProfileMessage('Saving...');
    try {
      const response = await fetch(`https://quiz-platform-tau.vercel.app/api/auth/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        setProfileMessage('✅ Profile updated successfully!');
        setTimeout(() => { setIsProfileModalOpen(false); setProfileMessage(''); }, 1500);
      } else { setProfileMessage('❌ Failed to update profile'); }
    } catch (error) { setProfileMessage('❌ Failed to update profile'); }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? Students will lose access to it.")) return;
    try {
      await fetch(`https://quiz-platform-tau.vercel.app/api/quizzes/${quizId}`, { method: 'DELETE' });
      fetchMyQuizzes(); 
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

  const handleApprove = async (enrollmentId) => {
    const res = await fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/approve/${enrollmentId}`, { method: 'PUT' });
    if (res.ok) fetchRequests();
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;
    setIsGenerating(true); setAiError(''); setSaveMessage('');
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('numQuestions', numQuestions);
    try {
      const response = await fetch('https://quiz-platform-tau.vercel.app/api/ai/generate', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed to generate questions.');
      const aiQuestions = await response.json();
      setDraftQuestions([...draftQuestions, ...aiQuestions]);
    } catch (error) { setAiError(error.message); } 
    finally { setIsGenerating(false); }
  };

  const handleAddManualQuestion = () => {
    setDraftQuestions([...draftQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
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

  // --- Dynamic Theme Classes ---
  const themeBg = isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800';
  const navBg = isDarkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-slate-200';
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10 backdrop-blur-md shadow-xl' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const titleGradient = isDarkMode ? 'from-teal-400 to-cyan-400' : 'from-teal-600 to-cyan-600';
  const inputBg = isDarkMode 
    ? 'bg-slate-900/50 border-white/10 text-white focus:border-teal-400' 
    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10';

  return (
    <div className={`min-h-screen font-sans flex flex-col relative overflow-hidden transition-colors duration-500 ${themeBg}`}>
      
      {/* Theme Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-4 right-8 p-3 rounded-full backdrop-blur-md border transition-all z-50 ${isDarkMode ? 'bg-white/10 border-white/20 hover:bg-white/20 text-yellow-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-md'}`}
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

      <nav className={`backdrop-blur-2xl shadow-sm border-b px-8 py-4 flex justify-between items-center z-10 relative transition-colors duration-500 ${navBg}`}>
        <h1 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${titleGradient}`}>SmartQuiz Educator</h1>
        <div className="flex items-center gap-4 mr-16"> {/* Added mr-16 to avoid overlapping with theme toggle */}
          <span className={`font-bold px-4 py-2 rounded-full border ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>Instructor: {username}</span>
          <button onClick={() => setIsProfileModalOpen(true)} className={`text-xl p-2 rounded-full transition ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`} title="Profile Settings">⚙️</button>
          <button onClick={() => navigate('/')} className={`text-sm font-bold transition ml-2 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>Log Out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8 w-full flex-1 z-10 relative">
        <div className={`flex space-x-6 mb-8 border-b pb-px overflow-x-auto ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <button onClick={() => {setActiveTab('manage-quizzes'); setEditingQuiz(null);}} className={`pb-4 font-bold text-lg px-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'manage-quizzes' ? (isDarkMode ? 'border-teal-400 text-teal-300' : 'border-teal-600 text-teal-700') : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>Manage Quizzes</button>
          <button onClick={() => setActiveTab('quiz-builder')} className={`pb-4 font-bold text-lg px-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'quiz-builder' ? (isDarkMode ? 'border-teal-400 text-teal-300' : 'border-teal-600 text-teal-700') : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>Quiz Builder</button>
          <button onClick={() => setActiveTab('student-scores')} className={`pb-4 font-bold text-lg px-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'student-scores' ? (isDarkMode ? 'border-teal-400 text-teal-300' : 'border-teal-600 text-teal-700') : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>Student Results</button>
          <button onClick={() => setActiveTab('student-requests')} className={`pb-4 font-bold text-lg px-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'student-requests' ? (isDarkMode ? 'border-teal-400 text-teal-300' : 'border-teal-600 text-teal-700') : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>Class Roster</button>
        </div>

        {/* --- MANAGE QUIZZES --- */}
        {activeTab === 'manage-quizzes' && (
          <div className="animate-in fade-in duration-300">
            {!editingQuiz ? (
              <>
                <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>My Saved Quizzes</h2>
                <p className={`font-medium mb-8 ${textSecondary}`}>Edit your AI-generated questions or remove outdated materials.</p>
                {myQuizzes.length === 0 ? (
                  <div className={`p-12 rounded-2xl border-dashed border-2 text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-300'}`}><p className={`font-bold ${textSecondary}`}>You haven't published any quizzes yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myQuizzes.map(quiz => (
                      <div key={quiz._id} className={`p-6 rounded-2xl border transition flex flex-col justify-between ${cardBg} ${isDarkMode ? 'hover:border-teal-500/50' : 'hover:border-teal-400'}`}>
                        <div className="mb-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-xl font-bold ${textPrimary}`}>{quiz.title}</h3>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isDarkMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>{quiz.grade}</span>
                          </div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{quiz.questions?.length || 0} Questions • {quiz.timeLimit > 0 ? `${quiz.timeLimit} Min Limit` : 'No Time Limit'}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setEditingQuiz(quiz)} className={`flex-1 font-bold py-2 rounded-xl transition border ${isDarkMode ? 'bg-white/5 text-teal-300 border-transparent hover:bg-teal-500/20 hover:border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}`}>✏️ Edit</button>
                          <button onClick={() => handleDeleteQuiz(quiz._id)} className={`flex-1 font-bold py-2 rounded-xl border transition ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>🗑️ Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="animate-in slide-in-from-right-8 duration-300">
                <button onClick={() => setEditingQuiz(null)} className={`font-bold flex items-center gap-2 mb-6 transition ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>← Back to Quizzes</button>
                <div className={`p-8 rounded-2xl border mb-8 ${cardBg}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className={`block text-sm font-bold uppercase tracking-widest mb-2 ${textSecondary}`}>Quiz Title</label>
                      <input type="text" value={editingQuiz.title} onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})} className={`w-full p-4 border rounded-xl font-bold focus:outline-none transition ${inputBg}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold uppercase tracking-widest mb-2 ${textSecondary}`}>Target Grade</label>
                      <select value={editingQuiz.grade} onChange={(e) => setEditingQuiz({...editingQuiz, grade: e.target.value})} className={`w-full p-4 border rounded-xl font-bold focus:outline-none transition ${inputBg}`}>
                         {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"} key={n} value={`Grade ${n}`}>Grade {n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {editingQuiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className={`p-8 rounded-2xl border ${cardBg}`}>
                      <div className="mb-4">
                        <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Question {qIndex + 1}</label>
                        <textarea value={q.questionText} onChange={(e) => updateEditingQuestion(qIndex, 'questionText', e.target.value)} className={`w-full p-4 border rounded-xl font-medium focus:outline-none transition ${inputBg}`} rows="2" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex}>
                            <label className={`block text-xs font-bold mb-1 ${textSecondary}`}>Option {optIndex + 1}</label>
                            <input type="text" value={opt} onChange={(e) => updateEditingOption(qIndex, optIndex, e.target.value)} className={`w-full p-3 border rounded-lg text-sm font-medium focus:outline-none transition ${inputBg}`} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Correct Answer</label>
                        <select value={q.correctAnswer} onChange={(e) => updateEditingQuestion(qIndex, 'correctAnswer', e.target.value)} className={`w-full p-3 border rounded-lg text-sm font-bold focus:outline-none transition ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 focus:border-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}`}>
                          {q.options.map((opt, i) => <option className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"} key={i} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 mb-12 sticky bottom-8">
                  <button onClick={handleSaveEdit} className={`w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black text-lg py-4 rounded-xl hover:from-teal-400 hover:to-cyan-400 transition border ${isDarkMode ? 'shadow-[0_0_20px_rgba(20,184,166,0.4)] border-white/20' : 'shadow-lg shadow-teal-500/30 border-transparent'}`}>💾 Save Changes to Quiz</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- HYBRID QUIZ BUILDER --- */}
        {activeTab === 'quiz-builder' && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div className={`p-8 rounded-2xl border ${cardBg}`}>
              <h2 className={`text-2xl font-black mb-6 ${textPrimary}`}>Create a New Quiz</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-2 ${textSecondary}`}>Quiz Title</label>
                  <input type="text" placeholder="e.g., Physics Midterm" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className={`w-full p-4 border rounded-xl font-bold focus:outline-none transition ${inputBg}`} />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-2 ${textSecondary}`}>Target Grade</label>
                  <select value={quizGrade} onChange={(e) => setQuizGrade(e.target.value)} className={`w-full p-4 border rounded-xl font-bold focus:outline-none transition ${inputBg}`}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"} key={n} value={`Grade ${n}`}>Grade {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-2 ${textSecondary}`}>Time Limit (Minutes)</label>
                  <input type="number" min="0" value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(Number(e.target.value))} className={`w-full p-4 border rounded-xl font-bold focus:outline-none transition ${inputBg}`} />
                  <p className={`text-xs mt-1 ${textSecondary}`}>Set to 0 for no time limit.</p>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-200'}`}>
                <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>🪄 AI Question Generator</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <input type="file" accept="application/pdf" onChange={(e) => setSelectedFile(e.target.files[0])} className={`block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold cursor-pointer transition ${isDarkMode ? 'text-slate-400 file:bg-white/10 file:text-teal-300 hover:file:bg-white/20' : 'text-slate-600 file:bg-white file:text-teal-700 hover:file:bg-slate-100 shadow-sm'}`} />
                  <div className="flex items-center gap-2">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>Questions:</label>
                    <input type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className={`w-20 p-2 rounded-lg border text-center font-bold focus:outline-none ${isDarkMode ? 'bg-slate-900/50 border-teal-500/30 text-white' : 'bg-white border-teal-300 text-slate-800 shadow-sm'}`} />
                  </div>
                  <button onClick={handleGenerateQuiz} disabled={!selectedFile || isGenerating} className={`border font-bold py-2 px-6 rounded-xl transition shadow-sm disabled:opacity-50 ${isDarkMode ? 'bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500 hover:text-white' : 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-500 hover:text-white hover:border-teal-500'}`}>
                    {isGenerating ? 'Thinking...' : 'Generate with AI'}
                  </button>
                </div>
                {aiError && <p className={`font-bold mt-4 border p-3 rounded-lg ${isDarkMode ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-600 bg-red-50 border-red-200'}`}>{aiError}</p>}
              </div>
            </div>

            <div className="space-y-6">
              {draftQuestions.map((q, qIndex) => (
                <div key={qIndex} className={`p-8 rounded-2xl border relative ${cardBg}`}>
                  <button onClick={() => removeDraftQuestion(qIndex)} className={`absolute top-4 right-4 font-bold transition ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}>✕ Remove</button>
                  <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Question {qIndex + 1}</label>
                  <textarea value={q.questionText} onChange={(e) => updateDraftQuestion(qIndex, 'questionText', e.target.value)} className={`w-full p-4 border rounded-xl font-medium mb-4 focus:outline-none transition ${inputBg}`} rows="2" placeholder="Type your question here..."/>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {q.options.map((opt, optIndex) => (
                      <input key={optIndex} type="text" placeholder={`Option ${optIndex + 1}`} value={opt} onChange={(e) => updateDraftOption(qIndex, optIndex, e.target.value)} className={`w-full p-3 border rounded-lg text-sm font-medium focus:outline-none transition ${inputBg}`} />
                    ))}
                  </div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Select Correct Answer:</label>
                  <select value={q.correctAnswer} onChange={(e) => updateDraftQuestion(qIndex, 'correctAnswer', e.target.value)} className={`w-full p-3 border rounded-lg text-sm font-bold focus:outline-none transition ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 focus:border-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}`}>
                    <option className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"} value="">-- Select Correct Option --</option>
                    {q.options.filter(o => o.trim() !== '').map((opt, i) => <option className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"} key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-4 sticky bottom-8">
              <button onClick={handleAddManualQuestion} className={`flex-1 border border-dashed font-bold text-lg py-4 rounded-xl transition backdrop-blur-md ${isDarkMode ? 'bg-white/5 border-teal-500/50 text-teal-300 hover:bg-white/10' : 'bg-white/80 border-teal-400 text-teal-700 hover:bg-teal-50'}`}>➕ Add Blank Question</button>
              {draftQuestions.length > 0 && (
                <button onClick={handleSaveQuiz} disabled={!quizTitle || isSaving} className={`flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg py-4 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition border ${isDarkMode ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-white/20' : 'shadow-lg shadow-emerald-500/30 border-transparent'}`}>
                  {isSaving ? 'Saving...' : '💾 Publish Quiz to Class'}
                </button>
              )}
            </div>
            {saveMessage && <div className={`text-center font-bold border p-4 rounded-xl ${isDarkMode ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>{saveMessage}</div>}
          </div>
        )}

        {/* --- STUDENT SCORES --- */}
        {activeTab === 'student-scores' && (
          <div className="animate-in fade-in duration-300">
             <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Student Performance</h2>
             <p className={`font-medium mb-8 ${textSecondary}`}>Track your students' grades across all your active quizzes.</p>
             {studentScores.length === 0 ? (
               <div className={`p-12 rounded-2xl border-dashed border-2 text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-300'}`}><p className={`font-bold ${textSecondary}`}>No students have completed your quizzes yet.</p></div>
             ) : (
               <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className={`uppercase text-xs font-black tracking-wider border-b ${isDarkMode ? 'bg-slate-900/50 text-teal-400 border-white/10' : 'bg-slate-100 text-teal-700 border-slate-200'}`}>
                       <th className="p-4">Student</th>
                       <th className="p-4">Quiz Title</th>
                       <th className="p-4">Grade Level</th>
                       <th className="p-4">Final Score</th>
                       <th className="p-4">Date Taken</th>
                     </tr>
                   </thead>
                   <tbody className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-slate-200'}`}>
                     {studentScores.map((scoreObj) => {
                       const percentage = (scoreObj.score / scoreObj.totalQuestions) * 100;
                       return (
                         <tr key={scoreObj._id} className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                           <td className="p-4"><p className={`font-bold ${textPrimary}`}>{scoreObj.studentId?.fullName || scoreObj.studentId?.username}</p><p className={`text-xs ${textSecondary}`}>{scoreObj.studentId?.schoolName}</p></td>
                           <td className={`p-4 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{scoreObj.quizId?.title}</td>
                           <td className="p-4 font-medium"><span className={`border px-2 py-1 rounded-md text-xs font-bold ${isDarkMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>{scoreObj.quizId?.grade}</span></td>
                           <td className="p-4"><span className={`font-black px-3 py-1 rounded-full text-sm border ${percentage >= 75 ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300') : percentage >= 50 ? (isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300') : (isDarkMode ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-100 text-red-800 border-red-300')}`}>{scoreObj.score} / {scoreObj.totalQuestions}</span></td>
                           <td className={`p-4 text-sm font-medium ${textSecondary}`}>{new Date(scoreObj.submittedAt).toLocaleDateString()}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        )}

        {/* --- CLASS ROSTER --- */}
        {activeTab === 'student-requests' && (
          <div className="animate-in fade-in duration-300">
            <h2 className={`text-2xl font-bold mb-6 ${textPrimary}`}>Manage Class Roster</h2>
            {enrollmentRequests.length === 0 ? (
               <div className={`p-12 rounded-2xl border-dashed border-2 text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-300'}`}><p className={`font-bold ${textSecondary}`}>No students have requested to join your classes yet.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollmentRequests.map(req => (
                  <div key={req._id} className={`p-6 rounded-2xl border flex flex-col justify-between ${cardBg}`}>
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2"><h3 className={`text-xl font-bold ${textPrimary}`}>{req.studentId?.fullName || req.studentId?.username}</h3><span className={`text-xs font-bold px-3 py-1 rounded-full border ${isDarkMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>{req.grade}</span></div>
                      <p className={`text-sm font-medium ${textSecondary}`}>🏫 {req.studentId?.schoolName || 'No school provided'}</p><p className={`text-sm font-medium mt-1 ${textSecondary}`}>📞 Parent: {req.studentId?.parentContact || 'No contact provided'}</p>
                    </div>
                    {req.status === 'pending' ? <button onClick={() => handleApprove(req._id)} className={`w-full border font-bold py-3 rounded-xl transition shadow-sm ${isDarkMode ? 'bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500 hover:text-white' : 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-500 hover:text-white'}`}>Approve Student</button> : <div className={`w-full border text-center font-bold py-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>✅ Approved & Enrolled</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- PROFILE MODAL --- */}
      {isProfileModalOpen && (
        <div className={`fixed inset-0 backdrop-blur-lg flex items-center justify-center p-4 z-50 transition-colors ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-800/40'}`}>
          <div className={`p-8 rounded-3xl shadow-2xl max-w-md w-full border animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900/90 border-teal-500/30' : 'bg-white border-teal-300'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black ${textPrimary}`}>Profile Settings</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className={`font-bold text-xl transition ${isDarkMode ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>✕</button>
            </div>
            <div className="space-y-4 mb-6">
              <div><label className={`block text-xs font-bold uppercase mb-1 ${textSecondary}`}>Display Name</label><input type="text" value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} className={`w-full p-3 border rounded-xl font-medium focus:outline-none transition ${inputBg}`}/></div>
              <div><label className={`block text-xs font-bold uppercase mb-1 ${textSecondary}`}>Teaching Subjects</label><input type="text" value={profileData.subjects} onChange={(e) => setProfileData({...profileData, subjects: e.target.value})} className={`w-full p-3 border rounded-xl font-medium focus:outline-none transition ${inputBg}`}/></div>
              <div><label className={`block text-xs font-bold uppercase mb-1 ${textSecondary}`}>District / Location</label><input type="text" value={profileData.district} onChange={(e) => setProfileData({...profileData, district: e.target.value})} className={`w-full p-3 border rounded-xl font-medium focus:outline-none transition ${inputBg}`}/></div>
              <div><label className={`block text-xs font-bold uppercase mb-1 ${textSecondary}`}>Qualifications / Title</label><input type="text" value={profileData.qualifications} onChange={(e) => setProfileData({...profileData, qualifications: e.target.value})} className={`w-full p-3 border rounded-xl font-medium focus:outline-none transition ${inputBg}`}/></div>
            </div>
            {profileMessage && <div className={`mb-4 p-3 rounded-lg font-bold text-center text-sm border ${profileMessage.includes('❌') ? (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200') : (isDarkMode ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}`}>{profileMessage}</div>}
            <button onClick={handleUpdateProfile} className={`w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition ${isDarkMode ? 'shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'shadow-lg shadow-teal-500/30'}`}>Save Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}