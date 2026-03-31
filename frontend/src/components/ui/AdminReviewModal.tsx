import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Button } from './Button';
import { MathRenderer } from './MathRenderer';
import { X, BookOpen } from 'lucide-react';

export const AdminReviewModal = ({ tryoutId, studentId, studentName, onClose }: {
  tryoutId: number; studentId: number; studentName: string; onClose: () => void;
}) => {
  const [reviewIdx, setReviewIdx] = useState(0);
  const { data: review, isLoading } = useQuery({
    queryKey: ['admin-review', tryoutId, studentId],
    queryFn: async () => (await api.get(`/results/review/${tryoutId}/student/${studentId}`)).data,
  });
  
  const q = review?.[reviewIdx];
  const total = review?.length || 0;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9990] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Jawaban: {studentName}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Review per-soal</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>
        {review && (
          <div className="flex gap-3 px-5 py-3 bg-slate-50 border-b text-sm flex-shrink-0 flex-wrap">
            <span className="text-green-700 font-semibold">✓ {review.filter((r: any) => r.is_correct).length} Benar</span>
            <span className="text-red-600 font-semibold">✗ {review.filter((r: any) => !r.is_correct && r.student_answer).length} Salah</span>
            <span className="text-slate-500 font-semibold">— {review.filter((r: any) => !r.is_correct && !r.student_answer).length} Kosong</span>
            <div className="flex gap-1 ml-auto flex-wrap">
              {review.map((_: any, i: number) => {
                const isUnanswered = !review[i].is_correct && !review[i].student_answer;
                const dotColor = review[i].is_correct ? 'bg-green-400' : isUnanswered ? 'bg-slate-300' : 'bg-red-400';
                return (
                  <button key={i} onClick={() => setReviewIdx(i)}
                    className={`w-4 h-4 rounded-full border transition-all ${i === reviewIdx ? 'ring-2 ring-brand-400 scale-110' : ''} ${dotColor}`} />
                );
              })}
            </div>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-5">
          {isLoading && <div className="text-center py-12 text-slate-500">Memuat...</div>}
          {q && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Soal {reviewIdx + 1}/{total}</span>
                {(() => {
                  const isUnanswered = !q.is_correct && !q.student_answer;
                  if (q.is_correct) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Benar</span>;
                  if (isUnanswered) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">— Tidak Dijawab</span>;
                  return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">✗ Salah</span>;
                })()}
                {q.subject && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{q.subject}</span>}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <MathRenderer html={q.question_text} className="text-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Jawaban Siswa</p>
                  <p className={`text-sm font-bold ${q.is_correct ? 'text-green-700' : 'text-red-700'}`}>{q.student_answer || <span className="italic text-slate-400 font-normal">Tidak dijawab</span>}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-600 mb-1">Kunci Jawaban</p>
                  <p className="text-sm font-bold text-green-700">{q.correct_answer}</p>
                </div>
              </div>
              {q.explanation && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2"><BookOpen size={15} className="text-amber-600" /><span className="text-sm font-bold text-amber-700">Pembahasan</span></div>
                  <MathRenderer html={q.explanation} className="text-sm text-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t bg-slate-50 rounded-b-2xl flex-shrink-0">
          <Button onClick={() => setReviewIdx(i => Math.max(0, i - 1))} disabled={reviewIdx === 0}>← Sebelumnya</Button>
          <span className="text-sm text-slate-500">{reviewIdx + 1} / {total}</span>
          <Button onClick={() => setReviewIdx(i => Math.min(total - 1, i + 1))} disabled={reviewIdx === total - 1}>Berikutnya →</Button>
        </div>
      </div>
    </div>
  );
};
