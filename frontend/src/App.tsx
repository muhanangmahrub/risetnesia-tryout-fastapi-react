import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';

import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ManagementDashboard } from './pages/management/ManagementDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamPage } from './pages/student/ExamPage';



function App() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const res = await api.get('/auth/me');
      return res.data;
    },
    retry: false
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      {user ? (
        <MainLayout user={user}>
          <Routes>
            <Route path="/dashboard" element={(user?.role === 'admin' || user?.role === 'tutor') ? <ManagementDashboard user={user} /> : <Navigate to={`/${user.role}`} />} />
            <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to={`/${user.role}`} />} />
            <Route path="/student/exam/:id" element={user?.role === 'student' ? <ExamPage /> : <Navigate to={`/${user.role}`} />} />
            <Route path="*" element={<Navigate to={user?.role === 'student' ? '/student' : '/dashboard'} />} />
          </Routes>
        </MainLayout>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
