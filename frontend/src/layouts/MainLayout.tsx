import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User, LayoutDashboard } from 'lucide-react';

export const MainLayout = ({ children, user }: { children: React.ReactNode, user?: any }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
    navigate('/login');
    window.location.reload();
  };

  // If no user object passed (e.g. login page), just render children
  if (!user) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex h-screen fixed">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/30">
            TO
          </div>
          <span className="font-bold tracking-wider">TRYOUT PRO</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4 cursor-default">
            Main Menu
          </div>
          <a href={user.role === 'student' ? '/student' : '/dashboard'} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-600/10 text-brand-400 font-medium transition-colors hover:bg-brand-600/20">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          {/* Add more links based on role later */}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User size={20} className="text-slate-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-500"></div> TRYOUT
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 bg-slate-50 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
