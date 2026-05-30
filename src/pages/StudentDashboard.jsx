import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Student';
  const userId = location.state?.userId; 

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [activeTab, setActiveTab] = useState('find-teachers');
  const [activeClass, setActiveClass] = useState(null); 
  const [activeQuiz, setActiveQuiz] = useState(null); 
  const [reviewQuiz, setReviewQuiz] = useState(null); 
  const [selectedAnswers, setSelectedAnswers] = useState({}); 
  const [quizResult, setQuizResult] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  const [teachers, setTeachers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [classQuizzes, setClassQuizzes] = useState([]); 
  const [myScores, setMyScores] = useState([]); 
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    if (!userId) { navigate('/'); return; }
    
    const fetchData = async () => {
      try {
        const [teachersRes, requestsRes, scoresRes] = await Promise.all([
          fetch('https://quiz-platform-tau.vercel.app/api/enrollments/available-teachers'),
          fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/my-requests/${userId}`),
          fetch(`https://quiz-platform-tau.vercel.app/api/scores/student/${userId}`)
        ]);
        
        setTeachers(await teachersRes.json());
        setMyRequests(await requestsRes.json());
        setMyScores(await scoresRes.json());
      } catch (error) { 
        console.error('Error fetching data:', error); 
      }
    };
    
    fetchData();
  }, [userId, navigate]);

  const totalPoints = myScores.reduce((sum, current) => sum + current.score, 0);
  const completedCount = myScores.length;
  const avgScore = completedCount > 0 ? (totalPoints / completedCount).toFixed(1) : 0;

  const handleSelectAnswer = (questionIndex, option) => setSelectedAnswers({ ...selectedAnswers, [questionIndex]: option });

  const handleSubmitQuiz = useCallback(async () => {
    setIsSubmitting(true);
    let score = 0;
    activeQuiz.questions.forEach((q, index) => { if (selectedAnswers[index] === q.correctAnswer) score += 1; });
    setQuizResult({ score, total: activeQuiz.questions.length });
    try {
      await fetch('https://quiz-platform-tau.vercel.app/api/scores/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, quizId: activeQuiz._id, score, totalQuestions: activeQuiz.questions.length, studentAnswers: selectedAnswers })
      });
      // Refetch scores after submission
      const scoresRes = await fetch(`https://quiz-platform-tau.vercel.app/api/scores/student/${userId}`);
      setMyScores(await scoresRes.json());
    } catch (error) { 
      console.error('Error submitting quiz:', error); 
    } 
    finally { setIsSubmitting(false); }
  }, [activeQuiz, selectedAnswers, userId]);

  useEffect(() => {
    if (activeQuiz && activeQuiz.timeLimit > 0 && !quizResult) {
      setTimeLeft(activeQuiz.timeLimit * 60);
    } else {
      setTimeLeft(null);
    }
  }, [activeQuiz, quizResult]);

  useEffect(() => {
    if (timeLeft === null || isSubmitting || quizResult) return;
    if (timeLeft <= 0) { 
      handleSubmitQuiz(); 
      return; 
    } 
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitting, quizResult, handleSubmitQuiz]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRequestAccess = async () => {
    setRequestMessage('Sending request...');
    try {
      const response = await fetch('https://quiz-platform-tau.vercel.app/api/enrollments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, teacherId: selectedTeacher._id, grade: selectedGrade })
      });
      const data = await response.json();
      setRequestMessage(data.message);
      if (response.ok) {
        const reqRes = await fetch(`https://quiz-platform-tau.vercel.app/api/enrollments/my-requests/${userId}`);
        setMyRequests(await reqRes.json());
        setTimeout(() => setSelectedTeacher(null), 2000);
      }
    } catch (_error) {
      setRequestMessage('Failed to send request.'); 
    }
  };

  const handleEnterClass = async (enrollment) => {
    setActiveClass(enrollment); 
    setActiveQuiz(null); 
    setReviewQuiz(null);
    try {
      const response = await fetch(`https://quiz-platform-tau.vercel.app/api/quizzes/class?teacherId=${enrollment.teacherId._id}&grade=${enrollment.grade}`);
      setClassQuizzes(await response.json());
    } catch (_error) { 
      console.error('Error fetching quizzes:', _error); 
    }
  };

  const closeQuiz = () => { 
    setActiveQuiz(null); 
    setQuizResult(null); 
    setReviewQuiz(null); 
    setSelectedAnswers({}); 
  };

  const takenQuizIds = myScores.map(score => score.quizId?._id);
  const availableQuizzes = classQuizzes.filter(q => !takenQuizIds.includes(q._id));
  const completedQuizzes = classQuizzes.filter(q => takenQuizIds.includes(q._id));

  // --- Dynamic Theme Classes ---
  const themeBg = isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800';
  const sidebarBg = isDarkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-slate-200';
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const titleGradient = isDarkMode ? 'from-teal-400 to-cyan-400' : 'from-teal-600 to-cyan-600';

  return (
    <div className={`min-h-screen flex font-sans relative overflow-hidden transition-colors duration-500 ${themeBg}`}>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
          50% { box-shadow: 0 0 40px rgba(20, 184, 166, 0.6); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .glass-shine {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
        .glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
        .float { animation: float 3s ease-in-out infinite; }
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      
      {/* Theme Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-6 right-8 p-3 rounded-full backdrop-blur-md border transition-all z-50 ${isDarkMode ? 'bg-white/10 border-white/20 hover:bg-white/20 text-yellow-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-md'}`}
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

      {/* GLASSMORPHISM SIDEBAR */}
      <aside className={`w-64 backdrop-blur-2xl border-r flex flex-col hidden md:flex z-10 shadow-2xl transition-colors duration-500 ${sidebarBg}`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition" onClick={() => { setActiveTab('my-classes'); setActiveClass(null); setActiveQuiz(null); setReviewQuiz(null); }}>
            <img src="/logo.png" alt="SmartQuiz Logo" className="h-12 object-contain" />
            <div>
              <h1 className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-wider ${titleGradient}`}>SmartQuiz</h1>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-500/70' : 'text-teal-600'}`}>Student Portal</p>
            </div>
          </div>
        </div>
        <div className={`p-6 m-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 shadow-[0_0_30px_rgba(20,184,166,0.1)]' : 'bg-white border-slate-200 shadow-md'}`}>
           <p className={`font-bold text-xs uppercase tracking-widest mb-1 ${isDarkMode ? 'text-teal-300/70' : 'text-teal-600'}`}>Total XP</p>
           <h2 className={`text-4xl font-black flex items-center gap-2 ${textPrimary}`}>⭐ {totalPoints}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('my-classes'); setActiveClass(null); setActiveQuiz(null); setReviewQuiz(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'my-classes' && !activeClass ? (isDarkMode ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-50 text-teal-700 border border-teal-200') : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}`}>📚 My Classes</button>
          <button onClick={() => { setActiveTab('find-teachers'); setActiveClass(null); setActiveQuiz(null); setReviewQuiz(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'find-teachers' && !activeClass ? (isDarkMode ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-50 text-teal-700 border border-teal-200') : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}`}>🔍 Course Catalog</button>
        </nav>
        <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <button onClick={() => navigate('/')} className={`w-full font-bold py-2 rounded-lg transition text-sm border ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>Log Out</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative pb-24 md:pb-8">
        {/* MOBILE HEADER */}
        <div className="md:hidden mb-6 flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => { setActiveTab('my-classes'); setActiveClass(null); setActiveQuiz(null); setReviewQuiz(null); }}>
          <img src="/logo.png" alt="SmartQuiz Logo" className="h-14 object-contain" />
          <div>
            <h1 className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-wider ${titleGradient}`}>SmartQuiz</h1>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-500/70' : 'text-teal-600'}`}>Student</p>
          </div>
        </div>

        {reviewQuiz ? (
           <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
             <button onClick={closeQuiz} className={`font-bold mb-6 transition flex items-center gap-2 ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>← Back to Modules</button>
             <div className={`p-8 rounded-3xl border mb-8 flex justify-between items-center shadow-2xl ${cardBg}`}>
               <div>
                 <h2 className={`text-3xl font-black mb-2 ${textPrimary}`}>{reviewQuiz.quizId?.title || 'Unknown Quiz'}</h2>
                 <p className={`font-medium ${textSecondary}`}>Review your past answers below.</p>
               </div>
               <div className={`px-6 py-4 rounded-2xl text-center border ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-200'}`}>
                 <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Score</p>
                 <p className={`text-3xl font-black ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>{reviewQuiz.score} / {reviewQuiz.totalQuestions}</p>
               </div>
             </div>
             <div className="space-y-8">
               {reviewQuiz.quizId?.questions?.map((q, qIndex) => {
                 const studentChoice = reviewQuiz.studentAnswers ? reviewQuiz.studentAnswers[qIndex] : null;
                 const isCorrect = studentChoice === q.correctAnswer;
                 return (
                   <div key={qIndex} className={`p-8 rounded-2xl border ${isDarkMode ? (isCorrect ? 'bg-emerald-500/5 border-white/10' : 'bg-red-500/5 border-white/10') : (isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100')}`}>
                     <p className={`text-xl font-bold mb-6 ${textPrimary}`}><span className={isCorrect ? (isDarkMode ? "text-emerald-400 mr-2" : "text-emerald-600 mr-2") : (isDarkMode ? "text-red-400 mr-2" : "text-red-600 mr-2")}>{qIndex + 1}.</span> {q.questionText}</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {q.options.map((option, optIndex) => {
                         let optionClass = isDarkMode ? "bg-white/5 border-white/10 text-slate-400 opacity-50" : "bg-slate-50 border-slate-200 text-slate-500 opacity-60";
                         if (option === q.correctAnswer) optionClass = isDarkMode ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-emerald-100 border-emerald-400 text-emerald-800 font-bold shadow-sm"; 
                         else if (studentChoice && option === studentChoice && !isCorrect) optionClass = isDarkMode ? "bg-red-500/20 border-red-500/50 text-red-300 font-bold" : "bg-red-100 border-red-400 text-red-800 font-bold shadow-sm";
                         return <div key={optIndex} className={`p-4 text-left rounded-xl border ${optionClass}`}>{option}</div>;
                       })}
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        ) : activeQuiz ? (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
            {!quizResult ? (
              <>
                <button onClick={closeQuiz} className={`font-bold mb-6 transition ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>Cancel Quiz</button>
                <div className={`p-8 rounded-3xl border mb-8 flex justify-between items-center shadow-xl ${cardBg}`}>
                  <div>
                    <h2 className={`text-3xl font-black mb-2 ${textPrimary}`}>{activeQuiz.title}</h2>
                    <p className={`font-medium ${textSecondary}`}>Answer all {activeQuiz.questions.length} questions before submitting.</p>
                  </div>
                  {timeLeft !== null && (
                    <div className={`px-6 py-4 rounded-2xl text-center border ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} ${timeLeft < 60 ? (isDarkMode ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' : 'border-red-400 shadow-md animate-pulse') : (isDarkMode ? 'border-white/10' : 'border-slate-200')}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest ${timeLeft < 60 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : textSecondary}`}>Time Remaining</p>
                      <p className={`text-3xl font-black font-mono ${timeLeft < 60 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-teal-300' : 'text-teal-600')}`}>{formatTime(timeLeft)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-8">
                  {activeQuiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className={`p-8 rounded-2xl border shadow-sm ${cardBg}`}>
                      <p className={`text-xl font-bold mb-6 ${textPrimary}`}><span className={`${isDarkMode ? 'text-teal-400' : 'text-teal-600'} mr-2`}>{qIndex + 1}.</span> {q.questionText}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((option, optIndex) => (
                          <button 
                            key={optIndex} 
                            onClick={() => handleSelectAnswer(qIndex, option)} 
                            className={`p-4 text-left rounded-xl transition-all border ${
                              selectedAnswers[qIndex] === option 
                                ? (isDarkMode ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]' : 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm') 
                                : (isDarkMode ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300')
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 mb-12 flex justify-end">
                  <button onClick={handleSubmitQuiz} disabled={Object.keys(selectedAnswers).length < activeQuiz.questions.length || isSubmitting} className={`bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black text-lg py-4 px-12 rounded-xl hover:from-teal-400 hover:to-cyan-400 transition disabled:opacity-50 ${isDarkMode ? 'shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'shadow-lg shadow-teal-500/30'}`}>
                    {isSubmitting ? 'Grading...' : 'Submit Exam'}
                  </button>
                </div>
              </>
            ) : (
              <div className={`p-12 rounded-3xl border text-center mt-12 animate-in zoom-in-95 duration-500 shadow-2xl overflow-hidden relative ${cardBg}`}>
                {/* Background Animation */}
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10' : 'bg-gradient-to-br from-teal-50 via-white to-cyan-50'}`}></div>
                <div className="glass-shine absolute inset-0"></div>
                
                <div className="relative z-10">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl border transition-transform duration-700 animate-bounce ${isDarkMode ? 'bg-teal-500/20 border-teal-500/30 text-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.3)]' : 'bg-teal-100 border-teal-200 text-teal-600 shadow-lg'}`}>
                    🏆
                  </div>
                  <h2 className={`text-4xl font-black mb-2 ${textPrimary}`}>Exam Complete!</h2>
                  <p className={`font-medium text-lg mb-8 ${isDarkMode ? 'text-teal-200' : 'text-teal-700'}`}>Outstanding effort! You earned points towards your Total XP!</p>
                  
                  <div className={`rounded-2xl p-8 mb-8 border inline-block ${isDarkMode ? 'bg-slate-900/50 border-white/10 shadow-[0_0_30px_rgba(20,184,166,0.2)]' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${textSecondary}`}>Final Score</p>
                    <p className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-teal-300 to-cyan-300' : 'from-teal-600 to-cyan-600'}`}>
                      {quizResult.score} 
                      <span className={`text-3xl ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>/{quizResult.total}</span>
                    </p>
                    <p className={`text-sm font-bold mt-4 ${textSecondary}`}>{Math.round((quizResult.score / quizResult.total) * 100)}% Score</p>
                  </div>
                  
                  <button onClick={closeQuiz} className={`font-bold py-4 px-8 rounded-xl transition-all duration-300 border ${isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 hover:shadow-lg'}`}>
                    ← Return to Modules
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeClass ? (
          <div className="animate-in slide-in-from-right-8 duration-300 max-w-5xl mx-auto">
            <button onClick={() => setActiveClass(null)} className={`font-bold flex items-center gap-2 mb-6 transition ${isDarkMode ? 'text-slate-400 hover:text-teal-400' : 'text-slate-500 hover:text-teal-600'}`}>← Back to Dashboard</button>
            <div className={`p-8 rounded-3xl text-white mb-8 border ${isDarkMode ? 'bg-gradient-to-r from-teal-600 to-cyan-700 shadow-[0_0_30px_rgba(20,184,166,0.2)] border-white/10' : 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg border-transparent'}`}>
              <h2 className="text-3xl font-black">{activeClass.grade} Modules</h2>
              <p className="text-teal-100 font-medium mt-1">Instructor: {activeClass.teacherId.fullName || activeClass.teacherId.username}</p>
            </div>
            
            <h3 className={`text-xl font-bold mb-4 border-b pb-2 ${isDarkMode ? 'text-white border-white/10' : 'text-slate-800 border-slate-200'}`}>Assignments to Complete</h3>
            {availableQuizzes.length === 0 ? (
              <div className={`p-16 rounded-3xl border border-dashed text-center mb-8 transition-all ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-slate-100/50 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                <p className="text-6xl mb-4">🎉</p>
                <p className={`font-bold text-lg ${textPrimary}`}>All Caught Up!</p>
                <p className={`text-sm ${textSecondary}} mt-2`}>No new assignments. Great job!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                {availableQuizzes.map(quiz => (
                  <div key={quiz._id} className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl group ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-teal-500/50 hover:bg-white/8' : 'bg-white border-slate-200 hover:border-teal-400 hover:bg-slate-50'}`}>
                    <div>
                      <h4 className={`text-lg font-bold ${textPrimary}`}>{quiz.title}</h4>
                      <p className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-teal-200/70' : 'text-teal-600'}`}>{quiz.questions.length} Questions • {quiz.timeLimit > 0 ? `${quiz.timeLimit} Min` : '⏱️ No Limit'}</p>
                      
                      {/* Quiz Progress Bar */}
                      <div className="mb-4">
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                          <div className={`h-full rounded-full transition-all duration-1000 ${isDarkMode ? 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-md'}`} style={{width: '0%'}}></div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setActiveQuiz(quiz)} className={`w-full font-bold py-3 rounded-xl transition-all duration-300 border ${isDarkMode ? 'bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500 hover:text-white hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]' : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-500 hover:text-white hover:shadow-lg'}`}>Start Quiz</button>
                  </div>
                ))}
              </div>
            )}
            
            <h3 className={`text-xl font-bold mb-4 border-b pb-2 ${isDarkMode ? 'text-white border-white/10' : 'text-slate-800 border-slate-200'}`}>Completed & Review</h3>
            {completedQuizzes.length === 0 ? (
              <div className={`p-16 rounded-3xl border border-dashed text-center transition-all ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5' : 'bg-slate-100/50 border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                <p className="text-6xl mb-4">📝</p>
                <p className={`font-bold text-lg ${textPrimary}`}>No Completed Quizzes</p>
                <p className={`text-sm ${textSecondary}} mt-2`}>Start a quiz above to see your results here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedQuizzes.map(quiz => {
                  const scoreRecord = myScores.find(s => s.quizId._id === quiz._id);
                  const percentage = Math.round((scoreRecord.score / scoreRecord.totalQuestions) * 100);
                  return (
                    <div key={quiz._id} className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:shadow-lg'}`}>
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className={`text-lg font-bold line-through ${textSecondary}`}>{quiz.title}</h4>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                            percentage >= 80 ? (isDarkMode ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-700') :
                            percentage >= 60 ? (isDarkMode ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-700') :
                            (isDarkMode ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-red-100 border-red-300 text-red-700')
                          }`}>{scoreRecord.score}/{scoreRecord.totalQuestions} ({percentage}%)</span>
                        </div>
                        
                        {/* Score Progress Bar */}
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-300'}`}>
                          <div className={`h-full rounded-full transition-all duration-1000 ${
                            percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                            percentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`} style={{width: `${percentage}%`}}></div>
                        </div>
                      </div>
                      <button onClick={() => setReviewQuiz(scoreRecord)} className={`w-full font-bold py-3 rounded-xl transition-all duration-300 border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md'}`}>Review Answers</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* DASHBOARD HERO SECTION */}
            <div className={`rounded-3xl p-8 md:p-12 mb-12 border relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-teal-900/30 via-cyan-900/20 to-slate-900/40 border-teal-500/20 shadow-[0_0_50px_rgba(20,184,166,0.15)]' : 'bg-gradient-to-br from-teal-50 via-cyan-50 to-white border-teal-200 shadow-2xl'}`}>
              {/* Background Shine Effect */}
              <div className="glass-shine absolute inset-0 rounded-3xl pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Welcome Back</p>
                    <h1 className={`text-4xl md:text-5xl font-black flex items-center gap-3 ${textPrimary}`}>
                      <span className="text-5xl md:text-6xl">👋</span> {username}
                    </h1>
                    <p className={`text-lg font-medium mt-2 ${textSecondary}`}>Keep your momentum going with today's quizzes</p>
                  </div>
                  <div className={`px-6 py-4 rounded-2xl border text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'} backdrop-blur-sm`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Streak</p>
                    <p className="text-3xl font-black text-orange-500 flex items-center justify-center gap-2">🔥 {completedCount}</p>
                  </div>
                </div>

                {/* MODERN STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total XP Card */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-white/8 border-white/15 hover:border-teal-500/50 hover:bg-teal-500/10' : 'bg-white/60 border-white/80 hover:border-teal-400 hover:bg-white/80'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-300/70' : 'text-teal-600'}`}>Total XP</p>
                      <span className="text-2xl group-hover:float">⭐</span>
                    </div>
                    <p className={`text-3xl font-black ${textPrimary}`}>{totalPoints}</p>
                    <p className={`text-xs mt-2 ${textSecondary}`}>{completedCount} quizzes completed</p>
                  </div>

                  {/* Average Score Card */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-white/8 border-white/15 hover:border-cyan-500/50 hover:bg-cyan-500/10' : 'bg-white/60 border-white/80 hover:border-cyan-400 hover:bg-white/80'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-cyan-300/70' : 'text-cyan-600'}`}>Avg Score</p>
                      <span className="text-2xl group-hover:float">📊</span>
                    </div>
                    <p className={`text-3xl font-black ${textPrimary}`}>{avgScore}</p>
                    <p className={`text-xs mt-2 ${textSecondary}`}>Per quiz average</p>
                  </div>

                  {/* Active Classes Card */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-white/8 border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/10' : 'bg-white/60 border-white/80 hover:border-emerald-400 hover:bg-white/80'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-300/70' : 'text-emerald-600'}`}>Classes</p>
                      <span className="text-2xl group-hover:float">🎓</span>
                    </div>
                    <p className={`text-3xl font-black ${textPrimary}`}>{myRequests.length}</p>
                    <p className={`text-xs mt-2 ${textSecondary}`}>Enrolled courses</p>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'my-classes' && (
              <div className="animate-in fade-in duration-300">
                <h2 className={`text-3xl font-bold mb-2 ${textPrimary}`}>My Enrollments</h2>
                <p className={`font-medium mb-8 ${textSecondary}`}>Track your class access requests and enter your approved courses.</p>
                {myRequests.length === 0 ? (
                  <div className={`p-16 rounded-3xl border border-dashed text-center transition-all ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-teal-500/50 hover:bg-teal-500/5' : 'bg-slate-100/50 border-slate-300 hover:border-teal-400 hover:bg-teal-50/30'}`}>
                    <p className="text-6xl mb-4">📚</p>
                    <p className={`font-bold text-lg ${textPrimary}`}>No Enrollments Yet</p>
                    <p className={`text-sm ${textSecondary}} mt-2`}>Visit the Course Catalog to request access to classes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myRequests.map(req => (
                      <div key={req._id} className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col ${cardBg} hover:shadow-xl ${isDarkMode ? 'hover:border-teal-500/50' : 'hover:border-teal-400'}`}>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${textPrimary}`}>{req.grade}</h3>
                          <p className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-teal-200/70' : 'text-teal-600'}`}>Instructor: {req.teacherId.fullName || req.teacherId.username}</p>
                          {req.teacherId.subjects && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {req.teacherId.subjects?.split(',').map((subject, i) => (
                                <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300' : 'bg-teal-100 border border-teal-200 text-teal-700'}`}>
                                  {subject.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {req.status === 'approved' ? (
                          <button onClick={() => handleEnterClass(req)} className={`w-full font-bold px-4 py-3 rounded-xl transition-all duration-300 border ${isDarkMode ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]' : 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200 shadow-md hover:shadow-lg'}`}>Enter Class →</button>
                        ) : (
                          <span className={`w-full text-center font-bold px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse' : 'bg-amber-100 border-amber-300 text-amber-700'}`}>⏳ Pending Approval</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'find-teachers' && (
              <div className="animate-in fade-in duration-300">
                <h2 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Available Educators</h2>
                <p className={`font-medium mb-8 ${textSecondary}`}>Browse teachers in your district and request access to their quizzes.</p>
                {teachers.length === 0 ? (
                  <div className={`p-16 rounded-3xl border border-dashed text-center transition-all ${isDarkMode ? 'bg-white/5 border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/5' : 'bg-slate-100/50 border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/30'}`}>
                    <p className="text-6xl mb-4">🔍</p>
                    <p className={`font-bold text-lg ${textPrimary}`}>No Educators Available</p>
                    <p className={`text-sm ${textSecondary}} mt-2`}>Check back later for available courses</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teachers.map(teacher => (
                      <div key={teacher._id} onMouseEnter={() => setHoveredCard(teacher._id)} onMouseLeave={() => setHoveredCard(null)} className={`p-6 rounded-2xl border transition-all duration-300 overflow-hidden group ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-teal-500/50 hover:bg-white/8 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]' : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-2xl hover:bg-white'}`}>
                        {/* Card Shine Effect */}
                        {hoveredCard === teacher._id && (
                          <div className="absolute inset-0 glass-shine pointer-events-none"></div>
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-4">
                            {teacher.profilePic ? (
                              <img src={teacher.profilePic} alt={teacher.fullName} className={`w-16 h-16 rounded-full object-cover border-2 shadow-lg transition-transform duration-300 ${isDarkMode ? 'border-teal-500/50' : 'border-teal-400'} group-hover:scale-110`} />
                            ) : (
                              <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold text-2xl transition-transform duration-300 group-hover:scale-110 ${isDarkMode ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/50 text-teal-400' : 'bg-gradient-to-br from-teal-100 to-cyan-100 border-teal-300 text-teal-600'}`}>{teacher.username.charAt(0).toUpperCase()}</div>
                            )}
                            <div className="flex-1">
                              <h3 className={`text-xl font-bold ${textPrimary}`}>{teacher.fullName || teacher.username}</h3>
                              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>📚 Educator</p>
                            </div>
                          </div>
                          
                          {/* Subject Badges */}
                          {teacher.subjects && (
                            <div className="mb-6">
                              <div className="flex flex-wrap gap-2">
                                {teacher.subjects.split(',').slice(0, 3).map((subject, i) => (
                                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isDarkMode ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300 group-hover:bg-teal-500/30 group-hover:border-teal-500/60' : 'bg-teal-100 border border-teal-200 text-teal-700 group-hover:bg-teal-200'}`}>
                                    {subject.trim()}
                                  </span>
                                ))}
                                {teacher.subjects?.split(',').length > 3 && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-white/10 border border-white/20 text-white/60' : 'bg-slate-100 border border-slate-300 text-slate-500'}`}>
                                    +{teacher.subjects.split(',').length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <button onClick={() => { setSelectedTeacher(teacher); setRequestMessage(''); }} className={`w-full font-bold py-3 rounded-xl transition-all duration-300 border backdrop-blur-sm ${isDarkMode ? 'bg-white/10 border-white/20 text-white hover:bg-teal-500/20 hover:text-teal-300 hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 hover:shadow-lg'}`}>
                            View Courses →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className={`fixed bottom-0 left-0 right-0 md:hidden border-t backdrop-blur-2xl z-40 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex justify-around items-center h-20 px-4">
          <button 
            onClick={() => { setActiveTab('my-classes'); setActiveClass(null); setActiveQuiz(null); setReviewQuiz(null); }}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'my-classes' && !activeClass ? (isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-800')}`}
          >
            <span className="text-xl">📚</span>
            <span className="text-xs font-bold">Classes</span>
          </button>
          <button 
            onClick={() => { setActiveTab('find-teachers'); setActiveClass(null); setActiveQuiz(null); setReviewQuiz(null); }}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'find-teachers' && !activeClass ? (isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-800')}`}
          >
            <span className="text-xl">🔍</span>
            <span className="text-xs font-bold">Browse</span>
          </button>
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all ${isDarkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'}`}
          >
            <span className="text-xl">🚪</span>
            <span className="text-xs font-bold">Logout</span>
          </button>
        </div>
      </div>

      {/* GLASSMORPHISM OVERLAY MODAL */}
      {selectedTeacher && (
        <div className={`fixed inset-0 backdrop-blur-lg flex items-center justify-center p-4 z-50 transition-colors ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-800/40'}`}>
          <div className={`p-8 rounded-3xl shadow-2xl max-w-md w-full border animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900/90 border-teal-500/30' : 'bg-white border-teal-300'}`}>
            <h3 className={`text-2xl font-bold mb-1 ${textPrimary}`}>Enroll in Course</h3>
            <p className={`mb-4 text-sm ${textSecondary}`}>Select your grade level to join this class.</p>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className={`w-full p-4 border rounded-xl mb-6 outline-none transition ${isDarkMode ? 'bg-white/5 text-white border-white/20 focus:border-teal-400' : 'bg-slate-50 text-slate-800 border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'}`}>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => <option className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'} key={n} value={`Grade ${n}`}>Grade {n}</option>)}
            </select>
            <div className="flex gap-4">
              <button onClick={() => setSelectedTeacher(null)} className={`flex-1 font-bold py-3 rounded-xl transition border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}>Cancel</button>
              <button onClick={handleRequestAccess} className={`flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:opacity-90 ${isDarkMode ? 'shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'shadow-lg shadow-teal-500/30'}`}>Send Request</button>
            </div>
            {requestMessage && <p className={`text-center mt-4 font-bold text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>{requestMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}