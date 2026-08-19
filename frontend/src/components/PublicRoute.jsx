import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute() {
  const { user, admin, staff } = useAuth();

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  if (staff) {
    return <Navigate to="/staff" replace />;
  }

  if (user) {
    if (!user.profileCompleted) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
