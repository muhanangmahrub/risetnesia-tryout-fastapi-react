import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, Trophy, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { ExamReviewModal } from '../../components/ui/ExamReviewModal';
import { AvailableTryoutsTab } from './tabs/AvailableTryoutsTab';
import { MyResultsTab } from './tabs/MyResultsTab';
import { LeaderboardTab } from './tabs/LeaderboardTab';

export const StudentDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tryouts' | 'results' | 'leaderboard'>('tryouts');
  const [leaderboardTryoutId, setLeaderboardTryoutId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ tryoutId: number; title: string } | null>(null);
  const [joinCode, setJoinCode] = useState('');

  const joinClassMutation = useMutation({
    mutationFn: async (code: string) => (await api.post('/classes/join', { code })).data,
    onSuccess: () => {
      alert('Berhasil bergabung ke kelas!');
      setJoinCode('');
      // Invalidate queries that might be related to class memberships
      queryClient.invalidateQueries({ queryKey: ['available-tryouts'] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error bergabung ke kelas. Kode salah?')
  });

  const { data: myClasses } = useQuery({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const res = await api.get('/classes/my');
      return res.data;
    }
  });

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

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
          <p className="text-slate-500 mt-1">View available tryouts, track your performance, and see rankings.</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex gap-2 items-center w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Masukkan Kode Kelas" 
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full md:w-48 bg-white"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button 
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors whitespace-nowrap disabled:opacity-50"
            disabled={!joinCode || joinClassMutation.isPending}
            onClick={() => joinClassMutation.mutate(joinCode)}
          >
            {joinClassMutation.isPending ? 'Joining...' : 'Join Class'}
          </button>
        </div>
      </div>

      {myClasses && myClasses.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-slate-500 font-medium mr-1 flex items-center gap-1.5"><BookOpen size={16}/> Kelas Saya:</span>
          {myClasses.map((c: any) => (
            <span key={c.id} className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-medium shadow-sm">
              {c.name}
            </span>
          ))}
        </div>
      )}

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
