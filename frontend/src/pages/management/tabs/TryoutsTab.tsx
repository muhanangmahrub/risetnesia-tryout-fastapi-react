import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Edit2, Trash2, Eye, X } from 'lucide-react';

const stripHtml = (html: string) => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\$([^$]+)\$\$/g, '[$1]')
    .replace(/\$([^$]+)\$/g, '[$1]')
    .replace(/\s+/g, ' ')
    .trim();
};

export const TryoutsTab = () => {
  const queryClient = useQueryClient();

  const [isCreatingTryout, setIsCreatingTryout] = useState(false);
  const [editingTryout, setEditingTryout] = useState<any>(null);
  const [detailTryout, setDetailTryout] = useState<any>(null);
  const [tForm, setTForm] = useState({ title: '', duration_minutes: 120 });
  const [managingQuestionsTryoutId, setManagingQuestionsTryoutId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [qSearch, setQSearch] = useState('');
  const [qSubject, setQSubject] = useState('');
  const [qDifficulty, setQDifficulty] = useState('');

  const { data: tryouts, isLoading: tryoutsLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: async () => (await api.get('/tryouts')).data,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ['questions', selectedCategoryId],
    queryFn: async () => (await api.get('/questions', { params: { category_id: selectedCategoryId } })).data,
  });

  const createTryoutMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/tryouts', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
      setIsCreatingTryout(false);
      setTForm({ title: '', duration_minutes: 120 });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating tryout')
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/tryouts/${editingTryout.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
      setEditingTryout(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error updating tryout')
  });

  const deleteTryoutMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/tryouts/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tryouts'] }),
    onError: (e: any) => alert(e.response?.data?.detail || 'Error deleting tryout')
  });

  const assignQuestionMutation = useMutation({
    mutationFn: async (params: { tId: number; qId: number; action: 'add' | 'remove' }) => {
      if (params.action === 'add') await api.post(`/tryouts/${params.tId}/questions/${params.qId}`);
      else await api.delete(`/tryouts/${params.tId}/questions/${params.qId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tryouts'] })
  });
  
  const bulkAssignMutation = useMutation({
    mutationFn: async (params: { tId: number; qIds: number[]; action: 'add' | 'remove' }) => {
      await api.post(`/tryouts/${params.tId}/questions/bulk`, {
        question_ids: params.qIds,
        action: params.action
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tryouts'] })
  });
  
  const subjects = Array.from(new Set(questions?.map((q: any) => q.subject).filter(Boolean) || [])) as string[];

  const filteredQuestions = questions?.filter((q: any) => {
    const matchesSearch = !qSearch || stripHtml(q.question_text).toLowerCase().includes(qSearch.toLowerCase()) || (q.subject && q.subject.toLowerCase().includes(qSearch.toLowerCase()));
    const matchesSubject = !qSubject || q.subject === qSubject;
    const matchesDifficulty = !qDifficulty || q.difficulty === qDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  return (
    <>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">{managingQuestionsTryoutId ? 'Kelola Soal Tryout' : isCreatingTryout ? 'Buat Paket Tryout' : 'Paket Tryout'}</h2>
        {managingQuestionsTryoutId ? (
          <Button size="sm" variant="secondary" onClick={() => setManagingQuestionsTryoutId(null)}>← Kembali</Button>
        ) : (
          <Button size="sm" onClick={() => setIsCreatingTryout(!isCreatingTryout)} variant={isCreatingTryout ? 'secondary' : 'primary'}>{isCreatingTryout ? 'Batal' : 'Buat Tryout'}</Button>
        )}
      </CardHeader>
      <CardBody>
        {managingQuestionsTryoutId ? (
          <div>
            <div className="flex flex-col lg:flex-row items-center gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 whitespace-nowrap">
                    {tryouts?.find((t: any) => t.id === managingQuestionsTryoutId)?.title}
                  </h3>
                  <span className="bg-brand-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-brand-200 whitespace-nowrap">
                    {tryouts?.find((t: any) => t.id === managingQuestionsTryoutId)?.questions?.length || 0} Soal Terpilih
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* SEARCH */}
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Cari soal/mapel..." 
                    className="w-full pl-7 pr-2 h-8 text-[11px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none bg-white font-medium"
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                  />
                  <Eye size={12} className="absolute left-2 top-2.5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
                </div>

                {/* FOLDER */}
                <div className="bg-white border border-slate-200 rounded-lg px-2 h-8 flex items-center">
                  <select 
                    className="text-[11px] font-medium text-slate-600 bg-transparent focus:outline-none w-full"
                    value={selectedCategoryId || ''} 
                    onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">📁 Semua Folder</option>
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* MAPEL */}
                <div className="bg-white border border-slate-200 rounded-lg px-2 h-8 flex items-center">
                  <select 
                    className="text-[11px] font-medium text-slate-600 bg-transparent focus:outline-none w-full"
                    value={qSubject} 
                    onChange={(e) => setQSubject(e.target.value)}
                  >
                    <option value="">📚 Semua Mapel</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* KESULITAN */}
                <div className="bg-white border border-slate-200 rounded-lg px-2 h-8 flex items-center">
                  <select 
                    className="text-[11px] font-medium text-slate-600 bg-transparent focus:outline-none w-full"
                    value={qDifficulty} 
                    onChange={(e) => setQDifficulty(e.target.value)}
                  >
                    <option value="">⚡ Semua Level</option>
                    <option value="Easy">Mudah</option>
                    <option value="Normal">Normal</option>
                    <option value="Hard">Sulit</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto border border-slate-100 rounded-xl bg-white shadow-sm custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="border-b bg-slate-50/80 text-slate-500">
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px] w-16">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          checked={filteredQuestions?.length > 0 && filteredQuestions.every((q: any) => tryouts?.find((t: any) => t.id === managingQuestionsTryoutId)?.questions?.some((tQ: any) => tQ.id === q.id))}
                          onChange={(e) => {
                            const tId = managingQuestionsTryoutId!;
                            const qIds = filteredQuestions?.map((q: any) => q.id) || [];
                            bulkAssignMutation.mutate({ tId, qIds, action: e.target.checked ? 'add' : 'remove' });
                          }}
                        />
                        <span className="text-[8px] whitespace-nowrap">Semua</span>
                      </div>
                    </th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Isi Soal</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Mata Pelajaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {qLoading ? (
                    <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">Memuat soal...</td></tr>
                  ) : (filteredQuestions?.length || 0) === 0 ? (
                    <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">Tidak ada soal ditemukan.</td></tr>
                  ) : (
                    filteredQuestions?.map((q: any) => {
                      const tryoutData = tryouts?.find((t: any) => t.id === managingQuestionsTryoutId);
                      const isIncluded = tryoutData?.questions?.some((tQ: any) => tQ.id === q.id);
                      return (
                        <tr key={q.id} className={`hover:bg-slate-50/80 transition-colors group ${isIncluded ? 'bg-brand-50/30' : ''}`}>
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" 
                              checked={isIncluded || false} 
                              onChange={(e) => assignQuestionMutation.mutate({ tId: managingQuestionsTryoutId, qId: q.id, action: e.target.checked ? 'add' : 'remove' })} 
                            />
                          </td>
                          <td className="p-4 text-slate-700 font-medium">
                            <div className="truncate max-w-xl group-hover:text-brand-700">{stripHtml(q.question_text)}</div>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] uppercase font-bold">{q.subject || 'Umum'}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : isCreatingTryout ? (
          <div className="space-y-4 max-w-xl">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Judul Tryout</label>
              <input className="w-full border border-slate-300 rounded p-2" value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Durasi (Menit)</label>
              <input type="number" className="w-full border border-slate-300 rounded p-2" value={tForm.duration_minutes} onChange={(e) => setTForm({ ...tForm, duration_minutes: parseInt(e.target.value) })} required /></div>
            <Button onClick={() => createTryoutMutation.mutate(tForm)} isLoading={createTryoutMutation.isPending} disabled={!tForm.title || !tForm.duration_minutes}>Simpan Paket Tryout</Button>
          </div>
        ) : tryoutsLoading ? <div className="text-center py-8">Memuat tryout...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-600"><th className="p-4 font-medium">Judul</th><th className="p-4 font-medium">Durasi</th><th className="p-4 font-medium">Soal</th><th className="p-4 font-medium">Aksi</th></tr></thead>
              <tbody>
                {tryouts?.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada paket tryout.</td></tr>}
                {tryouts?.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{t.title}</td>
                    <td className="p-4 text-slate-600">{t.duration_minutes} menit</td>
                    <td className="p-4 text-slate-600">{t.questions?.length || 0} soal</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => setDetailTryout(t)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Detail"><Eye size={16} /></button>
                        <Button size="sm" variant="secondary" onClick={() => setManagingQuestionsTryoutId(t.id)}>Kelola Soal</Button>
                        <button onClick={() => { setEditingTryout(t); setTForm({ title: t.title, duration_minutes: t.duration_minutes }); }} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => confirm('Hapus tryout ini?') && deleteTryoutMutation.mutate(t.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>

      {/* MODAL EDIT TRYOUT */}
      {editingTryout && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Edit Paket Tryout</h3>
              <button onClick={() => setEditingTryout(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Judul Tryout</label>
                <input className="w-full border border-slate-300 rounded px-3 py-2" value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Durasi (Menit)</label>
                <input type="number" className="w-full border border-slate-300 rounded px-3 py-2" value={tForm.duration_minutes} onChange={(e) => setTForm({ ...tForm, duration_minutes: parseInt(e.target.value) })} required /></div>
              <Button className="w-full" isLoading={updateTryoutMutation.isPending} onClick={() => updateTryoutMutation.mutate(tForm)}>Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL TRYOUT */}
      {detailTryout && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Detail Paket: {detailTryout.title}</h3>
                  <p className="text-sm text-slate-500">{detailTryout.duration_minutes} Menit • {detailTryout.questions?.length || 0} Soal</p>
               </div>
              <button onClick={() => setDetailTryout(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            {detailTryout.questions?.length > 0 ? (
                <ul className="space-y-3">
                  {detailTryout.questions.map((q: any, i: number) => (
                    <li key={q.id} className="p-3 bg-slate-50 rounded-lg text-sm border flex gap-3">
                      <span className="font-bold text-brand-600">{i+1}.</span>
                      <div className="flex-1">{stripHtml(q.question_text)}</div>
                      <span className="text-xs bg-slate-200 text-slate-600 h-fit px-2 py-0.5 rounded uppercase font-bold">{q.difficulty || 'Normal'}</span>
                    </li>
                  ))}
                </ul>
            ) : <p className="text-slate-400 italic text-center py-6">Belum ada soal dimasukkan ke paket ini.</p>}
          </div>
        </div>
      )}
    </>
  );
};
