import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BookOpen } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      setSuccessMsg('Registration successful! Please sign in.');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 expects 'username' instead of 'email'
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);

      // Fetch user role to redirect
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });

      navigate(`/${userRes.data.role}`);
      window.location.reload(); // Quick way to reset React Query state
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse animation-delay-2000"></div>

      <div className="w-full max-w-md relative z-10 glass rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/20 backdrop-blur-md border border-brand-500/30 mb-4 shadow-lg shadow-brand-500/20">
            <BookOpen className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-Brand-100/70 text-slate-300">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            labelClassName="text-slate-200"
            inputClassName="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            labelClassName="text-slate-200"
            inputClassName="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500"
          />

          <Button
            type="submit"
            className="w-full py-3 text-lg font-semibold shadow-brand-500/30 shadow-lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium hover:underline transition-colors">
              Sign Up
            </Link>
          </p>
          {/* <p className="mt-4 opacity-50">Mock login for testing: admin@test.com / password123</p> */}
        </div>
      </div>
    </div>
  );
};
