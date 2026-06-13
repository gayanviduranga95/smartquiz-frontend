import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

export default function ForgotPassword() {
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

  return (
    <AuthShell title="Forgot password?" subtitle="Enter the username and email for the account you want to reset.">
      {message && <StatusMessage message={message} isError={isError} />}
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="block mb-2 text-sm font-bold text-slate-700">Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your account username"
            autoComplete="username"
            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            required
          />
        </label>
        <label className="block">
          <span className="block mb-2 text-sm font-bold text-slate-700">Email address</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            required
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-black shadow-lg shadow-teal-500/30 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <Link to="/" className="block mt-7 text-center text-sm font-bold text-teal-600 hover:text-teal-700">
        Back to login
      </Link>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[40rem] h-[40rem] rounded-full blur-[120px] bg-teal-300/40" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] rounded-full blur-[100px] bg-cyan-300/40" />
      <section className="backdrop-blur-2xl bg-white/90 p-8 sm:p-10 rounded-3xl w-full max-w-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-10">
        <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-2">
          {title}
        </h1>
        <p className="text-center text-slate-500 font-medium mb-8">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

export function StatusMessage({ message, isError }) {
  return (
    <div className={`mb-6 p-4 rounded-xl font-bold text-center border ${
      isError
        ? 'bg-red-50 text-red-600 border-red-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }`}>
      {message}
    </div>
  );
}
