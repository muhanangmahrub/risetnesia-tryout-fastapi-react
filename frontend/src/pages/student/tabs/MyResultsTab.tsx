import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card, CardBody } from '../../../components/ui/Card';
import { CheckCircle, X, BookOpen } from 'lucide-react';

const correctUTC = (dateStr: string | null) => {
  if (!dateStr) return null;
  if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) return new Date(dateStr);
  return new Date(dateStr + 'Z');
};

export const MyResultsTab = ({
  setReviewModal
}: {
  setReviewModal: (data: { tryoutId: number; title: string }) => void
}) => {
  const { data: results, isLoading: rLoading } = useQuery({
    queryKey: ['my-results'],
    queryFn: async () => {
      const res = await api.get('/results/my-results');
      return res.data;
    }
  });

  if (rLoading) return <div className="text-center py-8">Loading your results...</div>;

  if (results?.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-slate-500 text-center py-8">You haven't completed any tryouts yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {results?.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((r: any) => {
        const percentage = Math.round(r.score);
        return (
          <Card key={r.id}>
            <CardBody className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-900">{r.tryout?.title || `Tryout #${r.tryout_id}`}</h3>
                    <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-full">{correctUTC(r.created_at)?.toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Selesai dikerjakan. Klik pembahasan untuk melihat review soal.</p>
                  
                  <div className="flex flex-wrap gap-3 text-sm font-medium">
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-100"><CheckCircle size={14}/> {r.correct_count} Benar</div>
                    <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-100"><X size={14}/> {r.wrong_count} Salah</div>
                    <button
                      onClick={() => setReviewModal({ tryoutId: r.tryout_id, title: r.tryout?.title || `Tryout #${r.tryout_id}` })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <BookOpen size={14} /> Lihat Pembahasan
                    </button>
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
  );
};
