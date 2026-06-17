/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { User, SavedPlace } from '../types';
import { PRESET_PLACES, calculateDistance, formatDistance } from '../data/mockData';
import { MapPin, Navigation, NavigationOff, Heart, Coffee, Home, Briefcase, Trees, Compass } from 'lucide-react';

interface MapSimulatorProps {
  userA: User;
  userB: User;
  onUpdateLocation: (userId: 'alex' | 'taylor', lat: number, lon: number) => void;
  activeControl: 'alex' | 'taylor';
  setActiveControl: (userId: 'alex' | 'taylor') => void;
}

const BOUNDS = {
  minLat: 37.7550,
  maxLat: 37.7880,
  minLon: -122.4250,
  maxLon: -122.4000,
};

export default function MapSimulator({
  userA,
  userB,
  onUpdateLocation,
  activeControl,
  setActiveControl,
}: MapSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 450,
        });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Convert Lat/Lon to SVG Coordinate Percentages
  const getCoords = (lat: number, lon: number) => {
    const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * dimensions.width;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * dimensions.height;
    return { x, y };
  };

  // Convert SVG coordinate click back to Lat/Lon
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const lon = BOUNDS.minLon + (clickX / dimensions.width) * (BOUNDS.maxLon - BOUNDS.minLon);
    const lat = BOUNDS.maxLat - (clickY / dimensions.height) * (BOUNDS.maxLat - BOUNDS.minLat);

    // Limit to bounds
    const clampedLat = Math.max(BOUNDS.minLat, Math.min(BOUNDS.maxLat, lat));
    const clampedLon = Math.max(BOUNDS.minLon, Math.min(BOUNDS.maxLon, lon));

    onUpdateLocation(activeControl, clampedLat, clampedLon);
  };

  const posA = getCoords(userA.latitude, userA.longitude);
  const posB = getCoords(userB.latitude, userB.longitude);

  const arePaired = userA.partnerId === userB.id && userB.partnerId === userA.id;
  const isSharingA = userA.isLocationSharing && userA.status !== 'paused';
  const isSharingB = userB.isLocationSharing && userB.status !== 'paused';

  const distKm = calculateDistance(userA.latitude, userA.longitude, userB.latitude, userB.longitude);
  const formattedDist = formatDistance(distKm);

  // Midpoint for the link heart
  const midX = (posA.x + posB.x) / 2;
  const midY = (posA.y + posB.y) / 2;

  // Render place icon
  const renderPlaceIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-pink-600" />;
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-pink-600" />;
      case 'school':
        return <Trees className="w-3.5 h-3.5 text-pink-600" />;
      default:
        return <Coffee className="w-3.5 h-3.5 text-pink-600" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-[#FFCCD5] shadow-sm overflow-hidden font-sans">
      {/* Map Control Bar - Editorial style */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-[#FFF0F3] border-b border-[#FFCCD5] gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#FF4D6D] rounded-xl text-white">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-[#2B2D42] text-xs uppercase tracking-wider">Interactive GPS Sanctuary</h3>
            <p className="text-[11px] text-[#8D99AE] font-medium font-serif italic">Tap map to simulate location synchronization</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#FFCCD5]">
          <button
            onClick={() => setActiveControl('alex')}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeControl === 'alex'
                ? 'bg-[#2B2D42] text-white shadow-sm'
                : 'text-[#8D99AE] hover:text-[#2B2D42]'
            }`}
          >
            🕹️ Alex
          </button>
          <button
            onClick={() => setActiveControl('taylor')}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeControl === 'taylor'
                ? 'bg-[#2B2D42] text-white shadow-sm'
                : 'text-[#8D99AE] hover:text-[#2B2D42]'
            }`}
          >
            🕹️ Taylor
          </button>
        </div>
      </div>

      {/* Styled Vector Map Container */}
      <div id="map-simulator-screen" ref={containerRef} className="flex-1 relative bg-[#FFF5F7]/40 min-h-[350px] cursor-crosshair select-none overflow-hidden">
        {/* Soft Background Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

        {/* Detailed Vector Paths & Landmarks */}
        <svg
          className="w-full h-full absolute inset-0"
          onClick={handleMapClick}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          {/* Defs for gradients & shadow filters */}
          <defs>
            <radialGradient id="oceanGrad" cx="30%" cy="30%" r="70%">
               <stop offset="0%" stopColor="#FFF0F3" />
               <stop offset="100%" stopColor="#FFCCD5" />
            </radialGradient>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#FFF0F3" />
            </linearGradient>
            <pattern id="lightGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFCCD5" strokeWidth="0.75" />
            </pattern>
          </defs>

          {/* Grid Fill */}
          <rect width="100%" height="100%" fill="url(#lightGrid)" opacity="0.6" />

          {/* Styled Scenic Rivers / Oceans */}
          <path
            d={`M 0,${dimensions.height * 0.15} Q ${dimensions.width * 0.3},${dimensions.height * 0.05} ${dimensions.width * 0.6},${dimensions.height * 0.2} T ${dimensions.width},${dimensions.height * 0.1}`}
            fill="none"
            stroke="url(#oceanGrad)"
            strokeWidth="38"
            opacity="0.7"
            strokeLinecap="round"
          />

          {/* Styled Aesthetic Roads Grid */}
          {/* Main Highway Horizontal */}
          <path
            d={`M -20,${dimensions.height * 0.5} Q ${dimensions.width * 0.5},${dimensions.height * 0.6} ${dimensions.width + 20},${dimensions.height * 0.45}`}
            fill="none"
            stroke="#fff"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d={`M -20,${dimensions.height * 0.5} Q ${dimensions.width * 0.5},${dimensions.height * 0.6} ${dimensions.width + 20},${dimensions.height * 0.45}`}
            fill="none"
            stroke="#FFCCD5"
            strokeDasharray="6,6"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Avenue Vertical Right */}
          <path
            d={`M ${dimensions.width * 0.75},-20 Q ${dimensions.width * 0.7},${dimensions.height * 0.5} ${dimensions.width * 0.8},${dimensions.height + 20}`}
            fill="none"
            stroke="#fff"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Boulevard Diagonal Left */}
          <path
            d={`M -20,-20 L ${dimensions.width + 20},${dimensions.height + 20}`}
            fill="none"
            stroke="#fff"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Connectors / Cozy Streets */}
          <path d={`M ${dimensions.width * 0.25},0 L ${dimensions.width * 0.25},${dimensions.height}`} fill="none" stroke="#fffffd" strokeWidth="8" opacity="0.8" />
          <path d={`M 0,${dimensions.height * 0.8} L ${dimensions.width},${dimensions.height * 0.8}`} fill="none" stroke="#fffffd" strokeWidth="8" opacity="0.8" />

          {/* Soft Colored Green Spaces / Parks (Zones) */}
          <rect x={dimensions.width * 0.45} y={dimensions.height * 0.65} width={dimensions.width * 0.22} height={dimensions.height * 0.25} rx="24" fill="#FFF0F3" stroke="#FFCCD5" strokeWidth="1.5" />
          <circle cx={dimensions.width * 0.15} cy={dimensions.height * 0.3} r="45" fill="#FFF5F7" stroke="#FFCCD5" strokeWidth="1.5" />

          {/* Saved Places Radius Beacons */}
          {PRESET_PLACES.map((place) => {
            const placePos = getCoords(place.latitude, place.longitude);
            return (
              <g key={place.id} className="cursor-pointer">
                {/* Radial Pulse */}
                <circle
                  cx={placePos.x}
                  cy={placePos.y}
                  r="24"
                  fill="#FF4D6D"
                  opacity="0.2"
                  className="animate-ping"
                  style={{ animationDuration: '4s' }}
                />
                <circle
                  cx={placePos.x}
                  cy={placePos.y}
                  r="14"
                  fill="#FFF0F3"
                  stroke="#FFCCD5"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Couples Loving Link (Bond Line) */}
          {arePaired && isSharingA && isSharingB && (
            <g>
              <path
                d={`M ${posA.x},${posA.y} Q ${midX + 20},${midY - 45} ${posB.x},${posB.y}`}
                fill="none"
                stroke="url(#oceanGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d={`M ${posA.x},${posA.y} Q ${midX + 20},${midY - 45} ${posB.x},${posB.y}`}
                fill="none"
                stroke="#C9184A"
                strokeWidth="2.5"
                strokeDasharray="8,6"
                className="animate-marquee"
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>

        {/* Saved Places Labels / Icons Overlay */}
        {PRESET_PLACES.map((place) => {
          const placePos = getCoords(place.latitude, place.longitude);
          return (
            <div
              key={place.id}
              className="absolute pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: placePos.x, top: placePos.y }}
            >
              <div className="bg-white p-1.5 rounded-full border border-[#FFCCD5] shadow-xs">
                {renderPlaceIcon(place.type)}
              </div>
              <span className="text-[10px] font-bold text-[#C9184A] bg-white px-2 py-0.5 rounded-full border border-[#FFCCD5] mt-1 shadow-xs whitespace-nowrap">
                {place.name}
              </span>
            </div>
          );
        })}

        {/* Midpoint Love Bond Badge */}
        {arePaired && isSharingA && isSharingB && (
          <div
            className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-30"
            style={{ left: midX, top: midY - 20 }}
          >
            <div className="bg-[#FF4D6D] text-white p-2.5 rounded-full shadow-md border-2 border-white animate-pulse">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div className="bg-white px-3 py-1.5 rounded-2xl border border-[#FFCCD5] shadow-md flex flex-col items-center leading-none">
              <span className="text-[9px] font-black text-[#8D99AE] uppercase tracking-wider">DISTANCE BEACON</span>
              <span className="text-sm font-serif italic font-bold text-[#C9184A] mt-1">{formattedDist}</span>
            </div>
          </div>
        )}

        {/* User A Marker (Alex) */}
        {isSharingA ? (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-40 transition-all duration-500 ease-out"
            style={{ left: posA.x, top: posA.y }}
          >
            {/* Live Indicator Radar */}
            <span className="absolute inline-flex h-9 w-9 rounded-full bg-[#FF4D6D] opacity-30 animate-ping -z-10" />

            <div className="relative flex flex-col items-center">
              {/* Profile Avatar Frame */}
              <div className="relative ring-4 ring-[#FF4D6D] bg-white p-0.5 rounded-full shadow-md transform transition-transform hover:scale-110">
                <img
                  src={userA.profilePicture}
                  alt={userA.fullName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white ring-1 ring-[#FF4D6D] ${
                  userA.status === 'online' ? 'bg-green-500' :
                  userA.status === 'moving' ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
              </div>

              {/* Pin Pointer */}
              <div className="w-3 h-3 bg-[#FF4D6D] transform rotate-45 -mt-1.5 shadow-sm border-b border-r border-white" />

              {/* Tag */}
              <div className="bg-[#C9184A] text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm mt-1 whitespace-nowrap leading-none flex items-center gap-1 border border-[#FFCCD5]">
                <span>{userA.fullName.split(' ')[0]}</span>
                {userA.isCharging && <span className="text-[8px]">⚡</span>}
                <span className="text-[8px] opacity-90">{userA.batteryPercentage}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-60 z-30"
            style={{ left: posA.x, top: posA.y }}
          >
            <div className="bg-gray-100 text-gray-500 p-2 rounded-full border border-gray-300">
              <NavigationOff className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-gray-500 bg-white px-1.5 rounded-md mt-1 border shadow-xs">
              Alex (Hidden)
            </span>
          </div>
        )}

        {/* User B Marker (Taylor) */}
        {isSharingB ? (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-40 transition-all duration-500 ease-out"
            style={{ left: posB.x, top: posB.y }}
          >
            {/* Live Indicator Radar */}
            <span className="absolute inline-flex h-9 w-9 rounded-full bg-[#FF4D6D] opacity-30 animate-ping -z-10" />

            <div className="relative flex flex-col items-center">
              {/* Profile Avatar Frame */}
              <div className="relative ring-4 ring-[#FF4D6D] bg-white p-0.5 rounded-full shadow-md transform transition-transform hover:scale-110">
                <img
                  src={userB.profilePicture}
                  alt={userB.fullName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white ring-1 ring-[#FF4D6D] ${
                  userB.status === 'online' ? 'bg-green-500' :
                  userB.status === 'moving' ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
              </div>

              {/* Pin Pointer */}
              <div className="w-3 h-3 bg-[#FF4D6D] transform rotate-45 -mt-1.5 shadow-sm border-b border-r border-white" />

              {/* Tag */}
              <div className="bg-[#2B2D42] text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm mt-1 whitespace-nowrap leading-none flex items-center gap-1 border border-[#FFCCD5]">
                <span>{userB.fullName.split(' ')[0]}</span>
                {userB.isCharging && <span className="text-[8px]">⚡</span>}
                <span className="text-[8px] opacity-90">{userB.batteryPercentage}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-60 z-30"
            style={{ left: posB.x, top: posB.y }}
          >
            <div className="bg-gray-100 text-gray-500 p-2 rounded-full border border-gray-300">
              <NavigationOff className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-gray-500 bg-white px-1.5 rounded-md mt-1 border shadow-xs">
              Taylor (Hidden)
            </span>
          </div>
        )}
      </div>

      {/* Map Footer Preset Scenario Buttons */}
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
        .bg-grid-pattern {
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(244,63,94,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(244,63,94,0.05) 1px, transparent 1px);
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes marquee {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-marquee {
          animation: marquee 1.2s linear infinite;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
