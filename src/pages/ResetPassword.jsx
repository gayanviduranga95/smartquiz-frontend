import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../config';
import useThemeMode from '../hooks/useThemeMode';
import { AuthShell, StatusMessage, ThemeToggle } from '../components/AuthLayout';

export default function ResetPassword() {
  const [isDarkMode, setIsDarkMode] = useThemeMode();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      setIsComplete(true);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || 'Unable to reset your password.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBg = isDarkMode 
    ? 'border-white/10 bg-slate-900/50 text-white placeholder-slate-500 focus:border-teal-400' 
    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-teal-500';

  return (
    <AuthShell 
      title="Create new password" 
      subtitle="Choose a strong password with at least 8 characters." 
      isDarkMode={isDarkMode}
    >
      <ThemeToggle isDarkMode={isDarkMode} toggleTheme={setIsDarkMode} />

      <StatusMessage message={message} isError={isError} isDarkMode={isDarkMode} />
      
      {!isComplete && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            minLength={8}
            className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition ${inputBg}`}
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            className={`w-full p-4 border rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition ${inputBg}`}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-black shadow-lg shadow-teal-500/30 hover:from-teal-400 hover:to-cyan-400 transition disabled:opacity-50 ${isDarkMode ? 'border border-white/10' : ''}`}
          >
            {isLoading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
      
      <Link to="/" className={`block mt-7 text-center text-sm font-bold transition ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}>
        {isComplete ? 'Continue to login' : 'Back to login'}
      </Link>
    </AuthShell>
  );
}
