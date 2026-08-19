import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DeliveryAgent, LiveLocation, Assignment, Order } from '../../services/api';
import { loadGoogleMapsScript } from '../../lib/googleMaps';
import { dbEvents } from '../../services/db';
import { 
  Compass, Users, MapPin, Phone, Truck, Clock, Eye, AlertTriangle, 
  Loader2, Navigation, Maximize2, Crosshair, Radio, Search, Filter, ShieldCheck,
  Layers, Key, Settings, Check, ExternalLink, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  if (diffSecs <= 120 && status !== 'Offline') {
    return { state: 'LIVE', label: status === 'Moving' ? 'Moving' : 'Idle', color: status === 'Moving' ? 'indigo' : 'emerald', relative };
  } else if (diffSecs <= 600) {
    return { state: 'STALE', label: `Stale (${relative})`, color: 'amber', relative: `Last seen ${relative}` };
  } else {
    return { state: 'OFFLINE', label: `Offline (${relative})`, color: 'slate', relative: `Last seen ${relative}` };
  }
}

// Custom Leaflet DivIcon with pulsating animations
function createLeafletMarkerIcon(state, color, isMoving) {
  const fillColor = isMoving ? '#4F46E5' : color === 'emerald' ? '#059669' : color === 'amber' ? '#D97706' : '#64748B';
  const pulseRing = isMoving ? `
    <div style="
      position: absolute;
      top: -6px;
      left: -6px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: rgba(79, 70, 229, 0.25);
      animation: leaflet-marker-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      pointer-events: none;
      z-index: 1;
    "></div>
  ` : '';

  return L.divIcon({
    className: 'custom-fleet-leaflet-icon',
    html: `
      <div style="position: relative; width: 36px; height: 46px; display: flex; align-items: center; justify-content: center;">
        ${pulseRing}
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); position: relative; z-index: 2;">
          <path d="M18 0 C8 0 0 8 0 18 C0 28 18 46 18 46 C18 46 36 28 36 18 C36 8 28 0 18 0 Z" fill="${fillColor}" stroke="#FFFFFF" stroke-width="2.5"/>
          <circle cx="18" cy="18" r="7" fill="#FFFFFF"/>
          <circle cx="18" cy="18" r="4" fill="${fillColor}"/>
        </svg>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -44]
  });
}

// Custom Google Maps Icon
function createGoogleMarkerIcon(google, state, color) {
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
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL'); // ALL, MOVING, IDLE, STALE
  
  // Map Engine Provider: 'osm' (OpenStreetMap/Leaflet) or 'google' (Google Maps)
  const envGoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const storedGoogleKey = localStorage.getItem('nab_google_maps_api_key') || '';
  const hasGoogleKey = Boolean(envGoogleKey || storedGoogleKey);
  
  const [mapProvider, setMapProvider] = useState(() => {
    const saved = localStorage.getItem('nab_preferred_map_provider');
    return saved === 'google' && hasGoogleKey ? 'google' : 'osm';
  });

  const [customKeyInput, setCustomKeyInput] = useState(storedGoogleKey || envGoogleKey);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef({});
  const googleMapRef = useRef(null);
  const googleMarkersRef = useRef({});
  const googleInfoWindowRef = useRef(null);
  const hasAutoCenteredRef = useRef(false);

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

  // Poll live locations every 2.5s as background heartbeat
  const { data: queryLocations = [], refetch: refetchLocations } = useQuery({
    queryKey: ['adminLiveLocations'],
    queryFn: () => LiveLocation.list(),
    refetchInterval: 2500,
    staleTime: 1000
  });

  useEffect(() => {
    if (queryLocations && queryLocations.length > 0) {
      setLiveLocations(queryLocations);
    }
  }, [queryLocations]);

  // Instant local multi-tab sync via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    
    const bc = new BroadcastChannel('nab_live_telemetry');
    bc.onmessage = (event) => {
      if (event.data?.type === 'LOCATION_UPDATE' && event.data?.payload) {
        const payload = event.data.payload;
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
      }
    };

    return () => bc.close();
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

  // Combine agents, location coordinates, assignments, and orders
  const trackingData = useMemo(() => {
    return agents.map((agent, index) => {
      const loc = liveLocations.find(l => l.agentId === agent.id);
      const activeAsg = assignments.find(
        a => a.agentId === agent.id && ['Accepted', 'Picked Up', 'Out For Delivery'].includes(a.status)
      );
      const matchedOrder = activeAsg ? orders.find(o => o.id === activeAsg.orderId) : null;
      const liveness = computeAgentLiveness(loc?.updatedAt || loc?.lastUpdated, loc?.status);

      // Default fallback coordinates in Hyderabad if no location record exists
      const fallbackLat = 17.3850 + ((index % 4) * 0.025) - 0.03;
      const fallbackLng = 78.4867 + ((index % 3) * 0.025) - 0.02;

      const latitude = loc?.latitude != null && !isNaN(loc.latitude) ? loc.latitude : fallbackLat;
      const longitude = loc?.longitude != null && !isNaN(loc.longitude) ? loc.longitude : fallbackLng;

      return {
        ...agent,
        location: loc ? { ...loc, latitude, longitude } : { latitude, longitude, speed: 0, accuracy: 15, status: 'Idle', updatedAt: null },
        activeOrder: matchedOrder,
        activeAsg,
        liveness
      };
    });
  }, [agents, liveLocations, assignments, orders]);

  // Open popup HTML generator
  const getPopupContent = (agentItem) => {
    const loc = agentItem.location;
    const order = agentItem.activeOrder;
    const speedStr = loc?.speed != null ? `${loc.speed} km/h` : '0 km/h';
    const accuracyStr = loc?.accuracy != null ? `±${loc.accuracy} m` : 'N/A';

    return `
      <div style="font-family: 'Inter', system-ui, sans-serif; padding: 4px; min-width: 230px; max-width: 270px; color: #0F172A; text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
          <img src="${agentItem.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}" 
               style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #E2E8F0;" />
          <div>
            <strong style="font-size: 13px; display: block; line-height: 1.2; color: #0F172A;">${agentItem.fullName}</strong>
            <span style="font-size: 10px; color: #64748B; font-family: monospace;">EMP: ${agentItem.employeeId || 'N/A'}</span>
          </div>
        </div>

        <div style="font-size: 11px; line-height: 1.5; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748B;">Status:</span>
            <strong style="color: ${agentItem.liveness.color === 'indigo' ? '#4F46E5' : agentItem.liveness.color === 'emerald' ? '#059669' : '#D97706'};">${agentItem.liveness.label}</strong>
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
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 7px; font-size: 10px;">
            <strong style="color: #4338CA; display: block; margin-bottom: 2px;">Order: #${order.id.toUpperCase()}</strong>
            <div style="color: #334155; font-weight: 500;">${order.customer_name}</div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Initialize and manage maps (Leaflet / Google Maps)
  useEffect(() => {
    let isMounted = true;
    setMapLoaded(false);
    setGoogleMapsError(null);

    // Clean up any existing instances
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      leafletMarkersRef.current = {};
    }
    if (googleMapRef.current) {
      googleMapRef.current = null;
      googleMarkersRef.current = {};
    }

    if (!mapContainerRef.current) return;

    if (mapProvider === 'osm') {
      // Leaflet / OpenStreetMap Initialization
      try {
        const map = L.map(mapContainerRef.current, {
          center: [17.5396, 78.9161],
          zoom: 13,
          zoomControl: false,
          attributionControl: false
        });

        // Add CartoDB Voyager tiles (crisp, beautiful, modern tiles)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        leafletMapRef.current = map;
        setMapLoaded(true);

        // Force resize calculation
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 200);
      } catch (err) {
        console.error('Leaflet initialization error:', err);
      }
    } else if (mapProvider === 'google') {
      // Google Maps Initialization
      async function initGoogleMap() {
        try {
          const key = localStorage.getItem('nab_google_maps_api_key') || envGoogleKey;
          const googleMaps = await loadGoogleMapsScript(key);
          if (!isMounted || !mapContainerRef.current) return;

          const defaultCenter = { lat: 17.5396, lng: 78.9161 };
          const map = new googleMaps.Map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 13,
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

          googleMapRef.current = map;
          googleInfoWindowRef.current = new googleMaps.InfoWindow();
          setMapLoaded(true);
        } catch (err) {
          console.warn('Google Maps loader note:', err.message);
          if (isMounted) {
            setGoogleMapsError(err.message);
            toast.error('Google Maps key not configured or invalid. Switched to OpenStreetMap.');
            setMapProvider('osm');
          }
        }
      }

      initGoogleMap();
    }

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapProvider]);

  // Synchronize Markers on location or agent updates
  useEffect(() => {
    if (!mapLoaded) return;

    if (mapProvider === 'osm' && leafletMapRef.current) {
      const map = leafletMapRef.current;
      const currentMarkers = leafletMarkersRef.current;

      trackingData.forEach(item => {
        const loc = item.location;
        if (!loc || loc.latitude == null || loc.longitude == null) return;

        const isMoving = item.liveness.state === 'LIVE' && item.liveness.color === 'indigo';
        const icon = createLeafletMarkerIcon(item.liveness.state, item.liveness.color, isMoving);
        const popupHtml = getPopupContent(item);

        if (currentMarkers[item.id]) {
          // Update existing marker position smoothly
          currentMarkers[item.id].setLatLng([loc.latitude, loc.longitude]);
          currentMarkers[item.id].setIcon(icon);
          currentMarkers[item.id].setPopupContent(popupHtml);
        } else {
          // Create new Leaflet marker
          const marker = L.marker([loc.latitude, loc.longitude], { icon })
            .addTo(map)
            .bindPopup(popupHtml, { maxWidth: 280, className: 'fleet-custom-popup' });

          marker.on('click', () => {
            setSelectedAgentId(item.id);
          });

          currentMarkers[item.id] = marker;
        }
      });
    } else if (mapProvider === 'google' && googleMapRef.current && window.google) {
      const google = window.google;
      const map = googleMapRef.current;
      const currentMarkers = googleMarkersRef.current;

      trackingData.forEach(item => {
        const loc = item.location;
        if (!loc || loc.latitude == null || loc.longitude == null) return;

        const position = new google.maps.LatLng(loc.latitude, loc.longitude);
        const icon = createGoogleMarkerIcon(google, item.liveness.state, item.liveness.color);

        if (currentMarkers[item.id]) {
          currentMarkers[item.id].setPosition(position);
          currentMarkers[item.id].setIcon(icon);
        } else {
          const marker = new google.maps.Marker({
            position,
            map,
            title: item.fullName,
            icon,
            animation: item.liveness.state === 'LIVE' ? google.maps.Animation.DROP : null
          });

          marker.addListener('click', () => {
            setSelectedAgentId(item.id);
            if (googleInfoWindowRef.current) {
              googleInfoWindowRef.current.setContent(getPopupContent(item));
              googleInfoWindowRef.current.open(map, marker);
            }
          });

          currentMarkers[item.id] = marker;
        }
      });
    }
  }, [trackingData, mapLoaded, mapProvider]);

  // Center map on specific agent
  const handleCenterOnAgent = (agentId) => {
    setSelectedAgentId(agentId);
    const item = trackingData.find(a => a.id === agentId);
    const loc = item?.location;

    if (!loc) return;

    if (mapProvider === 'osm' && leafletMapRef.current) {
      leafletMapRef.current.flyTo([loc.latitude, loc.longitude], 15, { duration: 0.8 });
      const marker = leafletMarkersRef.current[agentId];
      if (marker) {
        marker.openPopup();
      }
    } else if (mapProvider === 'google' && googleMapRef.current && window.google) {
      const pos = new window.google.maps.LatLng(loc.latitude, loc.longitude);
      googleMapRef.current.panTo(pos);
      googleMapRef.current.setZoom(15);
      const marker = googleMarkersRef.current[agentId];
      if (marker && googleInfoWindowRef.current) {
        googleInfoWindowRef.current.setContent(getPopupContent(item));
        googleInfoWindowRef.current.open(googleMapRef.current, marker);
      }
    }
  };

  // Fit all active agents on the map view
  const handleFitAllActiveAgents = () => {
    if (mapProvider === 'osm' && leafletMapRef.current) {
      const coords = trackingData
        .filter(item => item.location?.latitude != null && item.location?.longitude != null)
        .map(item => [item.location.latitude, item.location.longitude]);

      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else if (mapProvider === 'google' && googleMapRef.current && window.google) {
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
        googleMapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    }
  };

  // Auto center on first load once coordinates are available
  useEffect(() => {
    if (mapLoaded && !hasAutoCenteredRef.current && trackingData.length > 0) {
      const activeLocs = trackingData.filter(i => i.location?.latitude != null);
      if (activeLocs.length > 0) {
        hasAutoCenteredRef.current = true;
        setTimeout(() => {
          handleFitAllActiveAgents();
        }, 300);
      }
    }
  }, [mapLoaded, trackingData]);

  // Save custom Google Maps API Key
  const handleSaveCustomKey = (e) => {
    e.preventDefault();
    if (!customKeyInput.trim()) {
      localStorage.removeItem('nab_google_maps_api_key');
      toast.info('Custom Google Maps API key removed');
    } else {
      localStorage.setItem('nab_google_maps_api_key', customKeyInput.trim());
      localStorage.setItem('nab_preferred_map_provider', 'google');
      setMapProvider('google');
      toast.success('Google Maps API key saved! Loading Google Map...');
    }
    setShowKeyModal(false);
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
      {/* Keyframe animation style for marker pulsating rings */}
      <style>{`
        @keyframes leaflet-marker-pulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 6px !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Live Fleet GPS Tracking</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Realtime Active
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Live tracking and telemetry of moving delivery units on interactive maps.</p>
        </div>

        {/* Global Map Controls & Provider Switcher */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Map Provider Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
            <button
              onClick={() => {
                setMapProvider('osm');
                localStorage.setItem('nab_preferred_map_provider', 'osm');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mapProvider === 'osm' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={13} className="text-primary" /> OpenStreetMap
            </button>
            <button
              onClick={() => {
                const key = localStorage.getItem('nab_google_maps_api_key') || envGoogleKey;
                if (!key) {
                  setShowKeyModal(true);
                } else {
                  setMapProvider('google');
                  localStorage.setItem('nab_preferred_map_provider', 'google');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mapProvider === 'google' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass size={13} className={mapProvider === 'google' ? 'text-indigo-600' : 'text-slate-400'} /> Google Maps
            </button>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure Google Maps API Key"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <Key size={14} />
          </button>

          <button
            onClick={() => refetchLocations()}
            title="Force refresh live locations"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <RefreshCw size={14} />
          </button>

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

      {/* Main Grid: Sidebar Ledger (1 Col) + Interactive Map (3 Cols) */}
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

        {/* Map Container & Detail Cards (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Map Surface */}
          <div className="glass bg-white border border-slate-100 rounded-3xl p-3 shadow-md overflow-hidden relative">
            {/* Top Telemetry Layer Badge */}
            <div className="absolute top-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md text-white font-mono text-[9px] px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{mapProvider === 'osm' ? 'OPENSTREETMAP LIVE TELEMETRY' : 'GOOGLE MAPS TELEMETRY LAYER'}</span>
            </div>

            {/* Container where Map is mounted */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-[460px] rounded-2xl bg-slate-100 relative z-0" 
              style={{ minHeight: '460px' }}
            />
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

      {/* Google Maps API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-base">Google Maps Configuration</h3>
                    <p className="text-xs text-slate-400">Optional key for Google Maps satellite & vector layer.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-600" /> Zero-Config OpenStreetMap is active!
                </p>
                <p className="text-[11px] text-amber-700">
                  OpenStreetMap / CartoDB tiles are completely free, requires no API key, and works out-of-the-box. Enter a Google Maps API key below only if you prefer Google Maps.
                </p>
              </div>

              <form onSubmit={handleSaveCustomKey} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Google Maps JavaScript API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Alternatively set <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">frontend/.env</code>
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMapProvider('osm');
                      setShowKeyModal(false);
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Use OpenStreetMap
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    Save & Load Google Maps
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
