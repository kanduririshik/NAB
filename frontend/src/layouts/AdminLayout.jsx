import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ContactMessage, dbEvents } from '../services/api';
import Logo from '../components/Logo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Package, ClipboardList, Users, Mail, LogOut, Menu, X, ShieldCheck, Truck, Compass, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
  const { admin, adminLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load unread message count using TanStack Query
  const { data: messages = [] } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => ContactMessage.list(),
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  useEffect(() => {
    // Listen to changes in databases
    const unsubContacts = dbEvents.subscribe('contacts_update', () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
    });
    const unsubLocations = dbEvents.subscribe('locations_update', () => {
      queryClient.invalidateQueries({ queryKey: ['liveLocations'] });
    });
    const unsubAssignments = dbEvents.subscribe('assignments_update', () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssignments'] });
    });
    const unsubOrders = dbEvents.subscribe('orders_update', () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    });
    const unsubAgents = dbEvents.subscribe('agents_update', () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgents'] });
    });

    return () => {
      unsubContacts();
      unsubLocations();
      unsubAssignments();
      unsubOrders();
      unsubAgents();
    };
  }, [queryClient]);

  const handleLogout = () => {
    adminLogout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={16} /> },
    { id: 'products', label: 'Products CRUD', path: '/admin/products', icon: <Package size={16} /> },
    { id: 'orders', label: 'Orders Desk', path: '/admin/orders', icon: <ClipboardList size={16} /> },
    { id: 'customers', label: 'Customers Ledger', path: '/admin/customers', icon: <Users size={16} /> },
    { id: 'assign-work', label: 'Assign Work', path: '/admin/assign-work', icon: <UserCheck size={16} /> },
    { id: 'delivery-agents', label: 'Delivery Agents', path: '/admin/delivery-agents', icon: <Truck size={16} /> },
    { id: 'delivery-tracking', label: 'Delivery Tracking', path: '/admin/delivery-tracking', icon: <Compass size={16} /> },
    { id: 'messages', label: 'Contact Inbox', path: '/admin/messages', icon: <Mail size={16} />, badge: true }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Logo */}
        <Link 
          to="/admin" 
          className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800 hover:bg-slate-800/40 transition-colors group cursor-pointer"
        >
          <div className="group-hover:scale-105 transition-transform duration-300">
            <Logo showText={false} height={32} color="#FFFFFF" dnaColor="#0f172a" />
          </div>
          <span className="font-display font-black text-md text-white group-hover:text-sky-400 transition-colors duration-300">
            NAB Connect
          </span>
        </Link>

        {/* Sidebar Nav */}
        <nav className="p-4 space-y-1.5 pt-6 text-left">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/admin'}
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
              {item.badge && unreadCount > 0 && (
                <span className="bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-full text-[9px] shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Staff footer info */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 px-3 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-primary" />
          <span className="font-bold truncate">Admin: {admin?.username}</span>
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
            to="/admin" 
            className="flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all group"
          >
            <div className="group-hover:scale-105 transition-transform duration-300">
              <Logo showText={false} height={24} color="#FFFFFF" dnaColor="#0f172a" />
            </div>
            <span className="font-display font-extrabold text-xs text-white group-hover:text-sky-400 transition-colors duration-300">
              NAB Connect
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
