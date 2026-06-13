import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-lg font-bold">
      Loading...
    </div>
  );
}

// Helper to get stored user
const getStoredUser = () => {
  try {
    const user = localStorage.getItem('smartquiz-user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

// Guard for authenticated pages
function ProtectedRoute({ children, role }) {
  const user = getStoredUser();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return children;
}

// Guard for login page (redirect if already logged in)
function PublicRoute({ children }) {
  const user = getStoredUser();
  
  if (user) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student" 
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
