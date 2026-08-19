import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffRoute() {
  const { staff, admin, loading } = useAuth();

  // Wait for initial session restoration
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">Loading dispatch console...</div>;
  }

  // If active administrator session tries to access staff route -> redirect to /admin
  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  // If not logged in as staff, redirect to staff login
  if (!staff) {
    return <Navigate to="/staff/login" replace />;
  }

  return <Outlet />;
}
