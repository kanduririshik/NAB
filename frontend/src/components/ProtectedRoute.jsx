import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, admin, staff } = useAuth();

  // If active administrator session tries to access customer route -> redirect to /admin
  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  // If active delivery boy/staff session tries to access customer route -> redirect to /staff
  if (staff) {
    return <Navigate to="/staff" replace />;
  }

  // Unauthenticated -> redirect /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User without profile_completed -> redirect /complete-profile
  if (!user.profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}
