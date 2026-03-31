import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MathRenderer } from '../../components/ui/MathRenderer';
import { Clock, CheckCircle, Trophy, Calendar, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const correctUTC = (dateStr: string | null) => {
  if (!dateStr) return null;
  if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) return new Date(dateStr);
  return new Date(dateStr + 'Z');
};

// ── Exam Review Modal ──────────────────────────────────────────────────────────
const ExamReviewModal = ({ tryoutId, tryoutTitle, onClose }: { tryoutId: number; tryoutTitle: string; onClose: () => void }) => {
  const [idx, setIdx] = useState(0);

  const { data: review, isLoading, error } = useQuery({
    queryKey: ['exam-review', tryoutId],
    queryFn: async () => {
      const res = await api.get(`/results/review/${tryoutId}`);
      return res.data as ReviewItem[];
    },
  });

  const q = review?.[idx];
  const total = review?.length || 0;

  const optionLabel: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D' };

  const getOptionStyle = (opt: string, q: ReviewItem) => {
    const isCorrect = opt.toUpperCase() === q.correct_answer?.toUpperCase();
    const isStudentAnswer = opt.toUpperCase() === q.student_answer?.toUpperCase();
    if (isCorrect && isStudentAnswer) return 'border-green-500 bg-green-50 text-green-900'; // right answer, correctly chosen
    if (isCorrect) return 'border-green-400 bg-green-50 text-green-800';                    // right answer, not chosen
    if (isStudentAnswer && !isCorrect) return 'border-red-400 bg-red-50 text-red-800';     // wrong answer chosen
    return 'border-slate-200 text-slate-600';
  };

  const getOptionIcon = (opt: string, q: ReviewItem) => {
    const isCorrect = opt.toUpperCase() === q.correct_answer?.toUpperCase();
    const isStudentAnswer = opt.toUpperCase() === q.student_answer?.toUpperCase();
    if (isCorrect) return '✓';
    if (isStudentAnswer && !isCorrect) return '✗';
    return optionLabel[opt] || opt;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{tryoutTitle}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Pembahasan Soal</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Score summary */}
        {review && (
          <div className="flex gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-sm flex-shrink-0">
            <span className="text-green-700 font-semibold">✓ {review.filter(r => r.is_correct).length} Benar</span>
            <span className="text-red-600 font-semibold">✗ {review.filter(r => !r.is_correct).length} Salah</span>
            <span className="text-slate-500">dari {total} soal</span>
            {/* Progress dots */}
            <div className="flex gap-1 ml-auto flex-wrap">
              {review.map((r, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-4 h-4 rounded-full border transition-all ${i === idx ? 'ring-2 ring-brand-400 scale-110' : ''} ${r.is_correct ? 'bg-green-400' : 'bg-red-400'}`}
                  title={`Soal ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {isLoading && <div className="text-center py-12 text-slate-500">Memuat pembahasan...</div>}
          {error && <div className="text-center py-12 text-red-500">Gagal memuat data pembahasan.</div>}

          {q && (
            <div className="space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Soal {idx + 1} dari {total}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${q.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {q.is_correct ? '✓ Benar' : '✗ Salah'}
                </span>
                {q.subject && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{q.subject}</span>}
              </div>

              {/* Question */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <MathRenderer html={q.question_text} className="text-slate-800" />
                {q.image_url && (
                  <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api/v1', '')}${q.image_url}`}
                    alt="Gambar soal" className="mt-3 max-h-48 rounded-lg object-contain" />
                )}
              </div>

              {/* Options */}
              {(!q.question_type || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'MULTIPLE_ANSWERS') && (
                <div className="space-y-2">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => {
                    const text = q[`option_${opt}` as keyof ReviewItem] as string;
                    if (!text) return null;
                    return (
                      <div key={opt}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 ${getOptionStyle(opt, q)}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          opt.toUpperCase() === q.correct_answer?.toUpperCase() ? 'bg-green-500 text-white' :
                          opt.toUpperCase() === q.student_answer?.toUpperCase() ? 'bg-red-500 text-white' :
                          'bg-white border border-current'
                        }`}>{getOptionIcon(opt, q)}</div>
                        <span className="pt-0.5 text-sm">{text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRUE_FALSE */}
              {q.question_type === 'TRUE_FALSE' && (() => {
                const correctArr = (q.correct_answer || '').split(',').map((s: string) => s.trim());
                const studentArr = (q.student_answer || '').split(',').map((s: string) => s.trim());
                return (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                    <table className="w-full">
                      <thead><tr className="bg-slate-50 border-b">
                        <th className="p-3 text-left text-slate-600">Pernyataan</th>
                        <th className="p-3 text-center w-24 text-slate-600">Jawaban Anda</th>
                        <th className="p-3 text-center w-24 text-slate-600">Kunci</th>
                      </tr></thead>
                      <tbody>
                        {(['a','b','c','d'] as const).map((opt, i) => {
                          const stmt = q[`option_${opt}` as keyof ReviewItem] as string;
                          if (!stmt) return null;
                          const sa = studentArr[i] || '-';
                          const ca = correctArr[i] || '-';
                          const correct = sa === ca;
                          return (
                            <tr key={opt} className="border-t border-slate-100">
                              <td className="p-3 text-slate-700">{stmt}</td>
                              <td className={`p-3 text-center font-bold ${correct ? 'text-green-600' : 'text-red-600'}`}>{sa === 'T' ? 'Benar' : sa === 'F' ? 'Salah' : '-'}</td>
                              <td className="p-3 text-center font-bold text-green-700">{ca === 'T' ? 'Benar' : ca === 'F' ? 'Salah' : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ESSAY */}
              {q.question_type === 'ESSAY' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Jawaban Anda</p>
                    <p className="text-sm text-slate-800">{q.student_answer || <span className="italic text-slate-400">Tidak dijawab</span>}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-600 mb-1">Jawaban Benar</p>
                    <p className="text-sm text-slate-800">{q.correct_answer}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">Pembahasan</span>
                  </div>
                  <MathRenderer html={q.explanation} className="text-sm text-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <Button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>
            <ChevronLeft size={16} className="mr-1" /> Sebelumnya
          </Button>
          <span className="text-sm text-slate-500">{idx + 1} / {total}</span>
          <Button onClick={() => setIdx(i => Math.min(total - 1, i + 1))} disabled={idx === total - 1}>
            Berikutnya <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ReviewItem {
  question_id: number;
  question_text: string;
  question_type: string;
  image_url?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  student_answer?: string;
  is_correct: boolean;
  explanation?: string;
  subject?: string;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tryouts' | 'results' | 'leaderboard'>('tryouts');
  const [leaderboardTryoutId, setLeaderboardTryoutId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ tryoutId: number; title: string } | null>(null);

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

      {activeTab === 'tryouts' && (
        <div>
          {tLoading ? <div className="text-center py-8">Loading available tryouts...</div> : (
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
