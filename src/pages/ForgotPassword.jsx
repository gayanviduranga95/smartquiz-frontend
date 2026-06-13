import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import useThemeMode from '../hooks/useThemeMode';
import { AuthShell, StatusMessage, ThemeToggle } from '../components/AuthLayout';

export default function ForgotPassword() {
  const [isDarkMode, setIsDarkMode] = useThemeMode();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      setUsername('');
      setEmail('');
    } catch (error) {
      setIsError(true);
      setMessage(error.message || 'Unable to request a password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBg = isDarkMode 
    ? 'border-white/10 bg-slate-900/50 text-white placeholder-slate-500 focus:border-teal-400' 
    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-teal-500';

  return (
    <AuthShell 
      title="Forgot password?" 
      subtitle="Enter the username and email for the account you want to reset." 
      isDarkMode={isDarkMode}
    >
      <ThemeToggle isDarkMode={isDarkMode} toggleTheme={setIsDarkMode} />
      
      <StatusMessage message={message} isError={isError} isDarkMode={isDarkMode} />
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className={`block mb-2 text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your account username"
            autoComplete="username"
            className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition ${inputBg}`}
            required
          />
        </label>
        <label className="block">
          <span className={`block mb-2 text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition ${inputBg}`}
            required
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-black shadow-lg shadow-teal-500/30 hover:from-teal-400 hover:to-cyan-400 transition disabled:opacity-50 ${isDarkMode ? 'border border-white/10' : ''}`}
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      
      <Link to="/" className={`block mt-7 text-center text-sm font-bold transition ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>
        Back to login
      </Link>
    </AuthShell>
  );
}
