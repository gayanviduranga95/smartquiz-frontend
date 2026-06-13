import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { AuthShell, StatusMessage } from './ForgotPassword';

export default function ResetPassword() {
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

  return (
    <AuthShell title="Create new password" subtitle="Choose a strong password with at least 8 characters.">
      {message && <StatusMessage message={message} isError={isError} />}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            minLength={8}
            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-black shadow-lg shadow-teal-500/30 disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
      <Link to="/" className="block mt-7 text-center text-sm font-bold text-teal-600 hover:text-teal-700">
        {isComplete ? 'Continue to login' : 'Back to login'}
      </Link>
    </AuthShell>
  );
}
