import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Assignment, Order, LiveLocation } from '../../services/api';
import { 
  ClipboardList, Truck, CheckCircle2, UserCheck, 
  MapPin, Clock, ArrowRight, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function StaffDashboard() {
  const { staff, updateStaffProfileState } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(() => {
    return staff?.availabilityStatus === 'Online';
  });

  // Query live location status for current staff
  const { data: myLocation } = useQuery({
    queryKey: ['myLiveLocation', staff?.id],
    queryFn: async () => {
      if (!staff?.id) return null;
      const locs = await LiveLocation.list();
      return locs.find(l => l.agentId === staff?.id) || null;
    },
    enabled: !!staff?.id
  });

  useEffect(() => {
    if (myLocation?.status) {
      setIsOnline(myLocation.status === 'Online' || myLocation.status === 'Moving');
    } else if (staff?.availabilityStatus) {
      setIsOnline(staff.availabilityStatus === 'Online');
    }
  }, [myLocation?.status, staff?.availabilityStatus]);

  // Fetch all assignments for the current staff member
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['staffAssignments', staff?.id],
    queryFn: () => Assignment.list(),
    select: (list) => list.filter(a => a.agentId === staff?.id),
    enabled: !!staff?.id
  });

  // Fetch all orders to get client metadata
  const { data: orders = [] } = useQuery({
    queryKey: ['staffOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  // Mutation to toggle online status
  const toggleStatusMutation = useMutation({
    mutationFn: async (statusVal) => {
      if (!staff?.id) throw new Error('No staff session found');
      
      let lat = 17.3850;
      let lng = 78.4867;

      try {
        const locs = await LiveLocation.list();
        const existing = locs.find(l => l.agentId === staff.id);
        if (existing && existing.latitude && existing.longitude) {
          lat = existing.latitude;
          lng = existing.longitude;
        }
      } catch (e) {
        console.warn('Could not query existing location', e);
      }

      if (navigator.geolocation && statusVal === 'Online') {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, enableHighAccuracy: true });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.warn('Geolocation unavailable, using default coords', e);
        }
      }

      // Update Supabase live_locations
      try {
        await LiveLocation.update(staff.id, lat, lng, { status: statusVal });
      } catch (err) {
        console.warn('LiveLocation update error:', err);
      }

      // Update local storage nab_agents and nab_live_locations if present
      try {
        const saved = JSON.parse(localStorage.getItem('nab_agents') || '[]');
        const target = saved.map(a => a.id === staff.id ? { ...a, availabilityStatus: statusVal } : a);
        localStorage.setItem('nab_agents', JSON.stringify(target));

        const locs = JSON.parse(localStorage.getItem('nab_live_locations') || '[]');
        const updatedLocs = locs.map(l => l.agentId === staff.id ? { ...l, status: statusVal === 'Online' ? 'Online' : 'Offline' } : l);
        localStorage.setItem('nab_live_locations', JSON.stringify(updatedLocs));
      } catch (e) {
        console.warn('LocalStorage sync warning:', e);
      }

      return {
        ...staff,
        availabilityStatus: statusVal
      };
    },
    onSuccess: (updatedAgent) => {
      if (updatedAgent) {
        updateStaffProfileState(updatedAgent);
        setIsOnline(updatedAgent.availabilityStatus === 'Online');
        toast.success(`Shift status changed to ${updatedAgent.availabilityStatus === 'Online' ? 'ONLINE' : 'OFFLINE'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['liveLocations'] });
      queryClient.invalidateQueries({ queryKey: ['myLiveLocation'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update shift status');
    }
  });

  const handleToggleOnline = () => {
    const nextStatus = isOnline ? 'Offline' : 'Online';
    toggleStatusMutation.mutate(nextStatus);
  };

  // Compute metrics
  const assignedCount = assignments.filter(a => a.status === 'Assigned' || !a.status).length;
  const activeCount = assignments.filter(a => ['Accepted', 'Picked Up', 'Out For Delivery'].includes(a.status)).length;
  const completedCount = assignments.filter(a => a.status === 'Delivered').length;
  const pendingCount = assignedCount + activeCount;

  // Get active assignments
  const activeDeliveries = assignments
    .filter(a => ['Accepted', 'Picked Up', 'Out For Delivery'].includes(a.status))
    .map(a => {
      const order = orders.find(o => o.id === a.orderId);
      return { ...a, orderDetails: order };
    });

  // Recent completed
  const recentCompleted = assignments
    .filter(a => a.status === 'Delivered')
    .slice(0, 3)
    .map(a => {
      const order = orders.find(o => o.id === a.orderId);
      return { ...a, orderDetails: order };
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Welcome Card & Shift Control */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Lights */}
        <div className="absolute top-[-30%] right-[-10%] w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
              Staff Portal
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Verified Agent</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            Welcome back, {staff?.fullName || 'Courier'}!
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Manage your daily hospital deliveries, route tracking, and confirmation handovers.
          </p>
        </div>

        {/* Online/Offline Status Switcher */}
        <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Current Shift</div>
            <div className={`text-xs font-black font-mono ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
              {isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE / INACTIVE'}
            </div>
          </div>
          <button 
            onClick={handleToggleOnline} 
            disabled={toggleStatusMutation.isPending}
            className="cursor-pointer text-slate-300 hover:text-white"
          >
            {isOnline ? (
              <ToggleRight size={38} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={38} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Assigned', value: assignedCount, icon: <ClipboardList size={20} className="text-sky-500" />, color: 'border-sky-100/60' },
          { label: 'Active Deliveries', value: activeCount, icon: <Truck size={20} className="text-indigo-500" />, color: 'border-indigo-100/60' },
          { label: 'Completed Today', value: completedCount, icon: <CheckCircle2 size={20} className="text-emerald-500" />, color: 'border-emerald-100/60' },
          { label: 'Pending Handovers', value: pendingCount, icon: <UserCheck size={20} className="text-amber-500" />, color: 'border-amber-100/60' }
        ].map((stat, idx) => (
          <div key={idx} className={`glass bg-white border ${stat.color} p-5 rounded-2xl flex justify-between items-center shadow-sm`}>
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{stat.label}</span>
              <span className="text-2xl font-black text-slate-900 block mt-1.5 font-display">{stat.value}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Active Deliveries & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Active Deliveries Panel (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-lg font-black text-slate-900 font-display">My Active Deliveries</h2>
            <Link to="/staff/active" className="text-xs font-bold text-primary hover:text-sky-600 flex items-center gap-1">
              Go to maps <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-xs text-slate-400">Loading active list...</div>
          ) : activeDeliveries.length === 0 ? (
            <div className="glass bg-white border border-slate-100 p-10 rounded-2xl text-center space-y-3">
              <Truck size={36} className="mx-auto text-slate-300" />
              <div className="text-xs text-slate-500 font-bold">No active deliveries on route.</div>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Check the Assigned Orders board to accept new hospital delivery dispatches.
              </p>
              <Link 
                to="/staff/assigned" 
                className="inline-flex py-2 px-4 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-sky-500 transition-all"
              >
                Accept New Orders
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map(del => (
                <div key={del.id} className="glass bg-white border border-indigo-100/80 rounded-2xl p-5 hover:border-indigo-400 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                        # {del.orderId.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-bold mt-1">
                        Assigned: {new Date(del.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                      {del.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900">{del.orderDetails?.customer_name || 'Hospital Partner'}</div>
                      <div className="text-slate-500 flex items-start gap-1.5 leading-relaxed">
                        <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{del.orderDetails?.delivery_address}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Distance:</span>
                        <span className="font-black text-slate-700">{del.distance} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Priority:</span>
                        <span className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded ${del.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                          {del.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Status:</span>
                        <span className="font-black text-slate-900 flex items-center gap-1">
                          <Clock size={12} className="text-indigo-400" /> {del.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 flex justify-end">
                    <Link 
                      to="/staff/active"
                      className="py-2 px-4 border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                    >
                      Update Delivery Status
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Actions & Recent Logs */}
        <div className="space-y-6">
          <div className="glass bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-left">
            <h3 className="font-display font-black text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
              Quick Controls
            </h3>
            <div className="flex flex-col gap-2.5">
              <Link 
                to="/staff/assigned"
                className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-primary transition-all group"
              >
                <span>Accept Assigned Deliveries</span>
                <span className="bg-sky-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full group-hover:scale-105 transition-all">
                  {assignedCount}
                </span>
              </Link>
              <Link 
                to="/staff/active"
                className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 transition-all group"
              >
                <span>Live Route Map / GPS</span>
                <Truck size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/staff/profile"
                className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all group"
              >
                <span>Shift Status & Info</span>
                <UserCheck size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Recent Completed dispatches */}
          <div className="glass bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-left">
            <h3 className="font-display font-black text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <span>Recent Completed</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{completedCount} total</span>
            </h3>

            {recentCompleted.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No completed orders yet.</div>
            ) : (
              <div className="space-y-4">
                {recentCompleted.map(del => (
                  <div key={del.id} className="text-xs space-y-1.5 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 font-mono">#{del.orderId.toUpperCase()}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Delivered
                      </span>
                    </div>
                    <div className="font-bold text-slate-700 truncate">{del.orderDetails?.customer_name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock size={12} />
                      <span>{new Date(del.deliveredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(del.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
