import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { CardHeader, CardBody } from '../../../components/ui/Card';
import { AdminReviewModal } from '../../../components/ui/AdminReviewModal';
import { BarChart3, AlertCircle, BookOpen } from 'lucide-react';

export const AnalyticsTab = () => {
  const [analyticsTryoutId, setAnalyticsTryoutId] = useState<number | null>(null);
  const [adminReviewModal, setAdminReviewModal] = useState<{ tryoutId: number; studentId: number; studentName: string } | null>(null);

  const { data: tryouts } = useQuery({
    queryKey: ['tryouts'],
    queryFn: async () => (await api.get('/tryouts')).data,
  });

  const { data: analyticsData, isLoading: aLoading } = useQuery({
    queryKey: ['analytics', analyticsTryoutId],
    queryFn: async () => (await api.get(`/results/tryout/${analyticsTryoutId}/leaderboard`)).data,
    enabled: !!analyticsTryoutId
  });

  return (
    <>
      {adminReviewModal && (
        <AdminReviewModal
          tryoutId={adminReviewModal.tryoutId}
          studentId={adminReviewModal.studentId}
          studentName={adminReviewModal.studentName}
          onClose={() => setAdminReviewModal(null)}
        />
      )}
      
      <CardHeader className="flex justify-between items-center bg-slate-50 border-b">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><BarChart3 size={20} className="text-brand-600" /> Analitik Performa Siswa</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Pilih Tryout:</label>
          <select className="border border-slate-300 rounded-md p-2 text-sm max-w-xs bg-white" value={analyticsTryoutId || ''} onChange={(e) => setAnalyticsTryoutId(e.target.value ? parseInt(e.target.value) : null)}>
            <option value="">-- Pilih Tryout --</option>
            {tryouts?.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardBody>
        {!analyticsTryoutId ? (
          <div className="text-center py-12 text-slate-500"><BarChart3 size={48} className="mx-auto mb-4 text-slate-300" />Pilih paket tryout di atas untuk melihat analitik.</div>
        ) : aLoading ? <div className="text-center py-8">Memuat data...</div>
          : analyticsData?.length === 0 ? <div className="text-center py-12 text-slate-500">Belum ada siswa yang menyelesaikan tryout ini.</div>
            : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl"><div className="text-brand-600 text-sm font-semibold uppercase mb-1">Total Submit</div><div className="text-3xl font-bold">{analyticsData.length}</div></div>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl"><div className="text-green-600 text-sm font-semibold uppercase mb-1">Nilai Rata-Rata</div><div className="text-3xl font-bold">{Math.round(analyticsData.reduce((a: any, c: any) => a + c.score, 0) / analyticsData.length)}%</div></div>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl"><div className="text-amber-600 text-sm font-semibold uppercase mb-1">Nilai Tertinggi</div><div className="text-3xl font-bold">{Math.max(...analyticsData.map((d: any) => d.score))}%</div></div>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-slate-800 mb-4">Peringkat Siswa</h3>
                  <div className="space-y-4">
                    {[...analyticsData].sort((a: any, b: any) => b.score - a.score).map((result: any, index: number) => (
                      <div key={result.id} className="flex items-center gap-4">
                        <div className="w-8 text-right font-semibold text-slate-400">#{index + 1}</div>
                        <div className="w-48 truncate text-sm font-medium text-slate-800 flex items-center gap-2">
                          {result.student?.name || 'Siswa'}
                          {result.warnings_count > 0 && (
                            <div className="flex items-center gap-1 text-red-500" title={`${result.warnings_count} peringatan pindah tab`}>
                              <AlertCircle size={14} />
                              <span className="text-[10px] font-bold">{result.warnings_count}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1"><div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-brand-500' : result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${result.score}%` }} /></div></div>
                        <div className="w-16 text-right font-bold text-slate-800">{result.score}%</div>
                        <button
                          onClick={() => setAdminReviewModal({ tryoutId: analyticsTryoutId!, studentId: result.student_id, studentName: result.student?.name || 'Siswa' })}
                          className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Lihat jawaban siswa ini"
                        >
                          <BookOpen size={12} /> Detail
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
      </CardBody>
    </>
  );
};
