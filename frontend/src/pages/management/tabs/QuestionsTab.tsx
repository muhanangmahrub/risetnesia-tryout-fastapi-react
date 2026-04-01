import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { MathRenderer } from '../../../components/ui/MathRenderer';
import { BookOpen, Edit2, Trash2, X, Eye, Plus, Upload, CheckCircle2 } from 'lucide-react';
import { resolveImageUrl } from '../../../utils/url';

const stripHtml = (html: string) => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\$([^$]+)\$\$/g, '[$1]')
    .replace(/\$([^$]+)\$/g, '[$1]')
    .replace(/\s+/g, ' ')
    .trim();
};

export const QuestionsTab = () => {
  const queryClient = useQueryClient();

  // Categories state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Questions state
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [detailQuestion, setDetailQuestion] = useState<any>(null);
  const [qForm, setQForm] = useState({
    question_type: 'MULTIPLE_CHOICE', question_text: '', 
    option_a: '', option_a_image: '',
    option_b: '', option_b_image: '',
    option_c: '', option_c_image: '',
    option_d: '', option_d_image: '',
    option_e: '', option_e_image: '',
    correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: '',
    category_ids: [] as number[]
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ['questions', selectedCategoryId],
    queryFn: async () => (await api.get('/questions', { params: { category_id: selectedCategoryId } })).data,
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/categories/', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingCategory(false);
      setCatForm({ name: '', description: '' });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating category')
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/categories/${editingCategory.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      setIsCreatingCategory(false);
      setCatForm({ name: '', description: '' });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error updating category')
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/categories/${id}`)).data,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (selectedCategoryId === id) setSelectedCategoryId(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error deleting category')
  });

  // Question Mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/questions/', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsCreatingQuestion(false);
      setQForm({ 
        question_type: 'MULTIPLE_CHOICE', question_text: '', 
        option_a: '', option_a_image: '',
        option_b: '', option_b_image: '',
        option_c: '', option_c_image: '',
        option_d: '', option_d_image: '',
        option_e: '', option_e_image: '',
        correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: '',
        category_ids: selectedCategoryId ? [selectedCategoryId] : [] 
      });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating question')
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/questions/${editingQuestion.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setEditingQuestion(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error updating question')
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/questions/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
    onError: (e: any) => alert(e.response?.data?.detail || 'Error deleting question')
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/questions/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setQForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch { 
      alert('Gagal upload gambar.'); 
    } finally {
      setUploadingImage(false);
      if (imgInputRef.current) imgInputRef.current.value = '';
    }
  };

  const handleOptionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, option: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/questions/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setQForm(prev => ({ ...prev, [`option_${option}_image`]: res.data.url }));
    } catch { 
      alert('Gagal upload gambar pilihan.'); 
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Kategori */}
        <div className="w-full md:w-64 border-r border-slate-100 p-4 bg-slate-50/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen size={16} className="text-brand-500" /> Folder Soal
            </h3>
            <button 
              onClick={() => setIsCreatingCategory(true)}
              className="p-1 hover:bg-brand-100 text-brand-600 rounded-full transition-colors"
              title="Tambah Kategori"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategoryId === null 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-200 font-semibold sticky top-0 z-10' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Soal
            </button>
            
            {catsLoading ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading...</div>
            ) : (
              categories?.map((cat: any) => (
                <div key={cat.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${
                      selectedCategoryId === cat.id 
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-200 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1">
                    <button onClick={() => { setEditingCategory(cat); setCatForm({ name: cat.name, description: cat.description || '' }); setIsCreatingCategory(true); }} className="p-1 text-slate-400 hover:text-brand-600" title="Ubah Nama"><Edit2 size={12} /></button>
                    <button onClick={() => { if(confirm('Hapus kategori ini? Soal tidak akan terhapus.')) deleteCategoryMutation.mutate(cat.id) }} className="p-1 text-slate-400 hover:text-red-500" title="Hapus"><X size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {isCreatingCategory && (
            <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <input 
                autoFocus
                className="w-full border border-slate-200 rounded px-2 py-1 text-sm mb-2"
                placeholder="Nama Folder..."
                value={catForm.name}
                onChange={e => setCatForm({...catForm, name: e.target.value})}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => editingCategory ? updateCategoryMutation.mutate({ id: (editingCategory as any).id, name: catForm.name, description: catForm.description }) : createCategoryMutation.mutate(catForm)}
                  disabled={!catForm.name}
                  isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {editingCategory ? 'Update' : 'Simpan'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setIsCreatingCategory(false); setEditingCategory(null); setCatForm({name: '', description: ''}); }}>Batal</Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <CardHeader className="flex justify-between items-center border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {selectedCategoryId 
                    ? categories?.find((c: any) => c.id === selectedCategoryId)?.name 
                    : 'Semua Soal'
                }
              </h2>
              <p className="text-xs text-slate-500">
                {`${questions?.length || 0} soal ditemukan`}
              </p>
            </div>
            <Button size="sm" onClick={() => {
              setIsCreatingQuestion(true);
              setEditingQuestion(null);
              setDetailQuestion(null);
              setQForm({
                question_type: 'MULTIPLE_CHOICE', question_text: '', 
                option_a: '', option_a_image: '',
                option_b: '', option_b_image: '',
                option_c: '', option_c_image: '',
                option_d: '', option_d_image: '',
                option_e: '', option_e_image: '',
                correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: '',
                category_ids: selectedCategoryId ? [selectedCategoryId] : []
              });
            }} variant="primary">
              <span className="flex items-center gap-2"><Plus size={16} /> Buat Soal</span>
            </Button>
          </CardHeader>
          
          <CardBody className="flex-1 bg-white p-0">
            {qLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-4"></div>
                <p>Memuat daftar soal...</p>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm">
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Isi Soal</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Folder</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Mata Pelajaran</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Kesulitan</th>
                      <th className="p-4 font-semibold uppercase tracking-wider text-xs">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center">
                          <div className="flex flex-col items-center text-slate-400">
                            <BookOpen size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium text-slate-500">Belum ada soal di folder ini</p>
                            <p className="text-sm">Klik "Buat Soal" untuk mulai menambahkan pertanyaan.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {questions?.map((q: any) => (
                      <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4 font-medium text-slate-700 max-w-[200px] md:max-w-xs">
                          <div className="truncate">{stripHtml(q.question_text)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {q.categories?.length > 0 ? q.categories.map((cat: any) => (
                              <span key={cat.id} className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded text-[10px] font-medium border border-brand-100">{cat.name}</span>
                            )) : <span className="text-slate-400 text-[10px] italic">Tanpa Folder</span>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs">{q.subject || 'Umum'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            q.difficulty === 'Hard' ? 'bg-red-50 text-red-600' : 
                            q.difficulty === 'Normal' ? 'bg-blue-50 text-blue-600' : 
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {q.difficulty || 'Normal'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button onClick={() => { setDetailQuestion(q); setEditingQuestion(null); setIsCreatingQuestion(false); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Detail"><Eye size={16} /></button>
                            <button onClick={() => { 
                              setEditingQuestion(q); 
                              setIsCreatingQuestion(false); 
                              setDetailQuestion(null); 
                              setQForm({ 
                                ...q, 
                                question_type: q.question_type || 'MULTIPLE_CHOICE',
                                category_ids: q.categories?.map((c: any) => c.id) || []
                              }); 
                            }} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => confirm('Hapus soal ini?') && deleteQuestionMutation.mutate(q.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Hapus"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </div>
      </div>

      {/* MODAL CREATE QUESTION */}
      {isCreatingQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-800">Buat Soal Baru</h3>
              <button onClick={() => setIsCreatingQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={qForm.subject} onChange={(e) => setQForm({ ...qForm, subject: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Folder / Kategori (Bisa Pilih Banyak)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-32 overflow-y-auto custom-scrollbar">
                      {categories?.map((cat: any) => (
                        <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-brand-600">
                          <input 
                            type="checkbox" 
                            checked={qForm.category_ids.includes(cat.id)}
                            onChange={(e) => {
                              const ids = e.target.checked 
                                ? [...qForm.category_ids, cat.id]
                                : qForm.category_ids.filter(id => id !== cat.id);
                              setQForm({ ...qForm, category_ids: ids });
                            }}
                            className="rounded text-brand-600 focus:ring-brand-500"
                          />
                          <span className="truncate">{cat.name}</span>
                        </label>
                      ))}
                      {categories?.length === 0 && <p className="text-xs text-slate-400 italic col-span-3">Belum ada folder.</p>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kesulitan</label>
                    <select className="w-full border border-slate-300 rounded p-2" value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}>
                      <option value="Easy">Mudah</option><option value="Normal">Normal</option><option value="Hard">Sulit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Soal</label>
                    <select className="w-full border border-slate-300 rounded p-2" value={qForm.question_type} onChange={(e) => setQForm({ ...qForm, question_type: e.target.value, correct_answer: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '' })}>
                      <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                      <option value="MULTIPLE_ANSWERS">Pilihan Ganda (Bisa Banyak Jawaban)</option>
                      <option value="TRUE_FALSE">Benar / Salah</option>
                      <option value="ESSAY">Isian Singkat</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teks Soal / Pokok Soal</label>
                  <RichTextEditor value={qForm.question_text} onChange={(val: string) => setQForm({ ...qForm, question_text: val })} placeholder="Tulis soal di sini..." />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Soal (Opsional)</label>
                  <div className="flex gap-4 items-center">
                    <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Button size="sm" variant="secondary" onClick={() => imgInputRef.current?.click()} isLoading={uploadingImage}><Upload size={14} className="mr-2" /> Upload Gambar</Button>
                    {qForm.image_url && (<div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-3 py-1 rounded">Gambar Terupload <button onClick={() => setQForm({ ...qForm, image_url: '' })} className="text-red-500 hover:text-red-700"><X size={14} /></button></div>)}
                  </div>
                  {qForm.image_url && <img src={resolveImageUrl(qForm.image_url)} alt="Soal" className="mt-2 h-32 object-contain rounded border" />}
                </div>
                
                {/* ---- MULTIPLE_CHOICE ---- */}
                {qForm.question_type === 'MULTIPLE_CHOICE' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {(['a', 'b', 'c', 'd', 'e'] as const).map(opt => (
                        <div key={opt} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Pilihan {opt.toUpperCase()}</label>
                          <input 
                            className="w-full border border-slate-300 rounded p-2 mb-2 bg-white" 
                            value={(qForm as any)[`option_${opt}`]} 
                            onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} 
                            placeholder={`Teks pilihan ${opt.toUpperCase()}...`}
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              id={`opt_img_${opt}`} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleOptionImageUpload(e, opt)} 
                            />
                            <button 
                              type="button"
                              onClick={() => document.getElementById(`opt_img_${opt}`)?.click()}
                              className="flex items-center gap-1 text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Upload size={12} /> {(qForm as any)[`option_${opt}_image`] ? 'Ganti Gambar' : 'Upload Gambar'}
                            </button>
                            {(qForm as any)[`option_${opt}_image`] && (
                              <button 
                                type="button"
                                onClick={() => setQForm({ ...qForm, [`option_${opt}_image`]: '' })}
                                className="text-red-500 hover:text-red-700 text-[10px] font-medium"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          {(qForm as any)[`option_${opt}_image`] && (
                            <img 
                              src={resolveImageUrl((qForm as any)[`option_${opt}_image` ] )} 
                              alt={`Pilihan ${opt}`} 
                              className="mt-2 h-20 object-contain rounded border bg-white" 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban</label>
                      <select className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })}>
                        <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option><option value="E">Pilihan E</option>
                      </select></div>
                  </>
                )}

                {/* ---- MULTIPLE_ANSWERS ---- */}
                {qForm.question_type === 'MULTIPLE_ANSWERS' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {(['a', 'b', 'c', 'd', 'e'] as const).map(opt => (
                        <div key={opt} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Pilihan {opt.toUpperCase()}</label>
                          <input 
                            className="w-full border border-slate-300 rounded p-2 mb-2 bg-white" 
                            value={(qForm as any)[`option_${opt}`]} 
                            onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} 
                            placeholder={`Teks pilihan ${opt.toUpperCase()}...`}
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              id={`opt_img_ma_${opt}`} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleOptionImageUpload(e, opt)} 
                            />
                            <button 
                              type="button"
                              onClick={() => document.getElementById(`opt_img_ma_${opt}`)?.click()}
                              className="flex items-center gap-1 text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Upload size={12} /> {(qForm as any)[`option_${opt}_image`] ? 'Ganti Gambar' : 'Upload Gambar'}
                            </button>
                            {(qForm as any)[`option_${opt}_image`] && (
                              <button 
                                type="button"
                                onClick={() => setQForm({ ...qForm, [`option_${opt}_image`]: '' })}
                                className="text-red-500 hover:text-red-700 text-[10px] font-medium"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          {(qForm as any)[`option_${opt}_image`] && (
                            <img 
                              src={resolveImageUrl((qForm as any)[`option_${opt}_image` ] )} 
                              alt={`Pilihan ${opt}`} 
                              className="mt-2 h-20 object-contain rounded border bg-white" 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pilih semua jawaban yang BENAR:</label>
                      <div className="flex gap-4 flex-wrap">
                        {(['A','B','C','D','E'] as const).map(opt => {
                          const selected = qForm.correct_answer.split(',').map(s=>s.trim()).filter(Boolean);
                          const isChecked = selected.includes(opt);
                          return (
                            <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                              <input type="checkbox" checked={isChecked} onChange={(e) => {
                                const cur = qForm.correct_answer.split(',').map(s=>s.trim()).filter(Boolean);
                                const next = e.target.checked ? [...cur, opt].sort() : cur.filter(x=>x!==opt);
                                setQForm({ ...qForm, correct_answer: next.join(',') });
                              }} className="rounded" />
                              <span className="font-bold">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* ---- TRUE_FALSE ---- */}
                {qForm.question_type === 'TRUE_FALSE' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pernyataan dan Jawaban (Benar/Salah):</label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-3 text-left text-slate-600 font-semibold">Pernyataan</th>
                            <th className="p-3 text-center text-slate-600 font-semibold w-24">BENAR</th>
                            <th className="p-3 text-center text-slate-600 font-semibold w-24">SALAH</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(['a','b','c','d','e'] as const).map((opt, idx) => {
                            const tfAnswers = qForm.correct_answer.split(',').map(s=>s.trim());
                            while(tfAnswers.length < 5) tfAnswers.push('');
                            const currentAnswer = tfAnswers[idx] || '';
                            return (
                              <tr key={opt} className="border-t border-slate-100">
                                <td className="p-2">
                                  <input className="w-full border border-slate-200 rounded p-2 text-sm" value={(qForm as any)[`option_${opt}`] || ''}
                                    onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })}
                                    placeholder={`Pernyataan ${idx+1}...`} />
                                </td>
                                <td className="p-2 text-center">
                                  <input type="radio" name={`tf_create_${opt}`} value="T" checked={currentAnswer === 'T'}
                                    onChange={() => { const a = qForm.correct_answer.split(',').map(s=>s.trim()); while(a.length<5)a.push(''); a[idx]='T'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
                                    className="w-5 h-5 accent-green-500" />
                                </td>
                                <td className="p-2 text-center">
                                  <input type="radio" name={`tf_create_${opt}`} value="F" checked={currentAnswer === 'F'}
                                    onChange={() => { const a = qForm.correct_answer.split(',').map(s=>s.trim()); while(a.length<5)a.push(''); a[idx]='F'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
                                    className="w-5 h-5 accent-red-500" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Kosongkan pernyataan yang tidak diperlukan. Hanya pernyataan yang diisi yang dihitung.</p>
                  </div>
                )}

                {/* ---- ESSAY ---- */}
                {qForm.question_type === 'ESSAY' && (
                  <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban (Isian Singkat)</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} placeholder="Ketik jawaban yang benar" /></div>
                )}
                
                <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Pembahasan <span className="text-slate-400 font-normal text-xs">(opsional — gunakan editor untuk format teks & rumus)</span></label>
                  <RichTextEditor value={qForm.explanation} onChange={(val: string) => setQForm({ ...qForm, explanation: val })} placeholder="Jelaskan mengapa jawaban ini benar..." minHeight="100px" /></div>
                <div className="pt-4 mt-6">
                  <Button onClick={() => createQuestionMutation.mutate(qForm)} isLoading={createQuestionMutation.isPending} disabled={!qForm.question_text || (qForm.question_type === 'MULTIPLE_CHOICE' && (!qForm.option_a || !qForm.option_b || !qForm.option_c || !qForm.option_d))}>Simpan Soal</Button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL QUESTION */}
      {detailQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Detail Soal</h3>
                  <p className="text-sm text-slate-500">{detailQuestion.subject} • {detailQuestion.difficulty}</p>
               </div>
              <button onClick={() => setDetailQuestion(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Pertanyaan:</h4>
                <MathRenderer html={detailQuestion.question_text} className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800" />
                {detailQuestion.image_url && <img src={resolveImageUrl(detailQuestion.image_url)} alt="Soal" className="mt-4 max-h-64 object-contain rounded-lg border" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['a', 'b', 'c', 'd', 'e'] as const).map(opt => (
                  <div key={opt} className={`p-4 rounded-lg border flex flex-col gap-3 ${detailQuestion.correct_answer === opt.toUpperCase() ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${detailQuestion.correct_answer === opt.toUpperCase() ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{opt.toUpperCase()}</span>
                      <p className="text-sm text-slate-700">{(detailQuestion as any)[`option_${opt}`]}</p>
                      {detailQuestion.correct_answer === opt.toUpperCase() && <CheckCircle2 size={16} className="text-green-600 ml-auto" />}
                    </div>
                    {(detailQuestion as any)[`option_${opt}_image`] && (
                      <img 
                        src={resolveImageUrl((detailQuestion as any)[`option_${opt}_image` ] )} 
                        alt={`Gambar Pilihan ${opt.toUpperCase()}`} 
                        className="max-h-32 object-contain rounded border self-start bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Pembahasan:</h4>
                <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                  {detailQuestion.explanation
                    ? <MathRenderer html={detailQuestion.explanation} className="text-sm text-slate-600 italic" />
                    : <p className="text-sm text-slate-400 italic">Tidak ada pembahasan.</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Edit Soal</h3>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                  <input className="w-full border border-slate-300 rounded p-2" value={qForm.subject} onChange={(e) => setQForm({ ...qForm, subject: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Folder / Kategori (Bisa Pilih Banyak)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-32 overflow-y-auto custom-scrollbar">
                    {categories?.map((cat: any) => (
                      <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-brand-600">
                        <input 
                          type="checkbox" 
                          checked={qForm.category_ids?.includes(cat.id)}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...(qForm.category_ids || []), cat.id]
                              : (qForm.category_ids || []).filter((id: number) => id !== cat.id);
                            setQForm({ ...qForm, category_ids: ids });
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kesulitan</label>
                  <select className="w-full border border-slate-300 rounded p-2" value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}>
                    <option value="Easy">Mudah</option><option value="Normal">Normal</option><option value="Hard">Sulit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Soal</label>
                  <select className="w-full border border-slate-300 rounded p-2" disabled value={qForm.question_type}>
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                    <option value="MULTIPLE_ANSWERS">Pilihan Ganda (Bisa Banyak Jawaban)</option>
                    <option value="TRUE_FALSE">Benar / Salah</option>
                    <option value="ESSAY">Isian Singkat</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Teks Soal</label>
                <RichTextEditor value={qForm.question_text} onChange={(val: string) => setQForm({ ...qForm, question_text: val })} placeholder="Tulis soal di sini..." />
              </div>

              {/* Edit opsinya */}
              {qForm.question_type === 'MULTIPLE_CHOICE' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {(['a', 'b', 'c', 'd', 'e'] as const).map(opt => (
                        <div key={opt} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Pilihan {opt.toUpperCase()}</label>
                          <input 
                            className="w-full border border-slate-300 rounded p-2 mb-2 bg-white" 
                            value={(qForm as any)[`option_${opt}`]} 
                            onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} 
                            placeholder={`Teks pilihan ${opt.toUpperCase()}...`}
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              id={`opt_img_edit_${opt}`} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleOptionImageUpload(e, opt)} 
                            />
                            <button 
                              type="button"
                              onClick={() => document.getElementById(`opt_img_edit_${opt}`)?.click()}
                              className="flex items-center gap-1 text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Upload size={12} /> {(qForm as any)[`option_${opt}_image`] ? 'Ganti Gambar' : 'Upload Gambar'}
                            </button>
                            {(qForm as any)[`option_${opt}_image`] && (
                              <button 
                                type="button"
                                onClick={() => setQForm({ ...qForm, [`option_${opt}_image`]: '' })}
                                className="text-red-500 hover:text-red-700 text-[10px] font-medium"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          {(qForm as any)[`option_${opt}_image`] && (
                            <img 
                              src={resolveImageUrl((qForm as any)[`option_${opt}_image` ] )} 
                              alt={`Pilihan ${opt}`} 
                              className="mt-2 h-20 object-contain rounded border bg-white" 
                            />
                          )}
                        </div>
                    ))}
                  </div>
                  <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban</label>
                    <select className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })}>
                      <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option><option value="E">Pilihan E</option>
                    </select></div>
                </>
              )}
              {qForm.question_type === 'MULTIPLE_ANSWERS' && (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                     {(['a', 'b', 'c', 'd', 'e'] as const).map(opt => (
                        <div key={opt} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Pilihan {opt.toUpperCase()}</label>
                          <input 
                            className="w-full border border-slate-300 rounded p-2 mb-2 bg-white" 
                            value={(qForm as any)[`option_${opt}`]} 
                            onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} 
                            placeholder={`Teks pilihan ${opt.toUpperCase()}...`}
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              id={`opt_img_edit_ma_${opt}`} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleOptionImageUpload(e, opt)} 
                            />
                            <button 
                              type="button"
                              onClick={() => document.getElementById(`opt_img_edit_ma_${opt}`)?.click()}
                              className="flex items-center gap-1 text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Upload size={12} /> {(qForm as any)[`option_${opt}_image`] ? 'Ganti Gambar' : 'Upload Gambar'}
                            </button>
                            {(qForm as any)[`option_${opt}_image`] && (
                              <button 
                                type="button"
                                onClick={() => setQForm({ ...qForm, [`option_${opt}_image`]: '' })}
                                className="text-red-500 hover:text-red-700 text-[10px] font-medium"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          {(qForm as any)[`option_${opt}_image`] && (
                            <img 
                              src={resolveImageUrl((qForm as any)[`option_${opt}_image` ] )} 
                              alt={`Pilihan ${opt}`} 
                              className="mt-2 h-20 object-contain rounded border bg-white" 
                            />
                          )}
                        </div>
                     ))}
                   </div>
                   <div className="mt-4">
                     <label className="block text-sm font-medium text-slate-700 mb-2">Pilih semua jawaban yang BENAR:</label>
                     <div className="flex gap-4 flex-wrap">
                       {(['A','B','C','D','E'] as const).map(opt => {
                         const selected = typeof qForm.correct_answer === 'string' ? qForm.correct_answer.split(',').map(s=>s.trim()).filter(Boolean) : [];
                         const isChecked = selected.includes(opt);
                         return (
                           <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                             <input type="checkbox" checked={isChecked} onChange={(e) => {
                               const cur = selected;
                               const next = e.target.checked ? [...cur, opt].sort() : cur.filter(x=>x!==opt);
                               setQForm({ ...qForm, correct_answer: next.join(',') });
                             }} className="rounded" />
                             <span className="font-bold">{opt}</span>
                           </label>
                         );
                       })}
                     </div>
                   </div>
                 </>
              )}
              {qForm.question_type === 'TRUE_FALSE' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pernyataan dan Jawaban (Benar/Salah):</label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-3 text-left text-slate-600 font-semibold">Pernyataan</th>
                            <th className="p-3 text-center text-slate-600 font-semibold w-24">BENAR</th>
                            <th className="p-3 text-center text-slate-600 font-semibold w-24">SALAH</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(['a','b','c','d','e'] as const).map((opt, idx) => {
                            const tfAnswers = typeof qForm.correct_answer === 'string' ? qForm.correct_answer.split(',').map(s=>s.trim()) : [];
                            while(tfAnswers.length < 5) tfAnswers.push('');
                            const currentAnswer = tfAnswers[idx] || '';
                            return (
                              <tr key={opt} className="border-t border-slate-100">
                                <td className="p-2">
                                  <input className="w-full border border-slate-200 rounded p-2 text-sm" value={(qForm as any)[`option_${opt}`] || ''}
                                    onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })}
                                    placeholder={`Pernyataan ${idx+1}...`} />
                                </td>
                                <td className="p-2 text-center">
                                  <input type="radio" name={`tf_edit_${opt}`} value="T" checked={currentAnswer === 'T'}
                                    onChange={() => { const a = [...tfAnswers]; a[idx]='T'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
                                    className="w-5 h-5 accent-green-500" />
                                </td>
                                <td className="p-2 text-center">
                                  <input type="radio" name={`tf_edit_${opt}`} value="F" checked={currentAnswer === 'F'}
                                    onChange={() => { const a = [...tfAnswers]; a[idx]='F'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
                                    className="w-5 h-5 accent-red-500" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {qForm.question_type === 'ESSAY' && (
                  <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban (Isian Singkat)</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} placeholder="Ketik jawaban yang benar" /></div>
                )}

              <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Pembahasan</label>
                <RichTextEditor value={qForm.explanation} onChange={(val: string) => setQForm({ ...qForm, explanation: val })} placeholder="Jelaskan mengapa jawaban ini benar..." minHeight="100px" /></div>

              <div className="pt-4 mt-6">
                 <Button onClick={() => updateQuestionMutation.mutate(qForm)} isLoading={updateQuestionMutation.isPending}>Simpan Perubahan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
