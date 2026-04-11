import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

export const ClassesTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const queryClient = useQueryClient();

  // Classes state
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [cForm, setCForm] = useState({ name: '', tutor_id: null as number | null });
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [newStudentId, setNewStudentId] = useState('');

  // Queries
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  const { data: classStudents, isLoading: classStudentsLoading } = useQuery({
    queryKey: ['classStudents', selectedClassId],
    queryFn: async () => (await api.get(`/classes/${selectedClassId}/students`)).data,
    enabled: !!selectedClassId
  });

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/classes', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreatingClass(false);
      setCForm({ name: '', tutor_id: null });
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

  const generateCodeMutation = useMutation({
    mutationFn: async (classId: number) => (await api.post(`/classes/${classId}/generate-code`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
    onError: (e: any) => alert(e.response?.data?.detail || 'Error generating code')
  });

  if (!isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Manajemen Kelas</h2>
          <Button size="sm" onClick={() => setIsCreatingClass(true)}><Plus size={16} className="mr-2" /> Buat Kelas</Button>
        </CardHeader>
        <CardBody className="p-0">
          {classesLoading ? <div className="text-center py-8">Memuat kelas...</div> : (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Nama Kelas</th>
                    <th className="p-4 font-medium">Tutor</th>
                    <th className="p-4 font-medium">Kode Masuk</th>
                    <th className="p-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {classes?.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada kelas.</td></tr>}
                  {classes?.map((c: any) => {
                    const tutor = users?.find((u: any) => u.id === c.tutor_id);
                    return (
                      <React.Fragment key={c.id}>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 text-slate-500">#{c.id}</td>
                          <td className="p-4 font-medium text-slate-900">{c.name}</td>
                          <td className="p-4 text-slate-600">
                            {tutor ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{tutor.name}</span>
                                <span className="text-[10px] text-slate-500">{tutor.email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum ditentukan</span>
                            )}
                          </td>
                        <td className="p-4">
                          {c.enrollment_code ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm bg-slate-200 px-2 py-1 rounded text-slate-800">{c.enrollment_code}</span>
                              <button onClick={() => generateCodeMutation.mutate(c.id)} className="text-xs text-brand-600 hover:underline">Reset</button>
                            </div>
                          ) : (
                            <button onClick={() => generateCodeMutation.mutate(c.id)} className="text-xs text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded">Generate</button>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setSelectedClassId(selectedClassId === c.id ? null : c.id)}>{selectedClassId === c.id ? 'Sembunyikan' : 'Kelola Siswa'}</Button>
                            <button onClick={() => { setEditingClass(c); setCForm({ name: c.name, tutor_id: c.tutor_id }); }} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
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
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ===== MODALS ===== */}
      {isCreatingClass && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Buat Kelas</h3>
              <button onClick={() => setIsCreatingClass(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tutor</label>
                <select 
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white" 
                  value={cForm.tutor_id || ''} 
                  onChange={(e) => setCForm({ ...cForm, tutor_id: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">-- Tanpa Tutor --</option>
                  {users?.filter((u: any) => u.role === 'tutor').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <Button className="w-full" isLoading={createClassMutation.isPending} onClick={() => createClassMutation.mutate(cForm)}>Buat Kelas</Button>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tutor</label>
                <select 
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white" 
                  value={cForm.tutor_id || ''} 
                  onChange={(e) => setCForm({ ...cForm, tutor_id: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">-- Tanpa Tutor --</option>
                  {users?.filter((u: any) => u.role === 'tutor').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <Button className="w-full" isLoading={updateClassMutation.isPending} onClick={() => updateClassMutation.mutate(cForm)}>Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
