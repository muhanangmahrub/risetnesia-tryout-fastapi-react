import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { AlertCircle, Clock } from 'lucide-react';

export const ExamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reviewMarked, setReviewMarked] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warnings, setWarnings] = useState(0);

  const { data: tryout, isLoading } = useQuery({
    queryKey: ['tryout', id],
    queryFn: async () => {
      const res = await api.get(`/tryouts/${id}`);
      return res.data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/results/submit', payload);
      return res.data;
    },
    onSuccess: () => {
      navigate('/student');
    }
  });

  const handleSubmit = useCallback(() => {
    if (!tryout) return;
    
    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      question_id: parseInt(qId),
      answer: ans
    }));

    submitMutation.mutate({
      tryout_id: parseInt(id!),
      answers: formattedAnswers,
      warnings_count: warnings
    });
  }, [answers, tryout, id, submitMutation]);

  // Anti-cheating & Timer
  useEffect(() => {
    if (tryout && timeLeft === null) {
      setTimeLeft(tryout.duration_minutes * 60);
    }

    if (timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      // Auto submit
      handleSubmit();
    }
  }, [timeLeft, tryout, handleSubmit]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => w + 1);
        alert("Warning: Tab switching detected! This action has been recorded.");
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Copy/Paste is disabled during the exam.");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading Exam...</div>;
  if (!tryout) return <div className="min-h-screen flex items-center justify-center">Tryout not found.</div>;

  const currentQuestion = tryout.questions[currentQuestionIndex];
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (opt: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: opt
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Exam Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="font-bold text-lg text-slate-800">{tryout.title}</h1>
          <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {tryout.questions.length}</p>
        </div>
        <div className="flex gap-6 items-center">
          {warnings > 0 && (
            <div className="flex items-center gap-1 text-red-500 text-sm font-semibold animate-pulse">
              <AlertCircle size={16} /> Warnings: {warnings}
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg font-mono text-lg font-bold text-slate-800">
            <Clock size={20} className="text-brand-500" />
            {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
          </div>
          <Button variant="danger" onClick={() => {
            if(window.confirm('Are you sure you want to submit early?')) {
              handleSubmit();
            }
          }} isLoading={submitMutation.isPending}>
            Submit Exam
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 flex flex-col">
        {currentQuestion ? (
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 mb-6">
              <CardBody className="text-lg">
                <div className="prose max-w-none text-slate-800 mb-8" dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }} />
                {currentQuestion.image_url && (
                  <div className="mb-6">
                    <img
                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api/v1', '')}${currentQuestion.image_url}`}
                      alt="Gambar soal"
                      className="max-h-72 rounded-lg border border-slate-200 object-contain mx-auto"
                    />
                  </div>
                )}

                <div className="space-y-4 mt-8">
                  {/* ESSAY */}
                  {currentQuestion.question_type === 'ESSAY' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Jawaban Anda:</label>
                      <textarea 
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                        className="w-full border border-slate-300 rounded p-4 text-slate-800 focus:border-brand-500 focus:ring focus:ring-brand-200 outline-none transition-all min-h-[100px] resize-y"
                        placeholder="Ketik jawaban Anda di sini..."
                      />
                    </div>
                  )}

                  {/* MULTIPLE_CHOICE */}
                  {(!currentQuestion.question_type || currentQuestion.question_type === 'MULTIPLE_CHOICE') && (
                    ['A', 'B', 'C', 'D'].map((opt) => {
                      const optionText = currentQuestion[`option_${opt.toLowerCase()}` as keyof typeof currentQuestion];
                      const isSelected = answers[currentQuestion.id] === opt;
                      return (
                        <div 
                          key={opt}
                          onClick={() => handleOptionSelect(opt)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-4 ${
                            isSelected 
                              ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm shadow-brand-100' 
                              : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white text-slate-500'
                          }`}>
                            {opt}
                          </div>
                          <div className="pt-0.5">{optionText as string}</div>
                        </div>
                      );
                    })
                  )}

                  {/* MULTIPLE_ANSWERS */}
                  {currentQuestion.question_type === 'MULTIPLE_ANSWERS' && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 italic">Pilih semua jawaban yang benar (bisa lebih dari satu)</p>
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const optionText = currentQuestion[`option_${opt.toLowerCase()}` as keyof typeof currentQuestion];
                        const selected = (answers[currentQuestion.id] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                        const isSelected = selected.includes(opt);
                        return (
                          <div 
                            key={opt}
                            onClick={() => {
                              const cur = (answers[currentQuestion.id] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                              const next = isSelected ? cur.filter((x: string) => x !== opt) : [...cur, opt].sort();
                              setAnswers(prev => ({ ...prev, [currentQuestion.id]: next.join(',') }));
                            }}
                            className={`p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-4 ${
                              isSelected 
                                ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm shadow-brand-100' 
                                : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold transition-all ${
                              isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 bg-white text-slate-500'
                            }`}>
                              {isSelected ? '✓' : opt}
                            </div>
                            <div className="pt-0.5">{optionText as string}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TRUE_FALSE */}
                  {currentQuestion.question_type === 'TRUE_FALSE' && (
                    <div>
                      <p className="text-sm text-slate-500 italic mb-3">Pilih Benar atau Salah untuk setiap pernyataan</p>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="p-3 text-left text-slate-600 font-semibold">Pernyataan</th>
                              <th className="p-3 text-center text-slate-600 font-semibold w-24">BENAR</th>
                              <th className="p-3 text-center text-slate-600 font-semibold w-24">SALAH</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(['a','b','c','d'] as const).map((opt, idx) => {
                              const stmt = currentQuestion[`option_${opt}` as keyof typeof currentQuestion] as string;
                              if (!stmt) return null;
                              const tfAnswers = (answers[currentQuestion.id] || '').split(',').map((s: string) => s.trim());
                              while(tfAnswers.length < 4) tfAnswers.push('');
                              const ans = tfAnswers[idx] || '';
                              const updateTF = (val: string) => {
                                const a = (answers[currentQuestion.id] || '').split(',').map((s: string) => s.trim());
                                while(a.length < 4) a.push('');
                                a[idx] = val;
                                setAnswers(prev => ({ ...prev, [currentQuestion.id]: a.join(',') }));
                              };
                              return (
                                <tr key={opt} className="border-t border-slate-100">
                                  <td className="p-3 text-slate-700">{stmt}</td>
                                  <td className="p-3 text-center">
                                    <button onClick={() => updateTF('T')}
                                      className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all ${
                                        ans === 'T' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-slate-400 hover:border-green-400'
                                      }`}>B</button>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button onClick={() => updateTF('F')}
                                      className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all ${
                                        ans === 'F' ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 text-slate-400 hover:border-red-400'
                                      }`}>S</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <div className="flex justify-between items-center mb-4 px-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  checked={!!reviewMarked[currentQuestion.id]}
                  onChange={(e) => setReviewMarked(p => ({...p, [currentQuestion.id]: e.target.checked}))}
                />
                Flag for Review
              </label>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Button 
                variant="secondary" 
                onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <div className="flex gap-2 overflow-x-auto max-w-sm hide-scrollbar">
                {tryout.questions.map((q: any, idx: number) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center text-sm font-medium transition-colors ${
                      idx === currentQuestionIndex 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : reviewMarked[q.id]
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : answers[q.id] 
                            ? 'bg-brand-100 text-brand-700 border border-brand-200' 
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <Button 
                onClick={() => setCurrentQuestionIndex(p => Math.min(tryout.questions.length - 1, p + 1))}
                disabled={currentQuestionIndex === tryout.questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">No questions available in this tryout.</div>
        )}
      </main>
    </div>
  );
};
