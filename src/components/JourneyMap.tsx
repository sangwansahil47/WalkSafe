import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationPoint, LocationLog } from '../types';

interface JourneyMapProps {
  startLocation: LocationPoint;
  destination: LocationPoint;
  currentLocation?: LocationPoint;
  locationLogs?: LocationLog[];
  className?: string;
  isHighRisk?: boolean;
}

// Custom icons using Leaflet DivIcon
const createCustomIcon = (type: 'start' | 'dest' | 'current' | 'danger') => {
  let innerHtml = '';
  if (type === 'start') {
    innerHtml = `
      <div style="background-color: #10b981; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `;
  } else if (type === 'dest') {
    innerHtml = `
      <div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
        <svg style="width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      </div>
    `;
  } else if (type === 'danger') {
    innerHtml = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; background: #ef4444; border-radius: 50%; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; background-color: #dc2626; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `;
  } else {
    innerHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; background: #0ea5e9; border-radius: 50%; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; background-color: #0284c7; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `;
  }

  return L.divIcon({
    html: innerHtml,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const MapUpdater: React.FC<{
  currentPos: [number, number];
  startPos: [number, number];
  destPos: [number, number];
}> = ({ currentPos, startPos, destPos }) => {
  const map = useMap();

  useEffect(() => {
    try {
      const bounds = L.latLngBounds([startPos, destPos, currentPos]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } catch (e) {
      console.warn('Map fitBounds error:', e);
    }
  }, [currentPos[0], currentPos[1], startPos[0], startPos[1], destPos[0], destPos[1], map]);

  return null;
};

export const JourneyMap: React.FC<JourneyMapProps> = ({
  startLocation,
  destination,
  currentLocation,
  locationLogs = [],
  className = 'h-72 w-full',
  isHighRisk = false,
}) => {
  const currentPos: [number, number] = [
    currentLocation?.latitude || locationLogs[locationLogs.length - 1]?.latitude || startLocation.latitude,
    currentLocation?.longitude || locationLogs[locationLogs.length - 1]?.longitude || startLocation.longitude,
  ];

  const startPos: [number, number] = [startLocation.latitude, startLocation.longitude];
  const destPos: [number, number] = [destination.latitude, destination.longitude];

  // Route path historical coordinates
  const pathCoordinates: [number, number][] = locationLogs.length > 0
    ? locationLogs.map((l) => [l.latitude, l.longitude])
    : [startPos, currentPos];

  // Planned corridor guide line
  const plannedPath: [number, number][] = [startPos, destPos];

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 shadow-inner ${className}`}>
      <MapContainer
        center={currentPos}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater currentPos={currentPos} startPos={startPos} destPos={destPos} />

        {/* Planned Path Corridor (dashed gray line) */}
        <Polyline
          positions={plannedPath}
          pathOptions={{
            color: '#94a3b8',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.6,
          }}
        />

        {/* Actual Travelled Path (solid blue or amber line) */}
        <Polyline
          positions={pathCoordinates}
          pathOptions={{
            color: isHighRisk ? '#f97316' : '#2563eb',
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Start Marker */}
        <Marker position={startPos} icon={createCustomIcon('start')}>
          <Popup>
            <div className="text-xs p-1">
              <p className="font-bold text-slate-800">Starting Point</p>
              <p className="text-slate-600">{startLocation.name || 'Start Location'}</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={destPos} icon={createCustomIcon('dest')}>
          <Popup>
            <div className="text-xs p-1">
              <p className="font-bold text-slate-800">Destination</p>
              <p className="text-slate-600">{destination.name || 'Destination'}</p>
              {destination.address && <p className="text-slate-400 text-[10px]">{destination.address}</p>}
            </div>
          </Popup>
        </Marker>

        {/* Current User Location Marker */}
        <Marker position={currentPos} icon={createCustomIcon(isHighRisk ? 'danger' : 'current')}>
          <Popup>
            <div className="text-xs p-1">
              <p className="font-bold text-slate-800">You Are Here</p>
              <p className="text-slate-600">
                {currentPos[0].toFixed(4)}, {currentPos[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 shadow-sm border border-slate-200/80 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Start</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Dest</span>
        </div>
      </div>
    </div>
  );
};
