import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { LayoutDashboard, ClipboardList, Truck, CheckCircle2, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbEvents } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

export default function StaffLayout() {
  const { staff, staffLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen to changes in assignments and locations
    const unsubAssignments = dbEvents.subscribe('assignments_update', () => {
      queryClient.invalidateQueries({ queryKey: ['staffAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['staffActiveAssignments'] });
    });
    const unsubOrders = dbEvents.subscribe('orders_update', () => {
      queryClient.invalidateQueries({ queryKey: ['staffOrders'] });
    });
    const unsubLocations = dbEvents.subscribe('locations_update', () => {
      queryClient.invalidateQueries({ queryKey: ['liveLocations'] });
    });

    return () => {
      unsubAssignments();
      unsubOrders();
      unsubLocations();
    };
  }, [queryClient]);

  const handleLogout = () => {
    staffLogout();
    navigate('/staff/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/staff', icon: <LayoutDashboard size={16} /> },
    { id: 'assigned', label: 'Assigned Orders', path: '/staff/assigned', icon: <ClipboardList size={16} /> },
    { id: 'active', label: 'Active Deliveries', path: '/staff/active', icon: <Truck size={16} /> },
    { id: 'completed', label: 'Completed logs', path: '/staff/completed', icon: <CheckCircle2 size={16} /> },
    { id: 'profile', label: 'Profile Settings', path: '/staff/profile', icon: <User size={16} /> }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Logo */}
        <Link 
          to="/staff" 
          className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800 hover:bg-slate-800/40 transition-colors group cursor-pointer"
        >
          <div className="group-hover:scale-105 transition-transform duration-300 bg-white p-1 rounded-lg flex items-center justify-center">
            <Logo showText={false} height={24} />
          </div>
          <span className="font-display font-black text-md text-white group-hover:text-sky-400 transition-colors duration-300">
            NAB Dispatch
          </span>
        </Link>

        {/* Sidebar Nav */}
        <nav className="p-4 space-y-1.5 pt-6 text-left">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/staff'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-xs font-bold transition-all relative group cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-sky-500/15 border-l-4 border-sky-400 border-t-transparent border-b-transparent border-r-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border-l-4 border-transparent border-t-transparent border-b-transparent border-r-transparent hover:border-slate-700/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Staff footer info */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 px-3 text-xs text-slate-400">
          {staff?.profilePhoto ? (
            <img 
              src={staff.profilePhoto} 
              alt={staff.fullName} 
              className="w-6 h-6 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <ShieldAlert size={14} className="text-primary" />
          )}
          <div className="flex flex-col truncate">
            <span className="font-bold text-white truncate text-[11px]">{staff?.fullName}</span>
            <span className="text-[9px] text-slate-500 font-mono truncate">{staff?.employeeId || 'Staff'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-destructive/20 border border-slate-700 hover:border-destructive/30 text-slate-300 hover:text-destructive text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <LogOut size={14} /> Exit Console
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row relative font-sans">
      
      {/* Sidebar: Desktop */}
      <aside className="hidden md:block w-64 bg-slate-900 text-white select-none border-r border-slate-800 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Panel Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white z-50 md:hidden shadow-xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
        {/* Ambient premium lights/glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-primary/6 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[5%] w-[450px] h-[450px] bg-sky-400/8 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-[40%] right-[-5%] w-[350px] h-[350px] bg-teal-400/4 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between h-16 px-4 bg-slate-900 text-white border-b border-slate-800 relative z-10">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <Menu size={18} />
          </button>
          <Link 
            to="/staff" 
            className="flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all group"
          >
            <div className="group-hover:scale-105 transition-transform duration-300 bg-white p-1 rounded-lg flex items-center justify-center">
              <Logo showText={false} height={20} />
            </div>
            <span className="font-display font-extrabold text-xs text-white group-hover:text-sky-400 transition-colors duration-300">
              NAB Dispatch
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Dynamic Page content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto w-full relative z-10">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
