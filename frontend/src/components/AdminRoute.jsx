import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { admin } = useAuth();

  // If not logged in as administrator -> redirect to admin login page
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
