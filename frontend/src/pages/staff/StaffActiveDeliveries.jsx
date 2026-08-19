import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Order, LiveLocation } from '../../services/api';
import { calculateDistanceMeters } from '../../lib/googleMaps';
import { Truck, MapPin, Phone, Check, ShieldAlert, Loader2, Play, Square, Compass, Clock, X, AlertTriangle, Radio, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function StaffActiveDeliveries() {
  const { staff } = useAuth();
  const queryClient = useQueryClient();
  
  // Real GPS tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [relativeTimeStr, setRelativeTimeStr] = useState('N/A');

  // Watcher and Throttle Refs
  const watchIdRef = useRef(null);
  const lastWrittenPosRef = useRef({ lat: null, lng: null, time: 0 });

  // Handover Modal State
  const [handoverOrder, setHandoverOrder] = useState(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverName, setHandoverName] = useState('');
  const [unableReason, setUnableReason] = useState('');
  const [unableOrder, setUnableOrder] = useState(null);
  const [mockPhoto, setMockPhoto] = useState('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=400');
  
  // Canvas Signature Reference
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch all active assignments for the staff member
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['staffActiveAssignments', staff?.id],
    queryFn: () => Assignment.list(),
    select: (list) => list.filter(a => a.agentId === staff?.id && ['accepted', 'picked up', 'out for delivery'].includes(a.status?.toLowerCase())),
    enabled: !!staff?.id
  });

  // Fetch all orders
  const { data: orders = [] } = useQuery({
    queryKey: ['staffOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  // Get active order details
  const activeDeliveries = assignments.map(asg => {
    const order = orders.find(o => o.id === asg.orderId);
    return { 
      ...asg, 
      orderDetails: order || {
        id: asg.orderId,
        customer_name: 'St. Jude Healthcare Hyderabad',
        customer_phone: '+91 98765 43210',
        delivery_address: 'Hospital Receiving Ward, Hyderabad'
      }
    };
  });

  const outForDeliveryOrder = activeDeliveries.find(d => d.status?.toLowerCase() === 'out for delivery');

  // Relative time counter updater
  useEffect(() => {
    if (!lastSyncTime) {
      setRelativeTimeStr('N/A');
      return;
    }
    const updateRelative = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - new Date(lastSyncTime).getTime()) / 1000));
      if (diffSecs < 3) setRelativeTimeStr('Just now');
      else if (diffSecs < 60) setRelativeTimeStr(`${diffSecs} seconds ago`);
      else setRelativeTimeStr(`${Math.floor(diffSecs / 60)}m ago`);
    };
    updateRelative();
    const interval = setInterval(updateRelative, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Throttled sync to Supabase live_locations
  const syncLocationToSupabase = async (lat, lng, accuracy, speed, heading, currentOrderId, force = false) => {
    if (!staff?.id) return;
    const now = Date.now();
    const last = lastWrittenPosRef.current;
    
    let shouldWrite = force;
    if (!shouldWrite) {
      const elapsedMs = now - last.time;
      if (elapsedMs >= 3000) {
        shouldWrite = true;
      } else if (last.lat != null && last.lng != null) {
        const movedMeters = calculateDistanceMeters(last.lat, last.lng, lat, lng);
        if (movedMeters >= 5) {
          shouldWrite = true;
        }
      }
    }

    if (shouldWrite) {
      try {
        lastWrittenPosRef.current = { lat, lng, time: now };
        await LiveLocation.update(staff.id, lat, lng, {
          orderId: currentOrderId || null,
          accuracy: accuracy != null ? Math.round(accuracy) : null,
          speed: speed != null ? Math.round(speed * 3.6 * 10) / 10 : null, // m/s to km/h
          heading: heading != null ? Math.round(heading) : null,
          status: 'Moving'
        });
        setLastSyncTime(new Date().toISOString());
      } catch (err) {
        console.error('Failed to sync live location:', err);
      }
    }
  };

  // Start Real Browser/Device GPS Tracking via navigator.geolocation.watchPosition
  const startLiveGpsTracking = (orderId = null) => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      toast.error('Geolocation is not supported on this device/browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsError(null);
    setIsTracking(true);
    toast.success('Live GPS tracking started. Broadcasting location.');

    const activeOrderForGps = orderId || outForDeliveryOrder?.orderId || null;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const coordsObj = {
          latitude,
          longitude,
          accuracy,
          speed: speed != null ? Math.max(0, speed) : null,
          heading: heading != null ? heading : null,
          timestamp: position.timestamp
        };
        setGpsCoords(coordsObj);
        setGpsError(null);

        syncLocationToSupabase(latitude, longitude, accuracy, speed, heading, activeOrderForGps);
      },
      (error) => {
        console.error('GPS Watch error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          const msg = 'Location permission is required for live delivery tracking. Please enable permissions in your browser/device settings.';
          setGpsError(msg);
          toast.error(msg);
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          const msg = 'Unable to determine your current location. Please check device location settings.';
          setGpsError(msg);
          toast.error(msg);
        } else if (error.code === error.TIMEOUT) {
          setGpsError('GPS location request timed out. Retrying...');
        } else {
          setGpsError(error.message || 'GPS location error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );

    watchIdRef.current = id;
  };

  // Stop GPS Tracking
  const stopLiveGpsTracking = async (markStatus = 'Idle') => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    if (staff?.id && gpsCoords) {
      try {
        await LiveLocation.update(staff.id, gpsCoords.latitude, gpsCoords.longitude, {
          orderId: null,
          accuracy: gpsCoords.accuracy ? Math.round(gpsCoords.accuracy) : null,
          speed: 0,
          heading: gpsCoords.heading,
          status: markStatus
        });
      } catch (e) {
        console.error('Error marking status on stop:', e);
      }
    }
    toast.info('Live GPS tracking stopped.');
  };

  // Status transition mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }) => Assignment.updateStatus(orderId, nextStatus),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffActiveAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['staffAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success(`Delivery status updated to: ${variables.nextStatus}`);

      // If transitioning to Out for Delivery, start GPS tracking automatically
      if (variables.nextStatus === 'Out For Delivery') {
        startLiveGpsTracking(variables.orderId);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update status.');
    }
  });

  // Delivery Handoff Complete Mutation
  const completeMutation = useMutation({
    mutationFn: ({ orderId, notes, signature, photo }) => 
      Assignment.updateStatus(orderId, 'Delivered', { notes, signature, photo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffActiveAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['staffAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['staffCompleted'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success(`Order #${variables.orderId.toUpperCase()} delivered and signed!`);
      
      // Automatically stop GPS tracking when delivered
      if (activeDeliveries.length <= 1) {
        stopLiveGpsTracking('Idle');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to complete delivery.');
    }
  });

  // Delivery Handoff Failure Mutation
  const failMutation = useMutation({
    mutationFn: ({ orderId, notes }) => 
      Assignment.updateStatus(orderId, 'Unable To Deliver', { notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffActiveAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['staffAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.error(`Order #${variables.orderId.toUpperCase()} marked as: Unable To Deliver`);
      
      if (activeDeliveries.length <= 1) {
        stopLiveGpsTracking('Idle');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to report dispatch issue.');
    }
  });

  // Auto-prompt GPS when order is Out for Delivery
  useEffect(() => {
    if (outForDeliveryOrder && !isTracking && watchIdRef.current === null) {
      startLiveGpsTracking(outForDeliveryOrder.orderId);
    }
  }, [outForDeliveryOrder]);

  // Clean GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Canvas Handover Signature functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleCompleteHandover = () => {
    if (!handoverName.trim()) {
      toast.warning('Please enter receiver name.');
      return;
    }
    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL() : 'Signed (simulated text)';
    
    completeMutation.mutate({
      orderId: handoverOrder.orderId || handoverOrder.id,
      notes: `Received by: ${handoverName.trim()}. Notes: ${handoverNotes.trim()}`,
      signature: signatureData,
      photo: mockPhoto
    });

    setHandoverOrder(null);
    setHandoverNotes('');
    setHandoverName('');
    clearCanvas();
  };

  const handleFailHandover = () => {
    if (!unableReason.trim()) {
      toast.warning('Please enter reason for delivery failure.');
      return;
    }
    failMutation.mutate({
      orderId: unableOrder.orderId || unableOrder.id,
      notes: unableReason.trim()
    });
    setUnableOrder(null);
    setUnableReason('');
  };

  // Speed in km/h
  const speedKmh = gpsCoords?.speed != null ? (gpsCoords.speed * 3.6).toFixed(1) : '0';
  const accuracyStr = gpsCoords?.accuracy != null ? `±${Math.round(gpsCoords.accuracy)} m` : 'Detecting...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Active Deliveries</h1>
          <p className="text-xs text-muted mt-1">Live GPS telemetry, assigned hospital route dispatches, and electronic proof of delivery.</p>
        </div>
      </div>

      {/* GPS Permission Warning if Denied */}
      {gpsError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <div className="font-bold text-amber-800">GPS Telemetry Notification</div>
            <div className="text-amber-700 mt-0.5">{gpsError}</div>
          </div>
        </div>
      )}

      {/* Mobile Live Tracking Telemetry HUD */}
      <div className="glass bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          
          {/* Tracking Status Badge */}
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isTracking ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <Radio size={22} className={isTracking ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Tracking HUD</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isTracking ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                {gpsCoords 
                  ? `Position: ${gpsCoords.latitude.toFixed(5)}, ${gpsCoords.longitude.toFixed(5)}` 
                  : 'Awaiting device GPS fix...'}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {isTracking ? (
              <button
                onClick={() => stopLiveGpsTracking('Idle')}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 text-rose-600 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Square size={14} /> Stop Tracking
              </button>
            ) : (
              <button
                onClick={() => startLiveGpsTracking()}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Play size={14} /> Start Live Tracking
              </button>
            )}
          </div>
        </div>

        {/* Real GPS Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">GPS Accuracy</span>
            <span className="text-xs font-black text-slate-800">{accuracyStr}</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Live Speed</span>
            <span className="text-xs font-black text-slate-800">{speedKmh} km/h</span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Heading / Heading</span>
            <span className="text-xs font-black text-slate-800">
              {gpsCoords?.heading != null ? `${Math.round(gpsCoords.heading)}°` : 'N/A'}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Last Synced</span>
            <span className="text-xs font-black text-slate-800">{relativeTimeStr}</span>
          </div>
        </div>
      </div>

      {/* Route Dispatches List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Assigned Route Dispatches</h2>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : activeDeliveries.length === 0 ? (
          <div className="glass bg-white border border-slate-100 p-8 rounded-3xl text-center text-xs text-slate-400">
            No active dispatches right now. Go to the Assigned Board to accept new orders.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDeliveries.map(del => {
              const order = del.orderDetails;
              const shortId = order.id ? order.id.toUpperCase() : 'N/A';

              return (
                <div key={del.id} className="glass bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-black text-indigo-700 font-mono">
                        # {shortId}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                        Priority: {del.priority || 'Normal'}
                      </span>
                    </div>
                    <span className={`font-extrabold text-[10px] uppercase rounded-lg px-2.5 py-1 ${
                      del.status === 'Out For Delivery' 
                        ? 'bg-teal-50 text-teal-700 border border-teal-200 animate-pulse'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      {del.status}
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="space-y-2 leading-relaxed">
                    <div className="font-bold text-slate-900 text-sm">{order.customer_name}</div>
                    <div className="text-slate-500 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <span className="font-semibold">{order.customer_phone}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stepper Actions */}
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Update Dispatch Status</span>
                    
                    {del.status === 'Accepted' && (
                      <button
                        onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: 'Picked Up' })}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Mark Picked Up from Store
                      </button>
                    )}

                    {del.status === 'Picked Up' && (
                      <button
                        onClick={() => statusMutation.mutate({ orderId: order.id, nextStatus: 'Out For Delivery' })}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm animate-pulse"
                      >
                        <Navigation size={14} /> Start Dispatch: Out For Delivery
                      </button>
                    )}

                    {del.status === 'Out For Delivery' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setUnableOrder(order)}
                          className="py-2.5 px-3 border border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all text-[11px] font-bold rounded-xl shadow-sm cursor-pointer"
                        >
                          Failed Delivery
                        </button>
                        <button
                          onClick={() => setHandoverOrder(order)}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check size={14} /> Handover & Sign
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Handover Complete Modal */}
      <AnimatePresence>
        {handoverOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setHandoverOrder(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:w-[500px] md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl z-50 p-6 shadow-2xl flex flex-col justify-between border border-slate-100 text-slate-800"
            >
              <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-left">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900">Hospital Delivery Handover</h3>
                    <span className="text-[10px] text-slate-400 block font-mono">ORDER ID: {handoverOrder.id.toUpperCase()}</span>
                  </div>
                  <button onClick={() => setHandoverOrder(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1.5">Received By Representative</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter representative name (e.g. Dr. Satish)"
                      value={handoverName}
                      onChange={(e) => setHandoverName(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1.5">Hospital Delivery Photo (Proof of Delivery)</label>
                    <select
                      value={mockPhoto}
                      onChange={(e) => setMockPhoto(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                    >
                      <option value="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=400">Standard Handshake Handoff</option>
                      <option value="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400">Cartons in hospital storage ward</option>
                      <option value="https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400">Deliveries at reception desk</option>
                    </select>
                    <img src={mockPhoto} alt="Proof of Handoff" className="mt-2.5 w-full h-32 rounded-xl object-cover border border-slate-100 shadow-sm" />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1 flex justify-between">
                      <span>Draw Signature</span>
                      <button onClick={clearCanvas} className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded">Clear signature</button>
                    </label>
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={100}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl cursor-crosshair h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1.5">Delivery Handoff Remarks</label>
                    <textarea
                      placeholder="Add delivery logs notes (optional)"
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none h-16 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end gap-2.5">
                <button
                  onClick={() => setHandoverOrder(null)}
                  className="py-2 px-4 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteHandover}
                  disabled={completeMutation.isPending}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  Confirm Delivered & Archive
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delivery Fail Modal */}
      <AnimatePresence>
        {unableOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setUnableOrder(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-3xl z-50 p-6 shadow-2xl flex flex-col justify-between border border-slate-100 text-slate-800"
            >
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900">Failed Handoff Report</h3>
                    <span className="text-[10px] text-slate-400 block font-mono">ORDER ID: {unableOrder.id.toUpperCase()}</span>
                  </div>
                  <button onClick={() => setUnableOrder(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1.5">Reason for Delivery Failure</label>
                    <textarea
                      required
                      placeholder="Please document why this order cannot be delivered"
                      value={unableReason}
                      onChange={(e) => setUnableReason(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end gap-2.5">
                <button
                  onClick={() => setUnableOrder(null)}
                  className="py-2 px-4 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFailHandover}
                  disabled={failMutation.isPending}
                  className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Submit Issue Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
