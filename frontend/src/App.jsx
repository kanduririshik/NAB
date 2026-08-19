import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PublicRoute from './components/PublicRoute';

// Customer Pages
import Landing from './pages/customer/Landing';
import Home from './pages/customer/Home';
import About from './pages/customer/About';
import Products from './pages/customer/Products';
import Cart from './pages/customer/Cart';
import Orders from './pages/customer/Orders';
import Contact from './pages/customer/Contact';
import Profile from './pages/customer/Profile';
import CompleteProfile from './pages/customer/CompleteProfile';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminMessages from './pages/admin/AdminMessages';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDeliveryAgents from './pages/admin/AdminDeliveryAgents';
import AdminDeliveryTracking from './pages/admin/AdminDeliveryTracking';
import AdminAssignWork from './pages/admin/AdminAssignWork';

// Staff Layout & Guards
import StaffLayout from './layouts/StaffLayout';
import StaffRoute from './components/StaffRoute';

// Staff Pages
import StaffLogin from './pages/staff/StaffLogin';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffAssignedOrders from './pages/staff/StaffAssignedOrders';
import StaffActiveDeliveries from './pages/staff/StaffActiveDeliveries';
import StaffCompletedDeliveries from './pages/staff/StaffCompletedDeliveries';
import StaffProfile from './pages/staff/StaffProfile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Mandatory Onboarding Route (requires login but NOT profile completed) */}
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/delivery-agents" element={<AdminDeliveryAgents />} />
              <Route path="/admin/delivery-tracking" element={<AdminDeliveryTracking />} />
              <Route path="/admin/live-tracking" element={<AdminDeliveryTracking />} />
              <Route path="/admin/assign-work" element={<AdminAssignWork />} />
            </Route>
          </Route>

          {/* Public Staff Auth Routes */}
          <Route path="/staff/login" element={<StaffLogin />} />

          {/* Protected Staff Routes */}
          <Route element={<StaffRoute />}>
            <Route element={<StaffLayout />}>
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/staff/assigned" element={<StaffAssignedOrders />} />
              <Route path="/staff/active" element={<StaffActiveDeliveries />} />
              <Route path="/staff/completed" element={<StaffCompletedDeliveries />} />
              <Route path="/staff/profile" element={<StaffProfile />} />
            </Route>
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
