import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { ExamReviewModal } from '../../components/ui/ExamReviewModal';
import { AvailableTryoutsTab } from './tabs/AvailableTryoutsTab';
import { MyResultsTab } from './tabs/MyResultsTab';
import { LeaderboardTab } from './tabs/LeaderboardTab';

export const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'tryouts' | 'results' | 'leaderboard'>('tryouts');
  const [leaderboardTryoutId, setLeaderboardTryoutId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ tryoutId: number; title: string } | null>(null);

  const { data: tryouts } = useQuery({
    queryKey: ['available-tryouts'],
    queryFn: async () => {
      const res = await api.get('/tryouts');
      return res.data;
    },
    enabled: activeTab === 'leaderboard' || activeTab === 'tryouts'
  });

  return (
    <div className="space-y-8">
      {/* Review Modal */}
      {reviewModal && (
        <ExamReviewModal
          tryoutId={reviewModal.tryoutId}
          tryoutTitle={reviewModal.title}
          onClose={() => setReviewModal(null)}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
        <p className="text-slate-500 mt-1">View available tryouts, track your performance, and see rankings.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'tryouts' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('tryouts')}
        >
          <Clock size={18} /> Available Tryouts
        </button>
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'results' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('results')}
        >
          <CheckCircle size={18} /> My Results
        </button>
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'leaderboard' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={18} /> Leaderboards
        </button>
      </div>

      <div>
        {activeTab === 'tryouts' && (
          <AvailableTryoutsTab setReviewModal={setReviewModal} />
        )}

        {activeTab === 'results' && (
          <MyResultsTab setReviewModal={setReviewModal} />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab 
            tryouts={tryouts || []} 
            leaderboardTryoutId={leaderboardTryoutId} 
            setLeaderboardTryoutId={setLeaderboardTryoutId} 
          />
        )}
      </div>
    </div>
  );
};
