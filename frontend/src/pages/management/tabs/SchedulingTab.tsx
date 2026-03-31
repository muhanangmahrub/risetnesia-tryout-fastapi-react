import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Download } from 'lucide-react';

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
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const SchedulingTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const queryClient = useQueryClient();
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editClassId, setEditClassId] = useState<number | null>(null);

  const { data: tryouts, isLoading: tryoutsLoading } = useQuery({
    queryKey: ['tryouts'],
    queryFn: async () => (await api.get('/tryouts')).data,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { id: number, start: string, end: string, classId: number | null }) => 
      (await api.put(`/tryouts/${data.id}`, { start_time: data.start, end_time: data.end, class_id: data.classId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tryouts'] });
      setEditingScheduleId(null);
    },
    onError: (e: any) => alert(e.response?.data?.detail || 'Error scheduling tryout')
  });

  const handleExportExcel = async (tryoutId: number) => {
    try {
      const res = await api.get(`/results/export/${tryoutId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hasil_tryout_${tryoutId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Gagal mengekspor data');
    }
  };

  if (!isAdmin) return null;

  return (
    <Card>
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
                      <>
                        <td className="p-4 text-slate-600">{t.class_id ? (classes?.find((c: any) => c.id === t.class_id)?.name || `Kelas #${t.class_id}`) : <span className="text-slate-400 italic">Semua</span>}</td>
                        <td className="p-4 text-slate-600">{t.start_time ? formatDateID(correctUTC(t.start_time)) : 'Belum diatur'}</td>
                        <td className="p-4 text-slate-600">{t.end_time ? formatDateID(correctUTC(t.end_time)) : 'Belum diatur'}</td>
                      </>
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
    </Card>
  );
};
