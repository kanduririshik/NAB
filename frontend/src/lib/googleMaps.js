// Google Maps JavaScript API Loader & Utilities

let loadPromise = null;

export function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  
  // If already loaded and ready
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) return loadPromise;

  const key = apiKey || localStorage.getItem('nab_google_maps_api_key') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured in .env or custom settings'));
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById('nab-google-maps-script');
    if (existingScript) {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    window.__nabInitGoogleMaps = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script loaded but google.maps is undefined'));
      }
    };

    const script = document.createElement('script');
    script.id = 'nab-google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,geometry,marker&callback=__nabInitGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps JavaScript API. Please check your API key and network connection.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

// Distance calculation between two lat/lng coordinates (in meters)
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
