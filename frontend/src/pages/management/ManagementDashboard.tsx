import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { api } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, BookOpen, Upload, Plus, Calendar, Download, X, FileQuestion, CheckCircle2, BarChart3, Edit2, Trash2, Eye, AlertCircle } from 'lucide-react';

const correctUTC = (dateStr: string | null) => {
  if (!dateStr) return null;
  if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) return new Date(dateStr);
  return new Date(dateStr + 'Z');
};

const formatDateID = (date: Date | null | undefined) => {
  if (!date) return 'Belum diatur';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dayName}, ${dd}-${mm}-${yyyy}, ${hh}:${min}`;
};

const toLocalISO = (dateStr: string | null) => {
  const date = correctUTC(dateStr);
  if (!date) return '';
  const offset = date.getTimezoneOffset() * 60000; // minutes to ms
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const ManagementDashboard = ({ user }: { user: any }) => {
  const isAdmin = user?.role === 'admin';
  type Tab = 'users' | 'classes' | 'scheduling' | 'questions' | 'tryouts' | 'analytics';
  const [activeTab, setActiveTab] = useState<Tab>('questions');

  // Users state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [uForm, setUForm] = useState({ name: '', email: '', password: '', role: 'student' });

  // Classes state
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [cForm, setCForm] = useState({ name: '' });
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [newStudentId, setNewStudentId] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Tryout scheduling state
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editClassId, setEditClassId] = useState<number | null>(null);

  // Questions state
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [detailQuestion, setDetailQuestion] = useState<any>(null);
  const [qForm, setQForm] = useState({
    question_type: 'MULTIPLE_CHOICE', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: '',
    category_id: null as number | null
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Tryout packages state
  const [isCreatingTryout, setIsCreatingTryout] = useState(false);
  const [editingTryout, setEditingTryout] = useState<any>(null);
  const [detailTryout, setDetailTryout] = useState<any>(null);
  const [tForm, setTForm] = useState({ title: '', duration_minutes: 120 });
  const [managingQuestionsTryoutId, setManagingQuestionsTryoutId] = useState<number | null>(null);

  // Analytics state
  const [analyticsTryoutId, setAnalyticsTryoutId] = useState<number | null>(null);

  // Categories state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const queryClient = useQueryClient();

  // === DATA QUERIES ===
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: activeTab === 'users' || activeTab === 'classes'
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data,
    enabled: activeTab === 'classes' || activeTab === 'scheduling'
  });

  const { data: classStudents, isLoading: classStudentsLoading } = useQuery({
    queryKey: ['classStudents', selectedClassId],
    queryFn: async () => (await api.get(`/classes/${selectedClassId}/students`)).data,
    enabled: !!selectedClassId
  });

  const { data: tryouts, isLoading: tryoutsLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: async () => (await api.get('/tryouts')).data,
    enabled: activeTab === 'scheduling' || activeTab === 'tryouts' || activeTab === 'analytics'
  });

  const { data: analyticsData, isLoading: aLoading } = useQuery({
    queryKey: ['analytics', analyticsTryoutId],
    queryFn: async () => (await api.get(`/results/tryout/${analyticsTryoutId}/leaderboard`)).data,
    enabled: !!analyticsTryoutId && activeTab === 'analytics'
  });

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
    enabled: activeTab === 'questions' || activeTab === 'tryouts'
  });

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ['questions', selectedCategoryId],
    queryFn: async () => (await api.get('/questions', { params: { category_id: selectedCategoryId } })).data,
    enabled: activeTab === 'questions' || activeTab === 'tryouts'
  });

  // === MUTATIONS ===
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/users/', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreatingUser(false);
      setUForm({ name: '', email: '', password: '', role: 'student' });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating user')
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/users/${editingUser.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error updating user')
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (e: any) => alert(e.response?.data?.detail || 'Error deleting user')
  });

  const uploadCSVMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post('/users/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: (data) => {
      alert(`Import berhasil! Dibuat: ${data.created}, Dilewati: ${data.skipped}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (csvInputRef.current) csvInputRef.current.value = '';
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error uploading CSV')
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/classes/', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreatingClass(false);
      setCForm({ name: '' });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating class')
  });

  const updateClassMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/classes/${editingClass.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditingClass(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error updating class')
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/classes/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
    onError: (e: any) => alert(e.response?.data?.detail || 'Error deleting class')
  });

  const enrollMutation = useMutation({
    mutationFn: async (studentId: string) => (await api.post(`/classes/${selectedClassId}/enroll/${studentId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClassId] });
      setNewStudentId('');
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error enrolling student')
  });

  const unenrollMutation = useMutation({
    mutationFn: async (studentId: number) => (await api.delete(`/classes/${selectedClassId}/unenroll/${studentId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClassId] }),
    onError: (e: any) => alert(e.response?.data?.detail || 'Error unenrolling student')
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (params: { id: number; start: string; end: string; classId: number | null }) =>
      (await api.put(`/tryouts/${params.id}`, {
        start_time: params.start ? new Date(params.start).toISOString() : null,
        end_time: params.end ? new Date(params.end).toISOString() : null,
        class_id: params.classId ?? null,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
      setEditingScheduleId(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error updating schedule')
  });

  const handleExportExcel = async (tryoutId: number) => {
    try {
      const response = await api.get(`/results/export/${tryoutId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tryout_${tryoutId}_results.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      alert('Error downloading excel. Pastikan ada hasil ujian yang tersedia.');
    }
  };

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/questions', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsCreatingQuestion(false);
      setQForm({ 
        question_type: 'MULTIPLE_CHOICE', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', 
        correct_answer: 'A', explanation: '', subject: '', difficulty: 'Normal', image_url: '',
        category_id: selectedCategoryId 
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/questions/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setQForm(prev => ({ ...prev, image_url: res.data.url }));
    } catch { alert('Gagal upload gambar.'); }
    finally {
      setUploadingImage(false);
      if (imgInputRef.current) imgInputRef.current.value = '';
    }
  };

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

  const tabClass = (tab: Tab) =>
    `pb-4 px-2 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Kelola semua fitur platform tryout dari sini.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        <button className={tabClass('questions')} onClick={() => setActiveTab('questions')}><FileQuestion size={18} /> Bank Soal</button>
        <button className={tabClass('tryouts')} onClick={() => setActiveTab('tryouts')}><CheckCircle2 size={18} /> Paket Tryout</button>
        <button className={tabClass('analytics')} onClick={() => setActiveTab('analytics')}><BarChart3 size={18} /> Analitik</button>
        {isAdmin && <button className={tabClass('scheduling')} onClick={() => setActiveTab('scheduling')}><Calendar size={18} /> Penjadwalan</button>}
        {isAdmin && <button className={tabClass('classes')} onClick={() => setActiveTab('classes')}><BookOpen size={18} /> Kelas</button>}
        {isAdmin && <button className={tabClass('users')} onClick={() => setActiveTab('users')}><Users size={18} /> Pengguna</button>}
      </div>

      <Card>
        {/* ===== BANK SOAL ===== */}
        {activeTab === 'questions' && (
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

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCategoryId === null 
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-200 font-semibold' 
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
                        <button onClick={() => { setEditingCategory(cat); setCatForm({ name: cat.name, description: cat.description || '' }); }} className="p-1 text-slate-400 hover:text-brand-600" title="Ubah Nama"><Edit2 size={12} /></button>
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
                    {isCreatingQuestion ? 'Buat Soal Baru' : 
                      selectedCategoryId 
                        ? categories?.find((c: any) => c.id === selectedCategoryId)?.name 
                        : 'Semua Soal'
                    }
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isCreatingQuestion ? 'Isi detail soal di bawah ini.' : `${questions?.length || 0} soal ditemukan`}
                  </p>
                </div>
                <Button size="sm" onClick={() => {
                  setIsCreatingQuestion(!isCreatingQuestion);
                  if(!isCreatingQuestion) setQForm({...qForm, category_id: selectedCategoryId});
                }} variant={isCreatingQuestion ? 'secondary' : 'primary'}>
                  {isCreatingQuestion ? 'Batal' : (
                    <span className="flex items-center gap-2"><Plus size={16} /> Buat Soal</span>
                  )}
                </Button>
              </CardHeader>
              
              <CardBody className="flex-1 bg-white">
                {isCreatingQuestion ? (
                  <div className="space-y-4 max-w-3xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                        <input className="w-full border border-slate-300 rounded p-2" value={qForm.subject} onChange={(e) => setQForm({ ...qForm, subject: e.target.value })} placeholder="cth. Matematika" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Folder / Kategori</label>
                        <select 
                          className="w-full border border-slate-300 rounded p-2" 
                          value={qForm.category_id || ''} 
                          onChange={(e) => setQForm({ ...qForm, category_id: e.target.value ? parseInt(e.target.value) : null })}
                        >
                          <option value="">Tanpa Folder</option>
                          {categories?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
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
                        <select className="w-full border border-slate-300 rounded p-2" value={qForm.question_type} onChange={(e) => setQForm({ ...qForm, question_type: e.target.value, correct_answer: '', option_a: '', option_b: '', option_c: '', option_d: '' })}>
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
                      {qForm.image_url && <img src={api.defaults.baseURL?.replace('/api/v1', '') + qForm.image_url} alt="Soal" className="mt-2 h-32 object-contain rounded border" />}
                    </div>
                    
                    {/* ---- MULTIPLE_CHOICE ---- */}
                    {qForm.question_type === 'MULTIPLE_CHOICE' && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {(['a', 'b', 'c', 'd'] as const).map(opt => (
                            <div key={opt}><label className="block text-sm font-medium text-slate-700 mb-1">Pilihan {opt.toUpperCase()}</label>
                              <input className="w-full border border-slate-300 rounded p-2" value={(qForm as any)[`option_${opt}`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} /></div>
                          ))}
                        </div>
                        <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban</label>
                          <select className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })}>
                            <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option>
                          </select></div>
                      </>
                    )}

                    {/* ---- MULTIPLE_ANSWERS ---- */}
                    {qForm.question_type === 'MULTIPLE_ANSWERS' && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {(['a', 'b', 'c', 'd'] as const).map(opt => (
                            <div key={opt}><label className="block text-sm font-medium text-slate-700 mb-1">Pilihan {opt.toUpperCase()}</label>
                              <input className="w-full border border-slate-300 rounded p-2" value={(qForm as any)[`option_${opt}`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} /></div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Pilih semua jawaban yang BENAR:</label>
                          <div className="flex gap-4 flex-wrap">
                            {(['A','B','C','D'] as const).map(opt => {
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
                              {(['a','b','c','d'] as const).map((opt, idx) => {
                                const tfAnswers = qForm.correct_answer.split(',').map(s=>s.trim());
                                while(tfAnswers.length < 4) tfAnswers.push('');
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
                                        onChange={() => { const a = qForm.correct_answer.split(',').map(s=>s.trim()); while(a.length<4)a.push(''); a[idx]='T'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
                                        className="w-5 h-5 accent-green-500" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="radio" name={`tf_create_${opt}`} value="F" checked={currentAnswer === 'F'}
                                        onChange={() => { const a = qForm.correct_answer.split(',').map(s=>s.trim()); while(a.length<4)a.push(''); a[idx]='F'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
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
                    
                    <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Pembahasan</label>
                      <textarea className="w-full border border-slate-300 rounded p-2 h-20" value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} placeholder="Jelaskan mengapa jawaban ini benar..." /></div>
                    <div className="pt-4 border-t border-slate-100">
                      <Button onClick={() => createQuestionMutation.mutate(qForm)} isLoading={createQuestionMutation.isPending} disabled={!qForm.question_text || (qForm.question_type === 'MULTIPLE_CHOICE' && (!qForm.option_a || !qForm.option_b || !qForm.option_c || !qForm.option_d))}>Simpan Soal</Button>
                    </div>
                  </div>
                ) : qLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-4"></div>
                    <p>Memuat daftar soal...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                          <th className="p-4 font-semibold uppercase tracking-wider text-xs">Isi Soal</th>
                          <th className="p-4 font-semibold uppercase tracking-wider text-xs">Mata Pelajaran</th>
                          <th className="p-4 font-semibold uppercase tracking-wider text-xs">Kesulitan</th>
                          <th className="p-4 font-semibold uppercase tracking-wider text-xs">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions?.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-20 text-center">
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
                            <td className="p-4 font-medium text-slate-700 max-w-md">
                              <div className="truncate">{q.question_text}</div>
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
                                <button onClick={() => setDetailQuestion(q)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Detail"><Eye size={16} /></button>
                                <button onClick={() => { setEditingQuestion(q); setQForm({ ...q, question_type: q.question_type || 'MULTIPLE_CHOICE' }); }} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
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
        )}

        {/* ===== PAKET TRYOUT ===== */}
        {activeTab === 'tryouts' && (
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <h3 className="text-md font-bold text-slate-800">
                        {tryouts?.find((t: any) => t.id === managingQuestionsTryoutId)?.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <BookOpen size={12} /> Pilih soal dari folder di sebelah kanan untuk ditambahkan ke paket.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Folder:</label>
                      <select 
                        className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none min-w-[150px]"
                        value={selectedCategoryId || ''} 
                        onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Semua Folder</option>
                        {categories?.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50/50 text-slate-500">
                          <th className="p-4 font-semibold uppercase tracking-wider text-[10px] w-16">Pilih</th>
                          <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Isi Soal</th>
                          <th className="p-4 font-semibold uppercase tracking-wider text-[10px]">Mata Pelajaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {qLoading ? (
                          <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">Memuat soal...</td></tr>
                        ) : (questions?.length || 0) === 0 ? (
                          <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">Tidak ada soal ditemukan.</td></tr>
                        ) : (
                          questions?.map((q: any) => {
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
                                  <div className="truncate max-w-xl group-hover:text-brand-700">{q.question_text}</div>
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
          </>
        )}

        {/* ===== ANALITIK ===== */}
        {activeTab === 'analytics' && (
          <>
            <CardHeader className="flex justify-between items-center bg-slate-50 border-b">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><BarChart3 size={20} className="text-brand-600" /> Analitik Performa Siswa</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">Pilih Tryout:</label>
                <select className="border border-slate-300 rounded-md p-2 text-sm max-w-xs" value={analyticsTryoutId || ''} onChange={(e) => setAnalyticsTryoutId(e.target.value ? parseInt(e.target.value) : null)}>
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
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
            </CardBody>
          </>
        )}

        {/* ===== PENJADWALAN (ADMIN ONLY) ===== */}
        {activeTab === 'scheduling' && isAdmin && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Penjadwalan Tryout</h2>
            </CardHeader>
            <CardBody>
              {tryoutsLoading ? <div className="text-center py-8">Memuat...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-600"><th className="p-4 font-medium">Judul Tryout</th><th className="p-4 font-medium">Durasi</th><th className="p-4 font-medium">Kelas</th><th className="p-4 font-medium">Waktu Mulai</th><th className="p-4 font-medium">Waktu Selesai</th><th className="p-4 font-medium">Aksi</th></tr></thead>
                    <tbody>
                      {tryouts?.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada tryout. Buat dulu di tab Paket Tryout.</td></tr>}
                      {tryouts?.map((t: any) => (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900">{t.title}</td>
                          <td className="p-4 text-slate-600">{t.duration_minutes}m</td>
                          {editingScheduleId === t.id ? (
                            <>
                              <td className="p-4">
                                <select className="border rounded p-1 text-sm w-full" value={editClassId ?? ''} onChange={(e) => setEditClassId(e.target.value ? parseInt(e.target.value) : null)}>
                                  <option value="">-- Tanpa Kelas --</option>
                                  {classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </td>
                               <td className="p-4">
                               <input 
                                 type="datetime-local" 
                                 className="border rounded p-1 w-full" 
                                 value={editStartTime} 
                                 onChange={(e) => setEditStartTime(e.target.value)} 
                               />
                               <div className="text-[10px] text-slate-400 mt-1 italic">Waktu selesai otomatis (+{t.duration_minutes}m)</div>
                             </td>
                            </>
                          ) : (
                            <><td className="p-4 text-slate-600">{t.class_id ? (classes?.find((c: any) => c.id === t.class_id)?.name || `Kelas #${t.class_id}`) : <span className="text-slate-400 italic">Semua</span>}</td>
                              <td className="p-4 text-slate-600">{t.start_time ? formatDateID(correctUTC(t.start_time)) : 'Belum diatur'}</td>
                              <td className="p-4 text-slate-600">{t.end_time ? formatDateID(correctUTC(t.end_time)) : 'Belum diatur'}</td></>
                          )}
                           <td className="p-4">
                             {editingScheduleId === t.id ? (
                               <div className="flex gap-2">
                                 <Button size="sm" isLoading={updateScheduleMutation.isPending} onClick={() => {
                                   const start = new Date(editStartTime);
                                   const end = new Date(start.getTime() + (t.duration_minutes * 60000)).toISOString();
                                   updateScheduleMutation.mutate({ id: t.id, start: start.toISOString(), end, classId: editClassId });
                                 }}>Simpan</Button>
                                 <Button size="sm" variant="secondary" onClick={() => setEditingScheduleId(null)}>Batal</Button>
                               </div>
                             ) : (
                               <div className="flex gap-2">
                                 <Button size="sm" variant="secondary" onClick={() => { 
                                   setEditingScheduleId(t.id); 
                                   setEditStartTime(toLocalISO(t.start_time));
 
                                   setEditClassId(t.class_id ?? null); 
                                 }}>Atur Jadwal & Kelas</Button>
                                 <Button size="sm" variant="secondary" onClick={() => handleExportExcel(t.id)}><Download size={14} className="mr-1" /> Export</Button>
                               </div>
                             )}
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

        {/* ===== KELAS (ADMIN ONLY) ===== */}
        {activeTab === 'classes' && isAdmin && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Manajemen Kelas</h2>
              <Button size="sm" onClick={() => setIsCreatingClass(true)}><Plus size={16} className="mr-2" /> Buat Kelas</Button>
            </CardHeader>
            <CardBody>
              {classesLoading ? <div className="text-center py-8">Memuat kelas...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-600"><th className="p-4 font-medium">ID</th><th className="p-4 font-medium">Nama Kelas</th><th className="p-4 font-medium">Tutor ID</th><th className="p-4 font-medium">Aksi</th></tr></thead>
                    <tbody>
                      {classes?.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada kelas.</td></tr>}
                      {classes?.map((c: any) => (
                        <React.Fragment key={c.id}>
                          <tr className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 text-slate-500">#{c.id}</td>
                            <td className="p-4 font-medium text-slate-900">{c.name}</td>
                            <td className="p-4 text-slate-600">{c.tutor_id || 'Unassigned'}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setSelectedClassId(selectedClassId === c.id ? null : c.id)}>{selectedClassId === c.id ? 'Sembunyikan' : 'Kelola Siswa'}</Button>
                                <button onClick={() => { setEditingClass(c); setCForm({ name: c.name }); }} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => confirm('Hapus kelas ini?') && deleteClassMutation.mutate(c.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                          {selectedClassId === c.id && (
                            <tr className="bg-slate-50 border-b border-slate-200"><td colSpan={4} className="p-6">
                              <div className="bg-white rounded border border-slate-200 p-4">
                                <h3 className="font-semibold text-slate-800 mb-4">Siswa di {c.name}</h3>
                                <div className="flex gap-2 mb-4">
                                  <select 
                                    className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full max-w-sm bg-white" 
                                    value={newStudentId} 
                                    onChange={(e) => setNewStudentId(e.target.value)}
                                  >
                                    <option value="">-- Pilih Siswa --</option>
                                    {users?.filter((u: any) => u.role === 'student' && !classStudents?.some((cs: any) => cs.id === u.id)).map((u: any) => (
                                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                  </select>
                                  <Button size="sm" onClick={() => newStudentId && enrollMutation.mutate(newStudentId)} isLoading={enrollMutation.isPending}>Enroll</Button>
                                </div>
                                {classStudentsLoading ? <p className="text-sm text-slate-500">Memuat siswa...</p> : (
                                  <ul className="divide-y divide-slate-100">
                                    {classStudents?.length === 0 && <li className="py-2 text-sm text-slate-500">Belum ada siswa.</li>}
                                    {classStudents?.map((s: any) => (
                                      <li key={s.id} className="py-2 flex justify-between items-center text-sm">
                                        <span><span className="font-medium text-slate-700">{s.name}</span> <span className="text-slate-500">({s.email})</span></span>
                                        <button className="text-red-500 hover:text-red-700 font-medium" onClick={() => confirm('Hapus siswa dari kelas?') && unenrollMutation.mutate(s.id)}>Hapus</button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </td></tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </>
        )}

        {/* ===== PENGGUNA (ADMIN ONLY) ===== */}
        {activeTab === 'users' && isAdmin && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Pengguna Platform</h2>
              <div className="flex gap-2">
                <input type="file" ref={csvInputRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSVMutation.mutate(f); }} />
                <Button size="sm" variant="secondary" onClick={() => csvInputRef.current?.click()} isLoading={uploadCSVMutation.isPending}><Upload size={16} className="mr-2" />{uploadCSVMutation.isPending ? 'Mengupload...' : 'Import CSV'}</Button>
                <Button size="sm" onClick={() => setIsCreatingUser(true)}><Plus size={16} className="mr-2" /> Tambah User</Button>
              </div>
            </CardHeader>
            <CardBody>
              {usersLoading ? <div className="text-center py-8">Memuat pengguna...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-600"><th className="p-4 font-medium">ID</th><th className="p-4 font-medium">Nama</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Bergabung</th></tr></thead>
                    <tbody>
                      {users?.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada pengguna.</td></tr>}
                      {users?.map((u: any) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 text-slate-500">#{u.id}</td>
                          <td className="p-4 font-medium text-slate-900">{u.name}</td>
                          <td className="p-4 text-slate-600">{u.email}</td>
                          <td className="p-4 flex"><span className={`px-2 py-1 rounded inline-flex text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'tutor' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span></td>
                          <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingUser(u); setUForm({ name: u.name, email: u.email, password: '', role: u.role }); }} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => confirm('Hapus user ini?') && deleteUserMutation.mutate(u.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
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
      </Card>

      {/* ===== MODALS ===== */}
      {isCreatingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Tambah Pengguna</h3>
              <button onClick={() => setIsCreatingUser(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama</label><input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.role} onChange={(e) => setUForm({ ...uForm, role: e.target.value })}>
                  <option value="student">Siswa</option><option value="tutor">Tutor</option><option value="admin">Admin</option>
                </select></div>
              <Button className="w-full" isLoading={createUserMutation.isPending} onClick={() => createUserMutation.mutate(uForm)}>Buat Pengguna</Button>
            </div>
          </div>
        </div>
      )}

      {isCreatingClass && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Buat Kelas</h3>
              <button onClick={() => setIsCreatingClass(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label><input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={cForm.name} onChange={(e) => setCForm({ name: e.target.value })} /></div>
              <Button className="w-full" isLoading={createClassMutation.isPending} onClick={() => createClassMutation.mutate(cForm)}>Buat Kelas</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Edit Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama</label><input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Password (Kosongkan jika tidak ganti)</label><input type="password" placeholder="••••••••" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.role} onChange={(e) => setUForm({ ...uForm, role: e.target.value })}>
                  <option value="student">Siswa</option><option value="tutor">Tutor</option><option value="admin">Admin</option>
                </select></div>
              <Button className="w-full" isLoading={updateUserMutation.isPending} onClick={() => updateUserMutation.mutate(uForm)}>Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT CLASS */}
      {editingClass && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Edit Kelas</h3>
              <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label><input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={cForm.name} onChange={(e) => setCForm({ name: e.target.value })} /></div>
              <Button className="w-full" isLoading={updateClassMutation.isPending} onClick={() => updateClassMutation.mutate(cForm)}>Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">{detailQuestion.question_text}</p>
                {detailQuestion.image_url && <img src={api.defaults.baseURL?.replace('/api/v1', '') + detailQuestion.image_url} alt="Soal" className="mt-4 max-h-64 object-contain rounded-lg border" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['a', 'b', 'c', 'd'] as const).map(opt => (
                  <div key={opt} className={`p-4 rounded-lg border flex items-start gap-3 ${detailQuestion.correct_answer === opt.toUpperCase() ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${detailQuestion.correct_answer === opt.toUpperCase() ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{opt.toUpperCase()}</span>
                    <p className="text-sm text-slate-700">{(detailQuestion as any)[`option_${opt}`]}</p>
                    {detailQuestion.correct_answer === opt.toUpperCase() && <CheckCircle2 size={16} className="text-green-600 ml-auto" />}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Pembahasan:</h4>
                <p className="text-sm text-slate-600 bg-amber-50/50 p-4 rounded-lg border border-amber-100 italic whitespace-pre-wrap">{detailQuestion.explanation || 'Tidak ada pembahasan.'}</p>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Folder / Kategori</label>
                  <select className="w-full border border-slate-300 rounded p-2" value={qForm.category_id || ''} onChange={(e) => setQForm({ ...qForm, category_id: e.target.value ? parseInt(e.target.value) : null })}>
                    <option value="">Tanpa Folder</option>
                    {categories?.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
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
                    <select className="w-full border border-slate-300 rounded p-2" value={qForm.question_type} onChange={(e) => setQForm({ ...qForm, question_type: e.target.value })}>
                      <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                      <option value="MULTIPLE_ANSWERS">Pilihan Ganda (Bisa Banyak Jawaban)</option>
                      <option value="TRUE_FALSE">Benar / Salah</option>
                      <option value="ESSAY">Isian Singkat</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teks Soal / Pokok Soal</label>
                  <RichTextEditor value={qForm.question_text} onChange={(val: string) => setQForm({ ...qForm, question_text: val })} placeholder="Tulis soal di sini..." />
                </div>
                <div className="mb-4 pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">Gambar (Opsional)
                  {qForm.image_url && (<button onClick={() => setQForm({ ...qForm, image_url: '' })} className="text-red-500 text-sm hover:underline">Hapus Gambar</button>)}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Button size="sm" variant="secondary" onClick={() => imgInputRef.current?.click()} isLoading={uploadingImage}>Upload Gambar</Button>
                  </div>
                  {qForm.image_url && <img src={api.defaults.baseURL?.replace('/api/v1', '') + qForm.image_url} alt="Soal" className="mt-2 h-32 object-contain rounded border" />}
                </div>

                {/* ---- MULTIPLE_CHOICE ---- */}
                {qForm.question_type === 'MULTIPLE_CHOICE' && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {(['a', 'b', 'c', 'd'] as const).map(opt => (
                        <div key={opt}><label className="block text-sm font-medium text-slate-700 mb-1">Pilihan {opt.toUpperCase()}</label>
                          <input className="w-full border border-slate-300 rounded p-2" value={(qForm as any)[`option_${opt}`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} /></div>
                      ))}
                    </div>
                    <div className="mb-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban</label>
                      <select className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })}>
                        <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option>
                      </select></div>
                  </>
                )}

                {/* ---- MULTIPLE_ANSWERS ---- */}
                {qForm.question_type === 'MULTIPLE_ANSWERS' && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {(['a', 'b', 'c', 'd'] as const).map(opt => (
                        <div key={opt}><label className="block text-sm font-medium text-slate-700 mb-1">Pilihan {opt.toUpperCase()}</label>
                          <input className="w-full border border-slate-300 rounded p-2" value={(qForm as any)[`option_${opt}`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}`]: e.target.value })} /></div>
                      ))}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pilih semua jawaban yang BENAR:</label>
                      <div className="flex gap-4 flex-wrap">
                        {(['A','B','C','D'] as const).map(opt => {
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
                  <div className="mb-4">
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
                          {(['a','b','c','d'] as const).map((opt, idx) => {
                            const tfAnswers = qForm.correct_answer.split(',').map(s=>s.trim());
                            while(tfAnswers.length < 4) tfAnswers.push('');
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
                                    onChange={() => { const a = qForm.correct_answer.split(',').map(s=>s.trim()); while(a.length<4)a.push(''); a[idx]='T'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
                                    className="w-5 h-5 accent-green-500" />
                                </td>
                                <td className="p-2 text-center">
                                  <input type="radio" name={`tf_edit_${opt}`} value="F" checked={currentAnswer === 'F'}
                                    onChange={() => { const a = qForm.correct_answer.split(',').map(s=>s.trim()); while(a.length<4)a.push(''); a[idx]='F'; setQForm({ ...qForm, correct_answer: a.join(',') }); }}
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

                {/* ---- ESSAY ---- */}
                {qForm.question_type === 'ESSAY' && (
                  <div className="mb-4"><label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban (Isian Singkat)</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} placeholder="Ketik jawaban yang benar" /></div>
                )}

                <div className="mb-4"><label className="block text-sm font-medium text-slate-700 mb-1">Pembahasan</label>
                <textarea className="w-full border border-slate-300 rounded p-2 h-20" value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} /></div>
              <Button className="w-full" onClick={() => updateQuestionMutation.mutate(qForm)} isLoading={updateQuestionMutation.isPending} disabled={!qForm.question_text}>Simpan Perubahan</Button>
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
                  <h3 className="text-xl font-bold text-slate-800">Detail Paket Tryout</h3>
                  <p className="text-sm text-slate-500">{detailTryout.title} • {detailTryout.duration_minutes} Menit</p>
               </div>
              <button onClick={() => setDetailTryout(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700">Daftar Soal ({detailTryout.questions?.length || 0}):</h4>
              <div className="divide-y border rounded-lg overflow-hidden">
                {detailTryout.questions?.map((q: any, i: number) => (
                  <div key={q.id} className="p-4 hover:bg-slate-50 flex gap-3">
                    <span className="text-slate-400 font-mono text-xs mt-1">{(i+1).toString().padStart(2, '0')}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 line-clamp-2">{q.question_text}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">{q.subject}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">{q.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!detailTryout.questions?.length && <div className="p-8 text-center text-slate-400 italic">Belum ada soal ditambahkan.</div>}
              </div>
              <Button className="w-full" variant="secondary" onClick={() => { setManagingQuestionsTryoutId(detailTryout.id); setDetailTryout(null); }}>Buka Manajemen Soal</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
