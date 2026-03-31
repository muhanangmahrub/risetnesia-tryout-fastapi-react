import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileQuestion, CheckCircle2, Upload, X, BarChart3 } from 'lucide-react';

export const TutorDashboard = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'tryouts' | 'analytics'>('questions');
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [qForm, setQForm] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', 
    correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreatingTryout, setIsCreatingTryout] = useState(false);
  const [tForm, setTForm] = useState({ title: '', duration_minutes: 120 });
  const [managingQuestionsTryoutId, setManagingQuestionsTryoutId] = useState<number | null>(null);
  
  const [analyticsTryoutId, setAnalyticsTryoutId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const res = await api.get('/questions');
      return res.data;
    },
    enabled: activeTab === 'questions'
  });

  const { data: tryouts, isLoading: tLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: async () => {
      const res = await api.get('/tryouts');
      return res.data;
    },
    enabled: activeTab === 'tryouts' || activeTab === 'analytics'
  });

  const { data: analyticsData, isLoading: aLoading } = useQuery({
    queryKey: ['analytics', analyticsTryoutId],
    queryFn: async () => {
      const res = await api.get(`/results/tryout/${analyticsTryoutId}/leaderboard`);
      return res.data;
    },
    enabled: !!analyticsTryoutId && activeTab === 'analytics'
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/questions', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsCreatingQuestion(false);
      setQForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error creating question');
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/questions/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setQForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch (err) {
      alert('Failed to upload image. Please check format and try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createTryoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/tryouts', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
      setIsCreatingTryout(false);
      setTForm({ title: '', duration_minutes: 120 });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error creating tryout');
    }
  });

  const assignQuestionMutation = useMutation({
    mutationFn: async (params: { tId: number, qId: number, action: 'add' | 'remove' }) => {
      if (params.action === 'add') {
        await api.post(`/tryouts/${params.tId}/questions/${params.qId}`);
      } else {
        await api.delete(`/tryouts/${params.tId}/questions/${params.qId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tutor Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your question bank and tryout packages.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'questions' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('questions')}
        >
          <FileQuestion size={18} /> Question Bank
        </button>
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'tryouts' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('tryouts')}
        >
          <CheckCircle2 size={18} /> Tryout Packages
        </button>
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} /> Analytics View
        </button>
      </div>

      <Card>
        {activeTab === 'questions' && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                {isCreatingQuestion ? 'Create New Question' : 'Question Bank'}
              </h2>
              <Button size="sm" onClick={() => setIsCreatingQuestion(!isCreatingQuestion)} variant={isCreatingQuestion ? 'secondary' : 'primary'}>
                {isCreatingQuestion ? 'Cancel' : 'Create Question'}
              </Button>
            </CardHeader>
            <CardBody>
              {isCreatingQuestion ? (
                <div className="space-y-4 max-w-3xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={qForm.subject} onChange={(e) => setQForm({...qForm, subject: e.target.value})} placeholder="e.g. Mathematics" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <select className="w-full border border-slate-300 rounded p-2" value={qForm.difficulty} onChange={(e) => setQForm({...qForm, difficulty: e.target.value})}>
                      <option value="Easy">Easy</option><option value="Normal">Normal</option><option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                    <textarea className="w-full border border-slate-300 rounded p-2 h-24" value={qForm.question_text} onChange={(e) => setQForm({...qForm, question_text: e.target.value})} placeholder="Type the question here..." required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Image (Optional)</label>
                    <div className="flex gap-4 items-center">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={uploadingImage}>
                        <Upload size={14} className="mr-2" /> Upload Image
                      </Button>
                      {qForm.image_url && (
                        <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-3 py-1 rounded">
                          Image Uploaded 
                          <button onClick={() => setQForm({...qForm, image_url: ''})} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                        </div>
                      )}
                    </div>
                    {qForm.image_url && <img src={api.defaults.baseURL?.replace('/api/v1', '') + qForm.image_url} alt="Question" className="mt-2 h-32 object-contain" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Option A</label>
                      <input className="w-full border border-slate-300 rounded p-2" value={qForm.option_a} onChange={(e) => setQForm({...qForm, option_a: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Option B</label>
                      <input className="w-full border border-slate-300 rounded p-2" value={qForm.option_b} onChange={(e) => setQForm({...qForm, option_b: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Option C</label>
                      <input className="w-full border border-slate-300 rounded p-2" value={qForm.option_c} onChange={(e) => setQForm({...qForm, option_c: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Option D</label>
                      <input className="w-full border border-slate-300 rounded p-2" value={qForm.option_d} onChange={(e) => setQForm({...qForm, option_d: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer</label>
                    <select className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({...qForm, correct_answer: e.target.value})}>
                      <option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
                    <textarea className="w-full border border-slate-300 rounded p-2 h-20" value={qForm.explanation} onChange={(e) => setQForm({...qForm, explanation: e.target.value})} placeholder="Explain why the answer is correct..." />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <Button 
                      onClick={() => createQuestionMutation.mutate(qForm)} 
                      isLoading={createQuestionMutation.isPending}
                      disabled={!qForm.question_text || !qForm.option_a || !qForm.option_b || !qForm.option_c || !qForm.option_d}
                    >
                      Save Question
                    </Button>
                  </div>
                </div>
              ) : qLoading ? <div className="text-center py-8">Loading questions...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="p-4 font-medium rounded-tl-lg">Preview</th>
                        <th className="p-4 font-medium">Subject</th>
                        <th className="p-4 font-medium">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions?.length === 0 && (
                        <tr><td colSpan={3} className="p-8 text-center text-slate-500">No questions found.</td></tr>
                      )}
                      {questions?.map((q: any) => (
                        <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900 truncate max-w-xs">{q.question_text.substring(0, 50)}...</td>
                          <td className="p-4 text-slate-600">{q.subject || '-'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">{q.difficulty || 'Normal'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </>
        )}

        {activeTab === 'tryouts' && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                {isCreatingTryout ? 'Create Tryout Package' : 'Tryout Packages'}
              </h2>
              {managingQuestionsTryoutId ? (
                <Button size="sm" variant="secondary" onClick={() => setManagingQuestionsTryoutId(null)}>Back to Packages</Button>
              ) : (
                <Button size="sm" onClick={() => setIsCreatingTryout(!isCreatingTryout)} variant={isCreatingTryout ? 'secondary' : 'primary'}>
                  {isCreatingTryout ? 'Cancel' : 'Create Tryout'}
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {managingQuestionsTryoutId ? (
                <div>
                  <h3 className="text-md font-semibold text-slate-800 mb-4">
                    Manage Questions for Tryout: {tryouts?.find((t:any) => t.id === managingQuestionsTryoutId)?.title}
                  </h3>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-600">
                          <th className="p-4 font-medium">Included</th>
                          <th className="p-4 font-medium">Question Preview</th>
                          <th className="p-4 font-medium">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {questions?.map((q: any) => {
                          const tryoutData = tryouts?.find((t:any) => t.id === managingQuestionsTryoutId);
                          const isIncluded = tryoutData?.questions?.some((tQ:any) => tQ.id === q.id);
                          return (
                            <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <input 
                                  type="checkbox" 
                                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                  checked={isIncluded || false}
                                  onChange={(e) => assignQuestionMutation.mutate({ 
                                    tId: managingQuestionsTryoutId, 
                                    qId: q.id, 
                                    action: e.target.checked ? 'add' : 'remove' 
                                  })}
                                />
                              </td>
                              <td className="p-4 text-slate-900 truncate max-w-sm">{q.question_text.substring(0, 100)}...</td>
                              <td className="p-4 text-slate-500">{q.subject}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : isCreatingTryout ? (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tryout Title</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={tForm.title} onChange={(e) => setTForm({...tForm, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Minutes)</label>
                    <input type="number" className="w-full border border-slate-300 rounded p-2" value={tForm.duration_minutes} onChange={(e) => setTForm({...tForm, duration_minutes: parseInt(e.target.value)})} required />
                  </div>
                  <Button onClick={() => createTryoutMutation.mutate(tForm)} isLoading={createTryoutMutation.isPending} disabled={!tForm.title || !tForm.duration_minutes}>
                    Save Tryout Package
                  </Button>
                </div>
              ) : tLoading ? <div className="text-center py-8">Loading tryouts...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="p-4 font-medium rounded-tl-lg">Title</th>
                        <th className="p-4 font-medium">Duration</th>
                        <th className="p-4 font-medium">Questions Assigned</th>
                        <th className="p-4 font-medium rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tryouts?.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No tryouts packages found.</td></tr>
                      )}
                      {tryouts?.map((t: any) => (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900">{t.title}</td>
                          <td className="p-4 text-slate-600">{t.duration_minutes} min</td>
                          <td className="p-4 text-slate-600">{t.questions?.length || 0} questions</td>
                          <td className="p-4">
                            <Button size="sm" variant="secondary" onClick={() => setManagingQuestionsTryoutId(t.id)}>
                              Manage Questions
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <CardHeader className="flex justify-between items-center bg-slate-50 border-b">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <BarChart3 size={20} className="text-brand-600" />
                Student Performance Analytics
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">Select Tryout:</label>
                <select 
                  className="border border-slate-300 rounded-md p-2 text-sm max-w-xs"
                  value={analyticsTryoutId || ''}
                  onChange={(e) => setAnalyticsTryoutId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Choose Tryout --</option>
                  {tryouts?.map((t:any) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardBody>
              {!analyticsTryoutId ? (
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 size={48} className="mx-auto mb-4 text-slate-300" />
                  Please select a tryout package above to view performance metrics.
                </div>
              ) : aLoading ? (
                <div className="text-center py-8 text-slate-600">Loading performance data...</div>
              ) : analyticsData?.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No students have completed this tryout yet.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl">
                      <div className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-1">Total Submissions</div>
                      <div className="text-3xl font-bold text-slate-900">{analyticsData.length}</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                      <div className="text-green-600 text-sm font-semibold uppercase tracking-wider mb-1">Average Score</div>
                      <div className="text-3xl font-bold text-slate-900">
                        {Math.round(analyticsData.reduce((acc:any, curr:any) => acc + curr.score, 0) / analyticsData.length)}%
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                      <div className="text-amber-600 text-sm font-semibold uppercase tracking-wider mb-1">Highest Score</div>
                      <div className="text-3xl font-bold text-slate-900">
                        {Math.max(...analyticsData.map((d:any) => d.score))}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-semibold text-slate-800 mb-4">Score Distribution</h3>
                    <div className="space-y-4">
                      {analyticsData.sort((a:any, b:any) => b.score - a.score).map((result: any, index: number) => (
                        <div key={result.id} className="flex items-center gap-4">
                          <div className="w-8 text-right font-semibold text-slate-400">#{index+1}</div>
                          <div className="w-48 truncate text-sm font-medium text-slate-800">
                            {result.student?.name || 'Unknown Student'}
                          </div>
                          <div className="flex-1">
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                              <div 
                                className={`h-full transition-all duration-1000 ease-out ${
                                  result.score >= 80 ? 'bg-green-500' : 
                                  result.score >= 60 ? 'bg-brand-500' : 
                                  result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${result.score}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right font-bold text-slate-800">
                            {result.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </>
        )}
      </Card>
    </div>
  );
};
