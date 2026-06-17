/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import L from 'leaflet';
import { Compass } from 'lucide-react';
import { useMemo } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import { User } from '../types';
import { PRESET_PLACES, calculateDistance, formatDistance } from '../data/mockData';

interface MapSimulatorProps {
  userA: User;
  userB: User;
  onUpdateLocation: (userId: 'alex' | 'taylor', lat: number, lon: number) => void;
  activeControl: 'alex' | 'taylor';
  setActiveControl: (userId: 'alex' | 'taylor') => void;
}

const SF_CENTER: [number, number] = [37.7749, -122.4194];
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function statusColor(status: User['status']): string {
  if (status === 'online') return '#22c55e';
  if (status === 'moving') return '#f59e0b';
  return '#9ca3af';
}

function createUserIcon(user: User, accent: string): L.DivIcon {
  const firstName = user.fullName.split(' ')[0];
  return L.divIcon({
    className: 'leaflet-user-marker',
    html: `
      <div class="flex flex-col items-center pointer-events-none">
        <div class="relative ring-4 ring-[#FF4D6D] bg-white p-0.5 rounded-full shadow-md" style="--ring-color:${accent}">
          <img src="${user.profilePicture}" alt="${user.fullName}" class="w-10 h-10 rounded-full object-cover" />
          <span class="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white" style="background:${statusColor(user.status)}"></span>
        </div>
        <div class="w-3 h-3 transform rotate-45 -mt-1.5 shadow-sm border-b border-r border-white" style="background:${accent}"></div>
        <div class="text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm mt-1 whitespace-nowrap" style="background:${accent}">
          ${firstName}${user.isCharging ? ' ⚡' : ''} ${user.batteryPercentage}%
        </div>
      </div>
    `,
    iconSize: [80, 90],
    iconAnchor: [40, 85],
  });
}

function createHiddenIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: 'leaflet-hidden-marker',
    html: `<div class="flex flex-col items-center opacity-70"><div class="bg-gray-100 text-gray-500 p-2 rounded-full border border-gray-300 text-xs">📍</div><span class="text-[9px] font-bold text-gray-500 bg-white px-1.5 rounded-md mt-1 border">${label} (Hidden)</span></div>`,
    iconSize: [72, 56],
    iconAnchor: [36, 28],
  });
}

function createPlaceIcon(name: string, emoji: string): L.DivIcon {
  return L.divIcon({
    className: 'leaflet-place-marker',
    html: `
      <div class="flex flex-col items-center pointer-events-none">
        <div class="bg-white p-1.5 rounded-full border border-[#FFCCD5] shadow-xs text-sm">${emoji}</div>
        <span class="text-[10px] font-bold text-[#C9184A] bg-white px-2 py-0.5 rounded-full border border-[#FFCCD5] mt-1 shadow-xs whitespace-nowrap max-w-[120px] truncate">${name}</span>
      </div>
    `,
    iconSize: [120, 48],
    iconAnchor: [60, 24],
  });
}

function placeEmoji(type: string): string {
  switch (type) {
    case 'home':
      return '🏡';
    case 'work':
      return '💼';
    case 'school':
      return '🌳';
    default:
      return '☕';
  }
}

export default function MapSimulator({
  userA,
  userB,
  onUpdateLocation,
  activeControl,
  setActiveControl,
}: MapSimulatorProps) {
  const arePaired = userA.partnerId === userB.id && userB.partnerId === userA.id;
  const isSharingA = userA.isLocationSharing && userA.status !== 'paused';
  const isSharingB = userB.isLocationSharing && userB.status !== 'paused';

  const distKm = calculateDistance(userA.latitude, userA.longitude, userB.latitude, userB.longitude);
  const formattedDist = formatDistance(distKm);

  const posA: [number, number] = [userA.latitude, userA.longitude];
  const posB: [number, number] = [userB.latitude, userB.longitude];
  const midPoint: [number, number] = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2];

  const bondLine = useMemo(() => {
    if (!arePaired || !isSharingA || !isSharingB) return null;
    const curve: [number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const lat = (1 - t) * (1 - t) * posA[0] + 2 * (1 - t) * t * (midPoint[0] + 0.002) + t * t * posB[0];
      const lng = (1 - t) * (1 - t) * posA[1] + 2 * (1 - t) * t * (midPoint[1] + 0.003) + t * t * posB[1];
      curve.push([lat, lng]);
    }
    return curve;
  }, [arePaired, isSharingA, isSharingB, posA, posB, midPoint]);

  const iconA = useMemo(() => createUserIcon(userA, '#C9184A'), [userA]);
  const iconB = useMemo(() => createUserIcon(userB, '#2B2D42'), [userB]);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-[#FFCCD5] shadow-sm overflow-hidden font-sans">
      <div className="flex flex-wrap items-center justify-between p-4 bg-[#FFF0F3] border-b border-[#FFCCD5] gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#FF4D6D] rounded-xl text-white">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-[#2B2D42] text-xs uppercase tracking-wider">OpenStreetMap · Leaflet</h3>
            <p className="text-[11px] text-[#8D99AE] font-medium font-serif italic">Tap map to move {activeControl === 'alex' ? 'Alex' : 'Taylor'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#FFCCD5]">
          <button
            onClick={() => setActiveControl('alex')}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeControl === 'alex' ? 'bg-[#2B2D42] text-white shadow-sm' : 'text-[#8D99AE] hover:text-[#2B2D42]'
            }`}
          >
            🕹️ Alex
          </button>
          <button
            onClick={() => setActiveControl('taylor')}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeControl === 'taylor' ? 'bg-[#2B2D42] text-white shadow-sm' : 'text-[#8D99AE] hover:text-[#2B2D42]'
            }`}
          >
            🕹️ Taylor
          </button>
        </div>
      </div>

      <div id="map-simulator-screen" className="flex-1 relative min-h-[350px] z-0">
        <MapContainer
          center={SF_CENTER}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full min-h-[350px] cursor-crosshair"
        >
          <TileLayer attribution={OSM_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={(lat, lon) => onUpdateLocation(activeControl, lat, lon)} />

          {PRESET_PLACES.map((place) => (
            <Circle
              key={place.id}
              center={[place.latitude, place.longitude]}
              radius={place.radius}
              pathOptions={{ color: '#FF4D6D', fillColor: '#FF4D6D', fillOpacity: 0.08, weight: 1.5 }}
            />
          ))}

          {PRESET_PLACES.map((place) => (
            <Marker
              key={`${place.id}-label`}
              position={[place.latitude, place.longitude]}
              icon={createPlaceIcon(place.name, placeEmoji(place.type))}
            />
          ))}

          {bondLine && (
            <Polyline positions={bondLine} pathOptions={{ color: '#C9184A', weight: 3, dashArray: '8 6', opacity: 0.85 }} />
          )}

          {arePaired && isSharingA && isSharingB && (
            <Marker
              position={midPoint}
              icon={L.divIcon({
                className: 'leaflet-distance-marker',
                html: `<div class="flex flex-col items-center"><div class="bg-[#FF4D6D] text-white p-2 rounded-full shadow-md border-2 border-white">❤️</div><div class="bg-white px-3 py-1.5 rounded-2xl border border-[#FFCCD5] shadow-md text-center mt-1"><span class="text-[9px] font-black text-[#8D99AE] uppercase tracking-wider block">Distance</span><span class="text-sm font-serif italic font-bold text-[#C9184A]">${formattedDist}</span></div></div>`,
                iconSize: [100, 72],
                iconAnchor: [50, 36],
              })}
            />
          )}

          {isSharingA ? (
            <Marker position={posA} icon={iconA} />
          ) : (
            <Marker position={posA} icon={createHiddenIcon('Alex')} />
          )}

          {isSharingB ? (
            <Marker position={posB} icon={iconB} />
          ) : (
            <Marker position={posB} icon={createHiddenIcon('Taylor')} />
          )}
        </MapContainer>
      </div>

      <div className="p-3 bg-[#FFF0F3]/50 border-t border-[#FFCCD5] flex flex-nowrap items-center gap-2 overflow-x-auto select-none shrink-0 scrollbar-none">
        <span className="text-[10px] font-black text-[#C9184A] uppercase tracking-widest pl-1 whitespace-nowrap">Favorites:</span>
        <button
          onClick={() => {
            onUpdateLocation('alex', 37.7694, -122.4214);
            onUpdateLocation('taylor', 37.7694, -122.4214);
          }}
          className="text-xs font-semibold bg-white hover:bg-[#FFF0F3] text-[#2B2D42] px-3.5 py-1 rounded-full border border-[#FFCCD5] shadow-xs whitespace-nowrap shrink-0 transition-colors"
        >
          🏡 Both at Home
        </button>
        <button
          onClick={() => {
            onUpdateLocation('alex', 37.7749, -122.4194);
            onUpdateLocation('taylor', 37.7800, -122.4050);
          }}
          className="text-xs font-semibold bg-white hover:bg-[#FFF0F3] text-[#2B2D42] px-3.5 py-1 rounded-full border border-[#FFCCD5] shadow-xs whitespace-nowrap shrink-0 transition-colors"
        >
          ☕ Alex @ Cafe & Taylor @ Work
        </button>
        <button
          onClick={() => {
            onUpdateLocation('alex', 37.7833, -122.4167);
            onUpdateLocation('taylor', 37.7600, -122.4100);
          }}
          className="text-xs font-semibold bg-white hover:bg-[#FFF0F3] text-[#2B2D42] px-3.5 py-1 rounded-full border border-[#FFCCD5] shadow-xs whitespace-nowrap shrink-0 transition-colors"
        >
          🏝️ Lookout Point vs Park
        </button>
      </div>

      <style>{`
        .leaflet-user-marker,
        .leaflet-hidden-marker,
        .leaflet-place-marker,
        .leaflet-distance-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          font-family: inherit;
          z-index: 0;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
