import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BookOpen } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Step 1: Register User
      await api.post('/auth/register', {
        name,
        school,
        email,
        password
      });

      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register. Please try again.');
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
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create an Account</h1>
          <p className="text-Brand-100/70 text-slate-300">Join us and start your journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <Input
            label="Full Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Budi Santoso"
            labelClassName="text-slate-200"
            inputClassName="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500"
          />
          <Input
            label="School"
            type="text"
            required
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="SMA N 1 Jakarta"
            labelClassName="text-slate-200"
            inputClassName="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500"
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="budi@example.com"
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
            Sign Up
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
