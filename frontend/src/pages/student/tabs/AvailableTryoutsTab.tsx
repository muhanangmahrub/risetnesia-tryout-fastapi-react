import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Clock, Calendar, CheckCircle, BookOpen } from 'lucide-react';

const correctUTC = (dateStr: string | null) => {
  if (!dateStr) return null;
  if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) return new Date(dateStr);
  return new Date(dateStr + 'Z');
};

export const AvailableTryoutsTab = ({
  setReviewModal
}: {
  setReviewModal: (data: { tryoutId: number; title: string }) => void
}) => {
  const navigate = useNavigate();

  const { data: tryouts, isLoading: tLoading } = useQuery({
    queryKey: ['available-tryouts'],
    queryFn: async () => {
      const res = await api.get('/tryouts');
      return res.data;
    }
  });

  const { data: results } = useQuery({
    queryKey: ['my-results'],
    queryFn: async () => {
      const res = await api.get('/results/my-results');
      return res.data;
    }
  });

  if (tLoading) return <div className="text-center py-8">Loading available tryouts...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tryouts?.length === 0 && <p className="text-slate-500 p-4">No tryouts available at the moment.</p>}
      {tryouts?.map((t: any) => {
        const startTime = correctUTC(t.start_time);
        const endTime = correctUTC(t.end_time);
        const now = new Date();
        const isStarted = !startTime || startTime <= now;
        const isEnded = endTime ? endTime < now : false;
        const isAvailable = isStarted && !isEnded;
        const isCompleted = results?.some((r: any) => r.tryout_id === t.id);

        return (
          <Card key={t.id} className={`flex flex-col transition-all ${isAvailable && !isCompleted ? 'hover:shadow-xl hover:-translate-y-1' : ''}`}>
            <CardHeader>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{t.title}</h3>
            </CardHeader>
            <CardBody className="flex flex-col flex-1">
              <div className="space-y-1.5 mb-4 flex-1">
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
                  <button
                    onClick={() => setReviewModal({ tryoutId: t.id, title: t.title })}
                    className="w-full py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen size={14} /> Lihat Pembahasan
                  </button>
                ) : isStarted && !isEnded ? (
                  <Button className="w-full" onClick={() => navigate(`/student/exam/${t.id}`)}>
                    Mulai Ujian
                  </Button>
                ) : isEnded ? (
                  <button disabled className="w-full py-2 rounded-lg bg-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed">
                    Ujian Telah Berakhir
                  </button>
                ) : (
                  <button disabled className="w-full py-2 rounded-lg bg-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed">
                    Belum Dimulai
                  </button>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};
