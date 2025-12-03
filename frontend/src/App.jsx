import { lazy,Suspense } from 'react';
import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom';
import { AuthProvider,useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const VerifyPending = lazy(() => import('./pages/VerifyPending'));
const VerifiedSuccess = lazy(() => import('./pages/VerifiedSuccess'));
const VerifyError = lazy(() => import('./pages/VerifyError'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const CollaborationList = lazy(() => import('./pages/Collaboration/CollaborationList'));
const CollaborationDashboard = lazy(() => import('./pages/Collaboration/CollaborationDashboard'));
const Landing = lazy(() => import('./pages/Landing'));

const ProtectedRoute = ({ children }) => {
  const { user,loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  return children;
};



// ... imports

const PublicRoute = ({ children }) => {
  const { user,loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (user) return <Navigate to="/dashboard" />;

  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-pending" element={<VerifyPending />} />
        <Route path="/verified-success" element={<VerifiedSuccess />} />
        <Route path="/verify-error" element={<VerifyError />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/collaborations" element={<CollaborationList />} />
          <Route path="/collaborations/:id" element={<CollaborationDashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
