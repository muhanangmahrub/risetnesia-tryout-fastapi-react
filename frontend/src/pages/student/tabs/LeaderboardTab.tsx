import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Trophy } from 'lucide-react';

export const LeaderboardTab = ({
  tryouts,
  leaderboardTryoutId,
  setLeaderboardTryoutId
}: {
  tryouts: any[];
  leaderboardTryoutId: number | null;
  setLeaderboardTryoutId: (id: number | null) => void;
}) => {
  const { data: leaderboardData, isLoading: lLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardTryoutId],
    queryFn: async () => {
      const res = await api.get(`/results/tryout/${leaderboardTryoutId}/leaderboard`);
      return res.data;
    },
    enabled: !!leaderboardTryoutId
  });

  return (
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
  );
};
