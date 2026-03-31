import { useState } from 'react';
import { Users, BookOpen, Calendar, FileQuestion, CheckCircle2, BarChart3 } from 'lucide-react';

import { UsersTab } from './tabs/UsersTab';
import { ClassesTab } from './tabs/ClassesTab';
import { SchedulingTab } from './tabs/SchedulingTab';
import { QuestionsTab } from './tabs/QuestionsTab';
import { TryoutsTab } from './tabs/TryoutsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

type Tab = 'users' | 'classes' | 'scheduling' | 'questions' | 'tryouts' | 'analytics';

export const ManagementDashboard = ({ user }: { user: any }) => {
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<Tab>('questions');

  const tabClass = (tab: Tab) =>
    `pb-4 px-2 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
      activeTab === tab ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Kelola semua fitur platform tryout dari sini.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        <button className={tabClass('questions')} onClick={() => setActiveTab('questions')}>
          <FileQuestion size={18} /> Bank Soal
        </button>
        <button className={tabClass('tryouts')} onClick={() => setActiveTab('tryouts')}>
          <CheckCircle2 size={18} /> Paket Tryout
        </button>
        <button className={tabClass('analytics')} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={18} /> Analitik
        </button>
        {isAdmin && (
          <button className={tabClass('scheduling')} onClick={() => setActiveTab('scheduling')}>
            <Calendar size={18} /> Penjadwalan
          </button>
        )}
        {isAdmin && (
          <button className={tabClass('classes')} onClick={() => setActiveTab('classes')}>
            <BookOpen size={18} /> Kelas
          </button>
        )}
        {isAdmin && (
          <button className={tabClass('users')} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Pengguna
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'tryouts' && <TryoutsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'scheduling' && isAdmin && <SchedulingTab isAdmin={isAdmin} />}
        {activeTab === 'classes' && isAdmin && <ClassesTab isAdmin={isAdmin} />}
        {activeTab === 'users' && isAdmin && <UsersTab isAdmin={isAdmin} />}
      </div>
    </div>
  );
};
