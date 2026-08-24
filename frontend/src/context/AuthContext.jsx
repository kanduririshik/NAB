import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, dbEvents } from '../services/db';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const isCustomer = typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/staff');
    if (!isCustomer) return null;
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('nab_session_user') : null;
    return saved ? JSON.parse(saved) : null;
  });
  
  const [profile, setProfile] = useState(() => {
    const isCustomer = typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/staff');
    if (!isCustomer) return null;
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('nab_session_profile') : null;
    return saved ? JSON.parse(saved) : null;
  });

  const [admin, setAdmin] = useState(() => {
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (!isAdmin) return null;
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('nab_session_admin') : null;
    return saved ? JSON.parse(saved) : null;
  });

  const [staff, setStaff] = useState(() => {
    const isStaff = typeof window !== 'undefined' && window.location.pathname.startsWith('/staff');
    if (!isStaff) return null;
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('nab_session_staff') : null;
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Handles session loading and role verification
  const handleSession = async (session) => {
    if (!session || !session.user) return;
    const sessionUser = session.user;
    
    // Get role from user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', sessionUser.id)
      .maybeSingle();
      
    let role = roleData ? roleData.role : null;
    if (!role) {
      const emailLower = sessionUser.email?.toLowerCase() || '';
      if (emailLower === 'nab@nab.in' || sessionStorage.getItem('nab_session_admin')) {
        role = 'admin';
      } else if (sessionStorage.getItem('nab_session_staff') || (emailLower.endsWith('@nab.in') && emailLower !== 'nab@nab.in')) {
        role = 'staff';
      } else {
        role = 'customer';
      }
    }
    
    if (role === 'admin') {
      const adminObj = { id: sessionUser.id, email: sessionUser.email, role: 'admin' };
      setAdmin(adminObj);
      sessionStorage.setItem('nab_session_admin', JSON.stringify(adminObj));
      setUser(null);
      setProfile(null);
      setStaff(null);
      sessionStorage.removeItem('nab_session_user');
      sessionStorage.removeItem('nab_session_profile');
      sessionStorage.removeItem('nab_session_staff');
    } else if (role === 'delivery_boy' || role === 'staff') {
      // Load agent details
      let { data: agent } = await supabase
        .from('delivery_agents')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();
        
      if (!agent) {
        const usernamePrefix = (sessionUser.email?.split('@')[0] || '').toLowerCase();
        const { data: fallbackAgent } = await supabase
          .from('delivery_agents')
          .select('*')
          .or(`username.ilike.${usernamePrefix},email.ilike.${sessionUser.email}`)
          .maybeSingle();
        agent = fallbackAgent;
      }
        
      const staffObj = agent ? {
        id: agent.id,
        fullName: agent.full_name,
        username: agent.username,
        phone: agent.phone,
        email: agent.email,
        address: agent.address,
        vehicleType: agent.vehicle_type,
        vehicleNumber: agent.vehicle_number,
        employeeId: agent.employee_id,
        profilePhoto: agent.profile_photo,
        joiningDate: agent.joining_date,
        status: agent.status
      } : {
        id: sessionUser.id,
        fullName: sessionUser.user_metadata?.full_name || 'Staff Member',
        username: sessionUser.email?.split('@')[0] || 'staff',
        email: sessionUser.email,
        role: 'staff'
      };
      setStaff(staffObj);
      sessionStorage.setItem('nab_session_staff', JSON.stringify(staffObj));
      setUser(null);
      setProfile(null);
      setAdmin(null);
      sessionStorage.removeItem('nab_session_user');
      sessionStorage.removeItem('nab_session_profile');
      sessionStorage.removeItem('nab_session_admin');
    } else {
      // Customer
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();
        
      const hasProfile = !!customerProfile;
      const userObj = { id: sessionUser.id, email: sessionUser.email, role: 'customer', profileCompleted: hasProfile };
      setUser(userObj);
      sessionStorage.setItem('nab_session_user', JSON.stringify(userObj));
      
      if (hasProfile) {
        const profileObj = {
          userId: customerProfile.id,
          email: customerProfile.email,
          fullName: customerProfile.full_name,
          phone: customerProfile.phone,
          gender: customerProfile.gender,
          address: customerProfile.address,
          occupation: customerProfile.occupation,
          institutionType: customerProfile.institution_type,
          createdAt: customerProfile.created_at,
          updatedAt: customerProfile.updated_at
        };
        setProfile(profileObj);
        sessionStorage.setItem('nab_session_profile', JSON.stringify(profileObj));
      } else {
        setProfile(null);
        sessionStorage.removeItem('nab_session_profile');
      }
      setAdmin(null);
      setStaff(null);
      sessionStorage.removeItem('nab_session_admin');
      sessionStorage.removeItem('nab_session_staff');
    }
  };

  // Sync Supabase Auth session on mount and subscribe to changes
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdmin = path.startsWith('/admin');
        const isStaff = path.startsWith('/staff');

        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          await handleSession(session);
        } else if (mounted) {
          if (isAdmin) {
            const savedAdmin = sessionStorage.getItem('nab_session_admin');
            if (savedAdmin) {
              setAdmin(JSON.parse(savedAdmin));
              setUser(null);
              setProfile(null);
              setStaff(null);
            }
          } else if (isStaff) {
            const savedStaff = sessionStorage.getItem('nab_session_staff');
            if (savedStaff) {
              setStaff(JSON.parse(savedStaff));
              setUser(null);
              setProfile(null);
              setAdmin(null);
            }
          } else {
            const savedUser = sessionStorage.getItem('nab_session_user');
            if (savedUser) {
              setUser(JSON.parse(savedUser));
              const savedProfile = sessionStorage.getItem('nab_session_profile');
              if (savedProfile) setProfile(JSON.parse(savedProfile));
              setAdmin(null);
              setStaff(null);
            }
          }
        }
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAdmin(null);
        setStaff(null);
        sessionStorage.removeItem('nab_session_user');
        sessionStorage.removeItem('nab_session_profile');
        sessionStorage.removeItem('nab_session_admin');
        sessionStorage.removeItem('nab_session_staff');
        sessionStorage.removeItem('nab_access_token');
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Real-time EventHub triggers for orders and updates
  useEffect(() => {
    if (!user && !admin && !staff) return;

    // Show realtime notifications for changes
    const unsubOrders = dbEvents.subscribe('orders_update', (order) => {
      if (!order) return;
      
      // Determine if order belongs to current user
      const isMyOrder = user && order.user_id === user.id;
      const isAdminOrStaff = admin || staff;
      
      if (isMyOrder || isAdminOrStaff) {
        const id = Date.now();
        const newNotif = {
          id,
          title: `📦 Order Update: ${order.id}`,
          message: `Order status is now: ${order.status}`,
          type: 'order'
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 5));
        
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 8000);
      }
    });

    const unsubAssignments = dbEvents.subscribe('assignments_update', (assignment) => {
      if (!assignment) return;

      const isMyAssignment = staff && assignment.agent_id === staff.id;
      
      if (isMyAssignment) {
        const id = Date.now();
        const newNotif = {
          id,
          title: `🚚 New Delivery Assigned`,
          message: `Order ${assignment.order_id} assigned to you (${assignment.priority} Priority).`,
          type: 'assignment'
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 5));

        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 8000);
      }
    });

    return () => {
      unsubOrders();
      unsubAssignments();
    };
  }, [user, admin, staff]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const loginViaEmailPassword = async (email, password) => {
    const res = await api.login(email, password);
    
    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', res.user.id)
      .single();

    if (roleData && roleData.role !== 'customer') {
      await supabase.auth.signOut();
      throw new Error('Please sign in using the correct portal.');
    }
    
    const userObj = { id: res.user.id, email: res.user.email, role: 'customer', profileCompleted: !!res.profile };
    setUser(userObj);
    sessionStorage.setItem('nab_session_user', JSON.stringify(userObj));
    if (res.profile) {
      setProfile(res.profile);
      sessionStorage.setItem('nab_session_profile', JSON.stringify(res.profile));
    } else {
      setProfile(null);
      sessionStorage.removeItem('nab_session_profile');
    }
    return res;
  };

  const loginViaOTP = async (email, otp) => {
    throw new Error('OTP login is disabled in production. Please use Email/Password.');
  };

  const loginWithProvider = async (provider = 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const registerUser = async ({ email, password }) => {
    return await api.register(email, password);
  };

  const verifyOtpUser = async ({ email, otpCode }) => {
    throw new Error('OTP verification is disabled. Please verify via email link.');
  };

  const setToken = (token) => {
    sessionStorage.setItem('nab_access_token', token);
  };

  const resetPasswordRequest = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
    return { success: true };
  };

  const resetPasswordObj = async ({ newPassword }) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true };
  };

  const completeProfile = async (profileData) => {
    if (!user) throw new Error('No active user session');
    const res = await api.updateProfile(user.id, profileData);
    
    setUser(prev => ({ ...prev, profileCompleted: true }));
    setProfile(res.profile);
    
    // Force event reload
    dbEvents.notify('customers_update', null);
    return res;
  };

  const logout = () => {
    supabase.auth.signOut();
    // Scope cart keys on logout
    if (user) {
      sessionStorage.removeItem(`nab_cart_${user.id}`);
      localStorage.removeItem(`nab_cart_${user.id}`);
    }
    setUser(null);
    setProfile(null);
    sessionStorage.removeItem('nab_session_user');
    sessionStorage.removeItem('nab_session_profile');
    sessionStorage.removeItem('nab_access_token');
  };

  const adminLogin = async (username, password) => {
    const res = await api.adminLogin(username, password);
    setAdmin(res.admin);
    sessionStorage.setItem('nab_session_admin', JSON.stringify(res.admin));
    setUser(null);
    setProfile(null);
    setStaff(null);
    sessionStorage.removeItem('nab_session_user');
    sessionStorage.removeItem('nab_session_profile');
    sessionStorage.removeItem('nab_session_staff');
    return res;
  };

  const adminLogout = () => {
    supabase.auth.signOut();
    setAdmin(null);
    sessionStorage.removeItem('nab_session_admin');
    sessionStorage.removeItem('nab_access_token');
  };

  const staffLogin = async (username, password) => {
    const res = await api.staffLogin(username, password);
    setStaff(res.agent);
    sessionStorage.setItem('nab_session_staff', JSON.stringify(res.agent));
    setUser(null);
    setProfile(null);
    setAdmin(null);
    sessionStorage.removeItem('nab_session_user');
    sessionStorage.removeItem('nab_session_profile');
    sessionStorage.removeItem('nab_session_admin');
    return res;
  };

  const staffLogout = () => {
    supabase.auth.signOut();
    setStaff(null);
    sessionStorage.removeItem('nab_session_staff');
    sessionStorage.removeItem('nab_access_token');
  };

  const updateStaffProfileState = (updatedProfile) => {
    if (!updatedProfile) return;
    setStaff(prev => {
      const merged = { ...(prev || {}), ...updatedProfile };
      sessionStorage.setItem('nab_session_staff', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      admin,
      staff,
      loading,
      isAuthReady: !loading,
      notifications,
      removeNotification,
      loginViaEmailPassword,
      loginViaOTP,
      loginWithProvider,
      register: registerUser,
      requestOtp: async (email) => { throw new Error('Disabled'); },
      verifyOtp: verifyOtpUser,
      setToken,
      resetPasswordRequest,
      resetPassword: resetPasswordObj,
      completeProfile,
      logout,
      adminLogin,
      adminLogout,
      staffLogin,
      staffLogout,
      updateStaffProfileState
    }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {notifications.map(notif => (
          <div 
            key={notif.id}
            className="pointer-events-auto w-full bg-slate-900/95 border border-primary-500/30 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-1 transition-all duration-300 animate-slide-up text-left"
          >
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-primary-400 font-display flex items-center gap-1.5">
                {notif.title}
              </span>
              <button 
                onClick={() => removeNotification(notif.id)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">{notif.message}</p>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
