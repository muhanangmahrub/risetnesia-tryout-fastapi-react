import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Upload, Plus, X, Edit2, Trash2 } from 'lucide-react';

export const UsersTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const queryClient = useQueryClient();

  // Users state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [uForm, setUForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/users', data)).data,
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

  if (!isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Pengguna Platform</h2>
          <div className="flex gap-2">
            <input type="file" ref={csvInputRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCSVMutation.mutate(f); }} />
            <Button size="sm" variant="secondary" onClick={() => csvInputRef.current?.click()} isLoading={uploadCSVMutation.isPending}><Upload size={16} className="mr-2" />{uploadCSVMutation.isPending ? 'Mengupload...' : 'Import CSV'}</Button>
            <Button size="sm" onClick={() => setIsCreatingUser(true)}><Plus size={16} className="mr-2" /> Tambah User</Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {usersLoading ? <div className="text-center py-8">Memuat pengguna...</div> : (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Nama</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Bergabung</th>
                    <th className="p-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada pengguna.</td></tr>}
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

      {/* MODAL EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Edit Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama</label><input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Password (Kosongkan jika tidak diubah)</label><input type="password" placeholder="Kosongkan jika tidak diubah" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.role} onChange={(e) => setUForm({ ...uForm, role: e.target.value })}>
                  <option value="student">Siswa</option><option value="tutor">Tutor</option><option value="admin">Admin</option>
                </select></div>
              <Button className="w-full" isLoading={updateUserMutation.isPending} onClick={() => updateUserMutation.mutate(uForm)}>Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
