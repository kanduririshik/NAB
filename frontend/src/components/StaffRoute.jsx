import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffRoute() {
  const { staff, admin } = useAuth();

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
