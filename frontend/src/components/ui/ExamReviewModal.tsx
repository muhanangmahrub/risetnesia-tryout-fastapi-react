import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Button } from './Button';
import { MathRenderer } from './MathRenderer';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export interface ReviewItem {
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

export const ExamReviewModal = ({ tryoutId, tryoutTitle, onClose }: { tryoutId: number; tryoutTitle: string; onClose: () => void }) => {
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
    if (isCorrect && isStudentAnswer) return 'border-green-500 bg-green-50 text-green-900';
    if (isCorrect) return 'border-green-400 bg-green-50 text-green-800';
    if (isStudentAnswer && !isCorrect) return 'border-red-400 bg-red-50 text-red-800';
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
            <span className="text-red-600 font-semibold">✗ {review.filter(r => !r.is_correct && r.student_answer).length} Salah</span>
            <span className="text-slate-500 font-semibold">— {review.filter(r => !r.is_correct && !r.student_answer).length} Kosong</span>
            <span className="text-slate-500 hidden sm:inline">dari {total} soal</span>
            {/* Progress dots */}
            <div className="flex gap-1 ml-auto flex-wrap">
              {review.map((r, i) => {
                const isUnanswered = !r.is_correct && !r.student_answer;
                const dotColor = r.is_correct ? 'bg-green-400' : isUnanswered ? 'bg-slate-300' : 'bg-red-400';
                return (
                  <button key={i} onClick={() => setIdx(i)}
                    className={`w-4 h-4 rounded-full border transition-all ${i === idx ? 'ring-2 ring-brand-400 scale-110' : ''} ${dotColor}`}
                    title={`Soal ${i + 1}`}
                  />
                );
              })}
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
                {(() => {
                  const isUnanswered = !q.is_correct && !q.student_answer;
                  if (q.is_correct) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Benar</span>;
                  if (isUnanswered) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">— Tidak Dijawab</span>;
                  return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">✗ Salah</span>;
                })()}
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
