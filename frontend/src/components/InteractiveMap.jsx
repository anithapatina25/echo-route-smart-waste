import React, { useEffect, useRef, useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Compass, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Info,
  Warehouse,
  Flag
} from 'lucide-react';

/**
 * ECHO ROUTE SMART WASTE - INTERACTIVE CIVIC MAP
 * Supports Leaflet / OpenStreetMap with resilient SVG Vector GIS fallback.
 * Strictly displays Prototype GPS / Simulated Location transparency labels.
 */
export function InteractiveMap({
  center = [28.5355, 77.3910],
  zoom = 14,
  markers = [],
  polylines = [],
  height = '420px',
  showLegend = true,
  prototypeNotice = 'Prototype GPS / Simulated Location: Location shown is simulated for demonstration and not live satellite telemetry.',
  onMarkerClick
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Dynamic Leaflet Loader
  useEffect(() => {
    let isMounted = true;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet Script
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (isMounted) setLeafletLoaded(true);
      };
      script.onerror = () => {
        if (isMounted) setLeafletError(true);
      };
      document.body.appendChild(script);
    } else {
      const checkL = setInterval(() => {
        if (window.L) {
          clearInterval(checkL);
          if (isMounted) setLeafletLoaded(true);
        }
      }, 100);
      setTimeout(() => clearInterval(checkL), 3000);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapContainerRef.current) return;

    const L = window.L;

    // Clean up previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // Add custom zoom controls at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add markers
      const bounds = [];

      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;
        const pos = [Number(m.lat), Number(m.lng)];
        bounds.push(pos);

        // Marker color and icon based on type
        let bgColor = '#6b21a8';
        let iconSymbol = '📍';
        let label = m.sequence ? `#${m.sequence}` : '';

        if (m.type === 'DEPOT') {
          bgColor = '#1e3a8a';
          iconSymbol = '🏢';
        } else if (m.type === 'DISPOSAL_YARD') {
          bgColor = '#14532d';
          iconSymbol = '♻️';
        } else if (m.type === 'VEHICLE') {
          bgColor = '#16a34a';
          iconSymbol = '🚛';
        } else if (m.type === 'CURRENT_STOP') {
          bgColor = '#dc2626';
          iconSymbol = '🎯';
        } else if (m.type === 'COMPLETED') {
          bgColor = '#15803d';
          iconSymbol = '✓';
        } else {
          bgColor = '#d97706';
          iconSymbol = m.sequence ? `${m.sequence}` : '📍';
        }

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${bgColor};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 13px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              border: 2px solid white;
              cursor: pointer;
            ">
              ${iconSymbol}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const markerObj = L.marker(pos, { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; min-width: 180px; padding: 4px;">
            <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 2px;">
              ${m.title || m.name || 'Location'}
            </strong>
            ${m.subtitle ? `<div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${m.subtitle}</div>` : ''}
            ${m.address ? `<div style="color: #334155; margin-bottom: 4px;">📍 ${m.address}</div>` : ''}
            ${m.status ? `<span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #475569;">${m.status}</span>` : ''}
            <div style="margin-top: 6px; font-size: 11px; color: #94a3b8; font-family: monospace;">
              ${pos[0].toFixed(4)}° N, ${pos[1].toFixed(4)}° E
            </div>
          </div>
        `;
        markerObj.bindPopup(popupContent);

        markerObj.on('click', () => {
          setSelectedMarker(m);
          if (onMarkerClick) onMarkerClick(m);
        });
      });

      // Add Polylines (Routes)
      if (polylines && polylines.length > 0) {
        polylines.forEach((line) => {
          if (line && line.length >= 2) {
            L.polyline(line, {
              color: '#6b21a8',
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 6'
            }).addTo(map);
          }
        });
      }

      // Auto-fit bounds if markers exist
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('Leaflet map initialization fallback to vector GIS:', err);
      setLeafletError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, markers, polylines, center, zoom]);

  // Fallback Vector Canvas Rendering if Leaflet cannot load / offline
  const renderVectorFallback = () => {
    // Calculate bounding box for SVG projection
    const allLats = markers.map(m => Number(m.lat) || center[0]);
    const allLngs = markers.map(m => Number(m.lng) || center[1]);
    if (allLats.length === 0) allLats.push(center[0]);
    if (allLngs.length === 0) allLngs.push(center[1]);

    const minLat = Math.min(...allLats) - 0.005;
    const maxLat = Math.max(...allLats) + 0.005;
    const minLng = Math.min(...allLngs) - 0.005;
    const maxLng = Math.max(...allLngs) + 0.005;

    const projectX = (lng) => {
      const denom = maxLng - minLng || 0.01;
      return 60 + ((Number(lng) - minLng) / denom) * 680;
    };

    const projectY = (lat) => {
      const denom = maxLat - minLat || 0.01;
      // Invert Y axis for SVG (north is up)
      return 360 - ((Number(lat) - minLat) / denom) * 300;
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
        <svg viewBox="0 0 800 420" style={{ width: '100%', height: '100%' }}>
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="420" fill="url(#grid)" />

          {/* Ward Perimeter simulated zone */}
          <polygon
            points="120,40 720,70 690,380 90,340"
            fill="#dcfce7"
            fillOpacity="0.25"
            stroke="#86efac"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* Polylines */}
          {polylines.map((line, lIdx) => {
            if (!line || line.length < 2) return null;
            const pointsStr = line.map(pt => `${projectX(pt[1])},${projectY(pt[0])}`).join(' ');
            return (
              <polyline
                key={lIdx}
                points={pointsStr}
                fill="none"
                stroke="#6b21a8"
                strokeWidth="3.5"
                strokeDasharray="6,6"
                strokeOpacity="0.8"
              />
            );
          })}

          {/* Markers */}
          {markers.map((m, mIdx) => {
            const x = projectX(m.lng);
            const y = projectY(m.lat);

            let fillColor = '#d97706';
            if (m.type === 'DEPOT') fillColor = '#1e3a8a';
            else if (m.type === 'DISPOSAL_YARD') fillColor = '#14532d';
            else if (m.type === 'VEHICLE') fillColor = '#16a34a';
            else if (m.type === 'CURRENT_STOP') fillColor = '#dc2626';
            else if (m.type === 'COMPLETED') fillColor = '#15803d';

            return (
              <g
                key={mIdx}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMarker(m)}
              >
                <circle r="16" fill={fillColor} stroke="#ffffff" strokeWidth="2.5" />
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {m.sequence || (m.type === 'VEHICLE' ? '🚛' : m.type === 'DEPOT' ? '🏢' : '•')}
                </text>
                <text
                  textAnchor="middle"
                  dy="28"
                  fill="#1e293b"
                  fontSize="10"
                  fontWeight="600"
                  style={{ textShadow: '0 1px 2px white' }}
                >
                  {m.title || m.name || `Stop ${mIdx + 1}`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Marker Callout in Vector Mode */}
        {selectedMarker && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            maxWidth: '260px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 20
          }}>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>
              {selectedMarker.title || selectedMarker.name}
            </strong>
            {selectedMarker.address && (
              <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0.2rem 0' }}>
                📍 {selectedMarker.address}
              </p>
            )}
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
              {Number(selectedMarker.lat).toFixed(4)}° N, {Number(selectedMarker.lng).toFixed(4)}° E
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #cbd5e1',
      backgroundColor: '#f8fafc'
    }}>
      {/* Transparency GPS Notice Banner */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '50px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(4px)',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        padding: '0.4rem 0.75rem',
        fontSize: '0.75rem',
        color: '#1e40af',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
      }}>
        <Info size={14} color="#2563eb" style={{ flexShrink: 0 }} />
        <span>{prototypeNotice}</span>
      </div>

      {/* Map Content: Leaflet or Resilient Vector Fallback */}
      {leafletError || (!leafletLoaded && typeof window === 'undefined') ? (
        renderVectorFallback()
      ) : (
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      )}

      {/* Floating Legend */}
      {showLegend && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.72rem',
          zIndex: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1e3a8a' }} />
            <span style={{ fontWeight: 600, color: '#334155' }}>Depot / Yard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span style={{ fontWeight: 600, color: '#334155' }}>Fleet Vehicle</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d97706' }} />
            <span style={{ fontWeight: 600, color: '#334155' }}>Pickup Stop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span style={{ fontWeight: 600, color: '#334155' }}>Current Stop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#15803d' }} />
            <span style={{ fontWeight: 600, color: '#334155' }}>Completed</span>
          </div>
        </div>
      )}
    </div>
  );
}
