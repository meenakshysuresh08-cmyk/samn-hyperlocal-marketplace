import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useNotificationStore } from './stores/notificationStore';
import Navbar from './components/Navbar';
import PostTaskModal from './components/PostTaskModal';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import HelperDashboard from './pages/HelperDashboard';
import TaskDiscoveryPage from './pages/TaskDiscoveryPage';
import TaskDetailPage from './pages/TaskDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { initAuth, isAuthenticated, user } = useAuthStore();
  const { fetchNotifications, bindNotificationEvents } = useNotificationStore();
  const [postModalOpen, setPostModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      bindNotificationEvents();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar onOpenPostModal={() => setPostModalOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage onOpenPostModal={() => setPostModalOpen(true)} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/explore" element={<TaskDiscoveryPage onOpenPostModal={() => setPostModalOpen(true)} />} />
          <Route path="/task/:id" element={<TaskDetailPage />} />

          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboard onOpenPostModal={() => setPostModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/helper-dashboard"
            element={
              <ProtectedRoute>
                <HelperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Post Task Modal */}
      <PostTaskModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSuccess={(task) => {
          navigate(`/task/${task._id}`);
        }}
      />
    </div>
  );
}
