import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, CheckCircle, Trophy, Calendar } from 'lucide-react';

const correctUTC = (dateStr: string | null) => {
  if (!dateStr) return null;
  if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) return new Date(dateStr);
  return new Date(dateStr + 'Z');
};

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tryouts' | 'results' | 'leaderboard'>('tryouts');
  const [leaderboardTryoutId, setLeaderboardTryoutId] = useState<number | null>(null);

  const { data: tryouts, isLoading: tLoading } = useQuery({
    queryKey: ['available-tryouts'],
    queryFn: async () => {
      const res = await api.get('/tryouts');
      return res.data;
    },
    enabled: activeTab === 'tryouts' || activeTab === 'leaderboard'
  });

  // Always fetch so we can detect completed tryouts from any tab
  const { data: results, isLoading: rLoading } = useQuery({
    queryKey: ['my-results'],
    queryFn: async () => {
      const res = await api.get('/results/my-results');
      return res.data;
    },
    enabled: true
  });

  const { data: leaderboardData, isLoading: lLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardTryoutId],
    queryFn: async () => {
      const res = await api.get(`/results/tryout/${leaderboardTryoutId}/leaderboard`);
      return res.data;
    },
    enabled: !!leaderboardTryoutId && activeTab === 'leaderboard'
  });

  return (
    <div className="space-y-8">
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

      {activeTab === 'tryouts' && (
        <div>
          {tLoading ? <div className="text-center py-8">Loading available tryouts...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tryouts?.length === 0 && <p className="text-slate-500 p-4">No tryouts available at the moment.</p>}
              {tryouts && [...tryouts].sort((a: any, b: any) => {
                const now = new Date();
                const isACompleted = results?.some((r: any) => r.tryout_id === a.id);
                const isBCompleted = results?.some((r: any) => r.tryout_id === b.id);
                if (isACompleted !== isBCompleted) return isACompleted ? 1 : -1;
                
                const getPriority = (t: any) => {
                  const startTime = correctUTC(t.start_time);
                  const endTime = correctUTC(t.end_time);
                  const isStarted = startTime ? now >= startTime : true;
                  const isEnded = endTime ? now > endTime : false;
                  if (isStarted && !isEnded) return 1;
                  if (!isStarted) return 2;
                  return 3;
                };
                
                const pA = getPriority(a);
                const pB = getPriority(b);
                if (pA !== pB) return pA - pB;
                
                return b.id - a.id;
              }).map((t: any) => {
                const isCompleted = results?.some((r: any) => r.tryout_id === t.id);
                const now = new Date();
                const startTime = correctUTC(t.start_time);
                const endTime = correctUTC(t.end_time);
                
                const isStarted = startTime ? now >= startTime : true;
                const isEnded = endTime ? now > endTime : false;
                const isAvailable = isStarted && !isEnded;

                return (
                  <Card key={t.id} className={`hover:-translate-y-1 transition-transform relative overflow-hidden group ${isCompleted || isEnded ? 'opacity-70' : ''}`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${isCompleted ? 'bg-slate-400' : isAvailable ? 'bg-brand-500' : isEnded ? 'bg-red-400' : 'bg-amber-400'}`}></div>
                    <CardBody className="flex flex-col h-full pl-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{t.title}</h3>
                        {!isCompleted && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isAvailable ? 'bg-brand-100 text-brand-700' : 
                            isEnded ? 'bg-red-100 text-red-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {isAvailable ? 'Berlangsung' : isEnded ? 'Berakhir' : 'Mendatang'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mb-4">
                        <div className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" /> {t.duration_minutes} menit
                        </div>
                        {startTime && !isStarted && (
                          <div className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                            <Calendar size={14} /> Mulai: {startTime.toLocaleString()}
                          </div>
                        )}
                        {endTime && isAvailable && (
                          <div className="text-xs text-brand-600 font-medium flex items-center gap-1.5">
                            <Calendar size={14} /> Berakhir: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      {isCompleted && (
                        <p className="text-xs text-green-600 mb-3 flex items-center gap-1 font-medium">
                          <CheckCircle size={12} /> Ujian telah diselesaikan
                        </p>
                      )}

                      <div className="mt-auto">
                        {isCompleted ? (
                          <button disabled className="w-full py-2 rounded-lg bg-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed">
                            ✓ Selesai
                          </button>
                        ) : isStarted && !isEnded ? (
                          <Button
                            className="w-full"
                            onClick={() => navigate(`/student/exam/${t.id}`)}
                          >
                            Mulai Ujian
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            variant="secondary"
                            disabled
                          >
                            {isEnded ? 'Pendaftaran Ditutup' : 'Belum Dibuka'}
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6">
          {rLoading ? <div className="text-center py-8">Loading your results...</div> : (
            <>
              {results?.length === 0 ? (
                 <Card><CardBody><p className="text-slate-500 text-center py-8">You haven't completed any tryouts yet.</p></CardBody></Card>
              ) : (
                 <div className="grid grid-cols-1 gap-6">
                    {results.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((r: any) => {
                      const percentage = Math.round(r.score);
                      return (
                        <Card key={r.id}>
                          <CardBody className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 w-full">
                               <div className="flex items-center gap-2 mb-1">
                                 <h3 className="font-bold text-lg text-slate-900">{r.tryout?.title || `Tryout #${r.tryout_id}`}</h3>
                                 <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-full">{correctUTC(r.created_at)?.toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm text-slate-600 mb-4">Completed successfully! Here is your performance breakdown.</p>
                               
                               <div className="flex gap-4 text-sm font-medium">
                                 <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-100"><CheckCircle size={14}/> {r.correct_count} Correct</div>
                                 <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-100"><CheckCircle size={14}/> {r.wrong_count} Wrong</div>
                               </div>
                            </div>
                            
                            <div className="w-full md:w-48 bg-slate-50 rounded-xl p-4 border border-slate-100 text-center flex-shrink-0">
                               <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Final Score</div>
                               <div className={`text-4xl font-extrabold ${percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-brand-500' : percentage >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                 {percentage}
                               </div>
                               <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                                  <div className={`h-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-brand-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${percentage}%`}}></div>
                               </div>
                            </div>
                          </CardBody>
                        </Card>
                      )
                    })}
                 </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> System Leaderboards
            </h2>
            <select 
              className="border border-slate-300 rounded-lg p-2 text-sm w-full sm:w-64 max-w-xs focus:ring-brand-500 focus:border-brand-500"
              value={leaderboardTryoutId || ''}
              onChange={(e) => setLeaderboardTryoutId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">-- Choose Tryout --</option>
              {tryouts?.map((t:any) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </CardHeader>
          <CardBody>
            {!leaderboardTryoutId ? (
              <div className="text-center py-12 text-slate-500">
                <Trophy size={48} className="mx-auto mb-4 text-slate-300" />
                Select a tryout package above to view the leaderboard rankings!
              </div>
            ) : lLoading ? (
              <div className="text-center py-8">Loading rankings...</div>
            ) : leaderboardData?.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No students have completed this tryout yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="p-4 font-medium rounded-tl-lg w-16">Rank</th>
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium text-right rounded-tr-lg">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.sort((a:any, b:any) => b.score - a.score).map((r: any, idx: number) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          {idx === 0 ? <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold"><Trophy size={16}/></span> : 
                           idx === 1 ? <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold">2</span> :
                           idx === 2 ? <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold">3</span> :
                           <span className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 font-medium">{idx + 1}</span>}
                        </td>
                        <td className="p-4 font-medium text-slate-900">{r.student?.name || r.student_name || 'Unknown'}</td>
                        <td className="p-4 text-right font-bold text-slate-800 text-lg">{Math.round(r.score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};
