import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { admin, loading } = useAuth();

  // Wait for initial session restoration
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">Loading admin console...</div>;
  }

  // If not logged in as administrator -> redirect to admin login page
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
