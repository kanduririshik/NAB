import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DeliveryAgent, LiveLocation, Assignment, Order } from '../../services/api';
import { loadGoogleMapsScript } from '../../lib/googleMaps';
import { dbEvents } from '../../services/db';
import { 
  Compass, Users, MapPin, Phone, Truck, Clock, Eye, AlertTriangle, 
  Loader2, Navigation, Maximize2, Crosshair, Radio, Search, Filter, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to compute state (LIVE, STALE, OFFLINE) based on updated_at
function computeAgentLiveness(updatedAt, status) {
  if (!updatedAt) return { state: 'OFFLINE', label: 'Offline', color: 'slate', relative: 'Never' };
  
  const now = Date.now();
  const diffMs = now - new Date(updatedAt).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  let relative = 'Just now';
  if (diffSecs < 10) relative = 'Just now';
  else if (diffSecs < 60) relative = `${diffSecs}s ago`;
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else relative = `${Math.floor(diffMins / 60)}h ago`;

  if (diffSecs <= 60 && status !== 'Offline') {
    return { state: 'LIVE', label: status === 'Moving' ? 'Moving' : 'Idle', color: status === 'Moving' ? 'indigo' : 'emerald', relative };
  } else if (diffSecs <= 300) {
    return { state: 'STALE', label: `Stale (${relative})`, color: 'amber', relative: `Last seen ${relative}` };
  } else {
    return { state: 'OFFLINE', label: `Offline (${relative})`, color: 'slate', relative: `Last seen ${relative}` };
  }
}

// Custom SVG Pin creator for Google Maps Markers
function createMarkerIcon(google, state, color) {
  const isMoving = state === 'LIVE' && color === 'indigo';
  const fillColor = isMoving ? '#4F46E5' : color === 'emerald' ? '#059669' : color === 'amber' ? '#D97706' : '#64748B';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 0 C8 0 0 8 0 18 C0 28 18 46 18 46 C18 46 36 28 36 18 C36 8 28 0 18 0 Z" fill="${fillColor}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="7" fill="#FFFFFF"/>
      <circle cx="18" cy="18" r="4" fill="${fillColor}"/>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(36, 46),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(18, 46)
  };
}

export default function AdminDeliveryTracking() {
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL'); // ALL, MOVING, IDLE, STALE
  
  // Google Maps State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const infoWindowRef = useRef(null);

  // Fetch agents list
  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: () => DeliveryAgent.list()
  });

  // Fetch active assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: () => Assignment.list()
  });

  // Fetch all orders
  const { data: orders = [] } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  // Fetch initial live locations
  useEffect(() => {
    LiveLocation.list().then(data => {
      setLiveLocations(data || []);
    }).catch(err => {
      console.error('Failed to load initial live locations:', err);
    });
  }, []);

  // Supabase Realtime stream for live location updates
  useEffect(() => {
    const unsub = dbEvents.subscribe('locations_update', (payload) => {
      if (!payload) return;
      
      const incoming = {
        agentId: payload.agent_id,
        orderId: payload.order_id,
        latitude: parseFloat(payload.latitude),
        longitude: parseFloat(payload.longitude),
        accuracy: payload.accuracy != null ? parseFloat(payload.accuracy) : null,
        speed: payload.speed != null ? parseFloat(payload.speed) : null,
        heading: payload.heading != null ? parseFloat(payload.heading) : null,
        status: payload.status,
        updatedAt: payload.updated_at,
        lastUpdated: payload.updated_at
      };

      setLiveLocations(prev => {
        const index = prev.findIndex(l => l.agentId === incoming.agentId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...incoming };
          return next;
        } else {
          return [incoming, ...prev];
        }
      });
    });

    return () => unsub();
  }, []);

  // Initialize Google Maps instance
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        const googleMaps = await loadGoogleMapsScript();
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const defaultCenter = { lat: 17.4129, lng: 78.4729 }; // Hyderabad center
          const map = new googleMaps.Map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 12,
            mapTypeId: 'roadmap',
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            styles: [
              { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
              { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
            ]
          });

          mapInstanceRef.current = map;
          infoWindowRef.current = new googleMaps.InfoWindow();
          setMapLoaded(true);
        }
      } catch (err) {
        console.warn('Google Maps loader note:', err.message);
        if (isMounted) {
          setMapError(err.message);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Combine agents, location coordinates, assignments, and orders
  const trackingData = useMemo(() => {
    return agents.map(agent => {
      const loc = liveLocations.find(l => l.agentId === agent.id);
      const activeAsg = assignments.find(
        a => a.agentId === agent.id && ['Accepted', 'Picked Up', 'Out For Delivery'].includes(a.status)
      );
      const matchedOrder = activeAsg ? orders.find(o => o.id === activeAsg.orderId) : null;
      const liveness = computeAgentLiveness(loc?.updatedAt || loc?.lastUpdated, loc?.status);

      return {
        ...agent,
        location: loc,
        activeOrder: matchedOrder,
        activeAsg,
        liveness
      };
    });
  }, [agents, liveLocations, assignments, orders]);

  // Synchronize Google Map Markers on location updates without page/map reload
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof window.google === 'undefined') return;

    const google = window.google;
    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;

    trackingData.forEach(item => {
      const loc = item.location;
      if (!loc || isNaN(loc.latitude) || isNaN(loc.longitude)) return;

      const position = new google.maps.LatLng(loc.latitude, loc.longitude);
      const icon = createMarkerIcon(google, item.liveness.state, item.liveness.color);

      if (currentMarkers[item.id]) {
        // Update existing marker position smoothly
        currentMarkers[item.id].setPosition(position);
        currentMarkers[item.id].setIcon(icon);
      } else {
        // Create new marker for agent
        const marker = new google.maps.Marker({
          position,
          map,
          title: item.fullName,
          icon,
          animation: item.liveness.state === 'LIVE' ? google.maps.Animation.DROP : null
        });

        marker.addListener('click', () => {
          setSelectedAgentId(item.id);
          openAgentInfoWindow(item, marker);
        });

        currentMarkers[item.id] = marker;
      }
    });
  }, [trackingData, mapLoaded]);

  // Open InfoWindow for selected agent
  const openAgentInfoWindow = (agentItem, marker) => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;

    const loc = agentItem.location;
    const order = agentItem.activeOrder;
    const speedStr = loc?.speed != null ? `${loc.speed} km/h` : '0 km/h';
    const accuracyStr = loc?.accuracy != null ? `±${loc.accuracy} m` : 'N/A';

    const contentHtml = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 6px; max-width: 260px; color: #0F172A; text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
          <img src="${agentItem.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}" 
               style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #CBD5E1;" />
          <div>
            <strong style="font-size: 13px; display: block; line-height: 1.2;">${agentItem.fullName}</strong>
            <span style="font-size: 10px; color: #64748B; font-family: monospace;">EMP: ${agentItem.employeeId || 'N/A'}</span>
          </div>
        </div>

        <div style="font-size: 11px; line-height: 1.5; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748B;">Status:</span>
            <strong style="color: ${agentItem.liveness.color === 'indigo' ? '#4F46E5' : '#059669'};">${agentItem.liveness.label}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748B;">Speed:</span>
            <strong>${speedStr}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748B;">GPS Accuracy:</span>
            <strong>${accuracyStr}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748B;">Last Seen:</span>
            <span style="color: #64748B;">${agentItem.liveness.relative}</span>
          </div>
        </div>

        ${order ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; font-size: 10px;">
            <strong style="color: #4338CA; display: block; margin-bottom: 2px;">Order: #${order.id.toUpperCase()}</strong>
            <div style="color: #334155;">${order.customer_name}</div>
          </div>
        ` : ''}
      </div>
    `;

    infoWindowRef.current.setContent(contentHtml);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  // Center map on specific agent
  const handleCenterOnAgent = (agentId) => {
    setSelectedAgentId(agentId);
    const item = trackingData.find(a => a.id === agentId);
    const loc = item?.location;

    if (loc && mapInstanceRef.current && window.google) {
      const pos = new window.google.maps.LatLng(loc.latitude, loc.longitude);
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(15);

      const marker = markersRef.current[agentId];
      if (marker) {
        openAgentInfoWindow(item, marker);
      }
    }
  };

  // Fit all active agents on the map view
  const handleFitAllActiveAgents = () => {
    if (!mapInstanceRef.current || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    trackingData.forEach(item => {
      const loc = item.location;
      if (loc && !isNaN(loc.latitude) && !isNaN(loc.longitude)) {
        bounds.extend(new window.google.maps.LatLng(loc.latitude, loc.longitude));
        hasCoords = true;
      }
    });

    if (hasCoords) {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  };

  // Filtered agent list
  const filteredAgents = trackingData.filter(item => {
    const matchesSearch = 
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.activeOrder?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === 'MOVING') return item.liveness.state === 'LIVE' && item.location?.status === 'Moving';
    if (filterState === 'IDLE') return item.liveness.state === 'LIVE' && item.location?.status !== 'Moving';
    if (filterState === 'STALE') return item.liveness.state === 'STALE' || item.liveness.state === 'OFFLINE';
    return true;
  });

  const selectedAgent = trackingData.find(a => a.id === selectedAgentId);

  // Fleet Statistics
  const totalAgents = trackingData.length;
  const movingCount = trackingData.filter(a => a.liveness.state === 'LIVE' && a.location?.status === 'Moving').length;
  const idleCount = trackingData.filter(a => a.liveness.state === 'LIVE' && a.location?.status !== 'Moving').length;
  const staleCount = trackingData.filter(a => a.liveness.state === 'STALE' || a.liveness.state === 'OFFLINE').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Live Fleet GPS Tracking</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Realtime Active
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Live tracking and telemetry of moving delivery units on Google Maps.</p>
        </div>

        {/* Global Map Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFitAllActiveAgents}
            className="py-2 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Maximize2 size={14} /> Fit All Active Agents
          </button>
        </div>
      </div>

      {/* Fleet Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fleet</div>
            <div className="text-xl font-black text-slate-900">{totalAgents}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Moving</div>
            <div className="text-xl font-black text-indigo-600">{movingCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Navigation size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Idle / Stopped</div>
            <div className="text-xl font-black text-emerald-600">{idleCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Stale / Offline</div>
            <div className="text-xl font-black text-amber-600">{staleCount}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Ledger (1 Col) + Google Map (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Fleet Sidebar */}
        <div className="glass bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 max-h-[640px] flex flex-col">
          <div className="space-y-3 border-b border-slate-100 pb-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Users size={16} className="text-primary" /> Delivery Units
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{filteredAgents.length} shown</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search agent or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1">
              {['ALL', 'MOVING', 'IDLE', 'STALE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterState(f)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                    filterState === f 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Items */}
          <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
            {loadingAgents ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">No agents match selected filters.</div>
            ) : (
              filteredAgents.map(item => {
                const isSelected = selectedAgentId === item.id;
                const speed = item.location?.speed != null ? `${item.location.speed} km/h` : '0 km/h';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleCenterOnAgent(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20' 
                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={item.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} 
                          alt={item.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-slate-900 truncate max-w-[100px]">{item.fullName}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.liveness.color === 'indigo'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                          : item.liveness.color === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.liveness.color === 'amber'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {item.liveness.label}
                      </span>
                    </div>

                    <div className="mt-2.5 text-slate-500 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400">{item.vehicleNumber}</span>
                        <span className="font-bold text-slate-700">{speed}</span>
                      </div>
                      {item.activeOrder && (
                        <div className="font-bold text-[10px] text-indigo-600 truncate mt-1">
                          Delivery: #{item.activeOrder.id.toUpperCase()} ({item.activeOrder.customer_name})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Google Map Container & Detail Cards (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Map Surface */}
          <div className="glass bg-white border border-slate-100 rounded-3xl p-3 shadow-md overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10 bg-slate-900/90 text-white font-mono text-[9px] px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-1.5">
              <Compass size={12} className="animate-spin text-primary" /> GOOGLE MAPS TELEMETRY LAYER
            </div>

            {/* Container where Google Maps is mounted */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-[450px] rounded-2xl bg-slate-100 relative" 
              style={{ minHeight: '450px' }}
            />

            {/* API Key Guide Overlay if Google Maps is unable to load */}
            {mapError && (
              <div className="absolute inset-4 rounded-2xl bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center z-20 space-y-4">
                <AlertTriangle size={36} className="text-amber-400" />
                <div className="max-w-md space-y-2">
                  <h4 className="text-base font-bold font-display">Google Maps API Configuration</h4>
                  <p className="text-xs text-slate-300">
                    To enable the interactive Google Map, configure <code className="bg-slate-800 text-primary-300 px-1.5 py-0.5 rounded font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">frontend/.env</code>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    HTTP Referrer restriction for development: <code className="text-slate-300">http://localhost:5173/*</code>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Agent Card Details */}
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-xs grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
            >
              {/* Agent Profile */}
              <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                <img
                  src={selectedAgent.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={selectedAgent.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm flex-shrink-0"
                />
                <div className="space-y-1 truncate">
                  <h4 className="text-sm font-black text-slate-900 leading-snug">{selectedAgent.fullName}</h4>
                  <span className="font-mono text-slate-400 text-[10px] block">EMP ID: {selectedAgent.employeeId}</span>
                  <span className="text-slate-500 font-semibold">{selectedAgent.phone}</span>
                </div>
              </div>

              {/* Vehicle & Telemetry */}
              <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 leading-relaxed">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Live Vehicle Telemetry</span>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-800">{selectedAgent.vehicleType}</div>
                    <div className="font-mono font-bold text-slate-400 text-[10px]">{selectedAgent.vehicleNumber}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span>Speed: {selectedAgent.location?.speed != null ? `${selectedAgent.location.speed} km/h` : '0 km/h'}</span>
                  <span>Accuracy: {selectedAgent.location?.accuracy != null ? `±${selectedAgent.location.accuracy}m` : 'N/A'}</span>
                </div>
              </div>

              {/* Active Order Dispatch */}
              <div className="space-y-2 leading-relaxed">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Active Order Dispatch</span>
                {selectedAgent.activeOrder ? (
                  <div className="space-y-1.5">
                    <div className="font-bold text-indigo-700">#{selectedAgent.activeOrder.id.toUpperCase()} — {selectedAgent.activeOrder.customer_name}</div>
                    <div className="text-slate-500 flex items-start gap-1">
                      <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{selectedAgent.activeOrder.delivery_address}</span>
                    </div>
                    <span className="inline-block mt-1 font-extrabold text-[9px] uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      Status: {selectedAgent.activeAsg?.status}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-2 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-slate-300" /> Idle — No active dispatch order.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
