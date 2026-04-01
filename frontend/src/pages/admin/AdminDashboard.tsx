import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, BookOpen, Upload, Plus, Calendar, Download, X } from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'tryouts'>('users');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [newStudentId, setNewStudentId] = useState('');
  
  const [editingTryoutId, setEditingTryoutId] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [uForm, setUForm] = useState({ name: '', email: '', password: '', role: 'student' });

  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [cForm, setCForm] = useState({ name: '' });

  const [isCreatingTryout, setIsCreatingTryout] = useState(false);
  const [tForm, setTForm] = useState({ title: '', duration_minutes: 120 });
  
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
    enabled: activeTab === 'users'
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data;
    },
    enabled: activeTab === 'classes'
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Import successful! Created: ${data.created}, Skipped: ${data.skipped}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error uploading file');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreatingUser(false);
      setUForm({ name: '', email: '', password: '', role: 'student' });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating user')
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/classes', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreatingClass(false);
      setCForm({ name: '' });
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating class')
  });

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
    onError: (e: any) => alert(e.response?.data?.detail || 'Error creating tryout')
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const { data: classStudents, isLoading: classStudentsLoading } = useQuery({
    queryKey: ['classStudents', selectedClassId],
    queryFn: async () => {
      const res = await api.get(`/classes/${selectedClassId}/students`);
      return res.data;
    },
    enabled: !!selectedClassId
  });

  const { data: tryouts, isLoading: tryoutsLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: async () => {
      const res = await api.get('/tryouts');
      return res.data;
    },
    enabled: activeTab === 'tryouts'
  });

  const updateTryoutMutation = useMutation({
    mutationFn: async (params: { id: number; start: string; end: string }) => {
      const res = await api.put(`/tryouts/${params.id}`, {
        start_time: params.start ? new Date(params.start).toISOString() : null,
        end_time: params.end ? new Date(params.end).toISOString() : null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
      setEditingTryoutId(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error updating schedule');
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await api.post(`/classes/${selectedClassId}/enroll/${studentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClassId] });
      setNewStudentId('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error enrolling student');
    }
  });

  const unenrollMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await api.delete(`/classes/${selectedClassId}/unenroll/${studentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClassId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error unenrolling student');
    }
  });

  const handleExportExcel = async (tryoutId: number) => {
    try {
      const response = await api.get(`/results/export/${tryoutId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tryout_${tryoutId}_results.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      alert('Error downloading excel file. Make sure there are results available.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage platform users and classes.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'users' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Users
        </button>
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'classes' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('classes')}
        >
          <BookOpen size={18} /> Classes
        </button>
        <button
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'tryouts' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('tryouts')}
        >
          <Calendar size={18} /> Scheduling
        </button>
      </div>

      <Card>
        {activeTab === 'users' && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Platform Users</h2>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadMutation.isPending}
                >
                  <Upload size={16} className="mr-2" /> 
                  {uploadMutation.isPending ? 'Uploading...' : 'Import CSV'}
                </Button>
                <Button size="sm" onClick={() => setIsCreatingUser(true)}>
                  <Plus size={16} className="mr-2" /> Add User
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {usersLoading ? <div className="text-center py-8">Loading users...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="p-4 font-medium rounded-tl-lg">ID</th>
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium rounded-tr-lg">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td></tr>
                      )}
                      {users?.map((u: any) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-500">#{u.id}</td>
                          <td className="p-4 font-medium text-slate-900">{u.name}</td>
                          <td className="p-4 text-slate-600">{u.email}</td>
                          <td className="p-4 flex">
                            <span className={`px-2 py-1 rounded inline-flex text-xs font-semibold ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'tutor' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </>
        )}

        {activeTab === 'classes' && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Classes</h2>
              <Button size="sm" onClick={() => setIsCreatingClass(true)}>Create Class</Button>
            </CardHeader>
            <CardBody>
              {classesLoading ? <div className="text-center py-8">Loading classes...</div> : (
                 <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse text-sm">
                   <thead>
                     <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                       <th className="p-4 font-medium rounded-tl-lg">ID</th>
                       <th className="p-4 font-medium">Class Name</th>
                       <th className="p-4 font-medium">Tutor ID</th>
                       <th className="p-4 font-medium rounded-tr-lg">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {classes?.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No classes found.</td></tr>
                     )}
                     {classes?.map((c: any) => (
                       <React.Fragment key={c.id}>
                       <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                         <td className="p-4 text-slate-500">#{c.id}</td>
                         <td className="p-4 font-medium text-slate-900">{c.name}</td>
                         <td className="p-4 text-slate-600">{c.tutor_id || 'Unassigned'}</td>
                         <td className="p-4">
                           <Button size="sm" variant="secondary" onClick={() => setSelectedClassId(selectedClassId === c.id ? null : c.id)}>
                             {selectedClassId === c.id ? 'Hide Students' : 'Manage Students'}
                           </Button>
                         </td>
                       </tr>
                       {selectedClassId === c.id && (
                         <tr className="bg-slate-50 border-b border-slate-200">
                           <td colSpan={4} className="p-6">
                             <div className="bg-white rounded border border-slate-200 p-4">
                               <h3 className="font-semibold text-slate-800 mb-4">Students in {c.name}</h3>
                               
                               <div className="flex gap-2 mb-4">
                                 <input 
                                   type="number" 
                                   placeholder="Student ID" 
                                   className="border border-slate-300 rounded px-3 py-1 text-sm focus:ring-brand-500"
                                   value={newStudentId}
                                   onChange={(e) => setNewStudentId(e.target.value)}
                                 />
                                 <Button 
                                   size="sm" 
                                   onClick={() => newStudentId && enrollMutation.mutate(newStudentId)}
                                   isLoading={enrollMutation.isPending}
                                 >
                                   Enroll Student
                                 </Button>
                               </div>

                               {classStudentsLoading ? <p className="text-sm text-slate-500">Loading students...</p> : (
                                 <ul className="divide-y divide-slate-100">
                                   {classStudents?.length === 0 && <li className="py-2 text-sm text-slate-500">No students enrolled.</li>}
                                   {classStudents?.map((s: any) => (
                                     <li key={s.id} className="py-2 flex justify-between items-center text-sm">
                                       <span><span className="font-medium text-slate-700">{s.name}</span> <span className="text-slate-500">({s.email})</span></span>
                                       <button 
                                         className="text-red-500 hover:text-red-700 font-medium"
                                         onClick={() => confirm('Remove student from class?') && unenrollMutation.mutate(s.id)}
                                       >
                                         Remove
                                       </button>
                                     </li>
                                   ))}
                                 </ul>
                               )}
                             </div>
                           </td>
                         </tr>
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

        {activeTab === 'tryouts' && (
          <>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Tryout Scheduling</h2>
              <Button size="sm" onClick={() => setIsCreatingTryout(true)}>
                <Plus size={16} className="mr-2" /> Schedule Tryout
              </Button>
            </CardHeader>
            <CardBody>
              {tryoutsLoading ? <div className="text-center py-8">Loading tryouts...</div> : (
                 <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse text-sm">
                   <thead>
                     <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                       <th className="p-4 font-medium rounded-tl-lg">Tryout Title</th>
                       <th className="p-4 font-medium">Duration</th>
                       <th className="p-4 font-medium">Start Time</th>
                       <th className="p-4 font-medium">End Time</th>
                       <th className="p-4 font-medium rounded-tr-lg">Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {tryouts?.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">No tryouts found.</td></tr>
                     )}
                     {tryouts?.map((t: any) => (
                       <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                         <td className="p-4 font-medium text-slate-900">{t.title}</td>
                         <td className="p-4 text-slate-600">{t.duration_minutes}m</td>
                         {editingTryoutId === t.id ? (
                           <td colSpan={2} className="p-4">
                             <div className="flex flex-col gap-2">
                               <input type="datetime-local" className="border rounded p-1" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                               <input type="datetime-local" className="border rounded p-1" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                             </div>
                           </td>
                         ) : (
                           <>
                           <td className="p-4 text-slate-600">{t.start_time ? new Date(t.start_time).toLocaleString() : 'Not Set'}</td>
                           <td className="p-4 text-slate-600">{t.end_time ? new Date(t.end_time).toLocaleString() : 'Not Set'}</td>
                           </>
                         )}
                         <td className="p-4">
                           {editingTryoutId === t.id ? (
                             <div className="flex gap-2">
                               <Button size="sm" isLoading={updateTryoutMutation.isPending} onClick={() => updateTryoutMutation.mutate({ id: t.id, start: editStartTime, end: editEndTime })}>Save</Button>
                               <Button size="sm" variant="secondary" onClick={() => setEditingTryoutId(null)}>Cancel</Button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <Button size="sm" variant="secondary" onClick={() => {
                                 setEditingTryoutId(t.id);
                                 setEditStartTime(t.start_time ? new Date(t.start_time).toISOString().slice(0,16) : '');
                                 setEditEndTime(t.end_time ? new Date(t.end_time).toISOString().slice(0,16) : '');
                               }}>Edit Schedule</Button>
                               <Button size="sm" variant="secondary" onClick={() => handleExportExcel(t.id)}>
                                 <Download size={14} className="mr-1" /> Export
                               </Button>
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
      </Card>

      {/* User Modal */}
      {isCreatingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New User</h3>
              <button onClick={() => setIsCreatingUser(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.name} onChange={(e) => setUForm({...uForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.email} onChange={(e) => setUForm({...uForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.password} onChange={(e) => setUForm({...uForm, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="w-full border border-slate-300 rounded px-3 py-2" value={uForm.role} onChange={(e) => setUForm({...uForm, role: e.target.value})}>
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button className="w-full" isLoading={createUserMutation.isPending} onClick={() => createUserMutation.mutate(uForm)}>Create User</Button>
            </div>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {isCreatingClass && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Class</h3>
              <button onClick={() => setIsCreatingClass(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={cForm.name} onChange={(e) => setCForm({ name: e.target.value })} />
              </div>
              <Button className="w-full" isLoading={createClassMutation.isPending} onClick={() => createClassMutation.mutate(cForm)}>Create Class</Button>
            </div>
          </div>
        </div>
      )}

      {/* Tryout Modal */}
      {isCreatingTryout && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Schedule New Tryout</h3>
              <button onClick={() => setIsCreatingTryout(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2" value={tForm.title} onChange={(e) => setTForm({...tForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                <input type="number" className="w-full border border-slate-300 rounded px-3 py-2" value={tForm.duration_minutes} onChange={(e) => setTForm({...tForm, duration_minutes: Number(e.target.value)})} />
              </div>
              <Button className="w-full" isLoading={createTryoutMutation.isPending} onClick={() => createTryoutMutation.mutate(tForm)}>Create Tryout Schema</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
