import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './Layout.jsx';
import Proposals from './pages/Proposals';
import ProposalEditor from './pages/ProposalEditor';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Account from './pages/Account';
import Users from './pages/Users';
import Login from './pages/Login';
import PublicProposal from './pages/PublicProposal';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/proposals" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/p/:token" element={<PublicProposal />} />
    <Route path="/" element={<Navigate to="/proposals" replace />} />

    {/* Proposals — all roles */}
    <Route path="/proposals" element={
      <PrivateRoute>
        <Layout currentPageName="Proposals"><Proposals /></Layout>
      </PrivateRoute>
    } />
    <Route path="/Proposals" element={<Navigate to="/proposals" replace />} />

    {/* Proposal Editor — all roles (block filtering handled inside) */}
    <Route path="/proposal-editor" element={
      <PrivateRoute>
        <Layout currentPageName="ProposalEditor"><ProposalEditor /></Layout>
      </PrivateRoute>
    } />
    <Route path="/ProposalEditor" element={
      <PrivateRoute>
        <Layout currentPageName="ProposalEditor"><ProposalEditor /></Layout>
      </PrivateRoute>
    } />

    {/* Admin only */}
    <Route path="/products" element={
      <PrivateRoute adminOnly>
        <Layout currentPageName="Products"><Products /></Layout>
      </PrivateRoute>
    } />
    <Route path="/settings" element={
      <PrivateRoute adminOnly>
        <Layout currentPageName="Settings"><Settings /></Layout>
      </PrivateRoute>
    } />
    <Route path="/users" element={
      <PrivateRoute adminOnly>
        <Layout currentPageName="Users"><Users /></Layout>
      </PrivateRoute>
    } />
    <Route path="/Users" element={<Navigate to="/users" replace />} />

    {/* Account — all roles */}
    <Route path="/account" element={
      <PrivateRoute>
        <Layout currentPageName="Account"><Account /></Layout>
      </PrivateRoute>
    } />
    <Route path="/Account" element={<Navigate to="/account" replace />} />

    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
