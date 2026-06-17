/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wifi, Battery, BatteryCharging } from 'lucide-react';

interface PhoneSimulatorProps {
  ownerName: string;
  avatarUrl: string;
  children: React.ReactNode;
  batteryPercentage: number;
  isCharging: boolean;
  themeColor?: 'pink' | 'purple' | 'slate';
}

export default function PhoneSimulator({
  ownerName,
  avatarUrl,
  children,
  batteryPercentage,
  isCharging,
  themeColor = 'pink',
}: PhoneSimulatorProps) {
  // Current simulated local time
  const [time, setTime] = React.useState('08:20');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const strHours = hours < 10 ? `0${hours}` : `${hours}`;
      const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setTime(`${strHours}:${strMinutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const getThemeClass = () => {
    switch (themeColor) {
      case 'purple':
        return 'border-purple-200 bg-purple-50 hover:border-purple-300 ring-purple-500/10';
      case 'slate':
        return 'border-slate-300 bg-slate-50 hover:border-slate-400 ring-slate-500/10';
      default:
        return 'border-rose-100 bg-rose-50 hover:border-rose-200 ring-rose-500/10';
    }
  };

  const getAccentClass = () => {
    switch (themeColor) {
      case 'purple':
        return 'from-purple-500 to-indigo-500';
      case 'slate':
        return 'from-slate-700 to-slate-900';
      default:
        return 'from-pink-500 to-rose-500';
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Device Header Tag */}
      <div className={`mb-3.5 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border shadow-md font-bold text-xs text-gray-700 transition-all ${getThemeClass()}`}>
        <img
          src={avatarUrl}
          alt={ownerName}
          referrerPolicy="no-referrer"
          className="w-5 h-5 rounded-full object-cover border border-rose-100"
        />
        <span>{ownerName}'s iPhone</span>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] text-gray-400 font-medium">Synced</span>
        </div>
      </div>

      {/* Outer Device Container (with physical buttons) */}
      <div className="relative mx-auto transition-transform duration-300 group">
        {/* Left Physical Buttons (Volume Up/Down) */}
        <div className="absolute -left-1.5 top-28 w-1.5 h-12 bg-gray-600 rounded-l-lg shadow-md z-1"></div>
        <div className="absolute -left-1.5 top-44 w-1.5 h-12 bg-gray-600 rounded-l-lg shadow-md z-1"></div>
        
        {/* Right Physical Button (Power / Sleep) */}
        <div className="absolute -right-1.5 top-36 w-1.5 h-18 bg-gray-600 rounded-r-lg shadow-md z-1"></div>

        {/* Smartphone Frame (Sleek Editorial Dark Bezel in #2B2D42) */}
        <div className="w-[316px] h-[640px] rounded-[48px] bg-[#2B2D42] p-3.5 shadow-2xl border-4 border-[#2B2D42] ring-10 ring-[#FFCCD5]/20 overflow-hidden relative flex flex-col">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-28 h-6 bg-[#2B2D42] rounded-full border border-[#2B2D42] flex items-center justify-between px-3 text-[10px] text-white">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 shadow-inner"></div>
            {/* Dynamic Status pulse indicators inside Notch */}
            <div className="flex items-center gap-1 opacity-70">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] animate-pulse"></span>
              <span className="text-[8px] font-bold text-[#FFCCD5]">LL</span>
            </div>
          </div>

          {/* Screen Wrapper (Fully Rounded Corners) */}
          <div className="flex-1 rounded-[34px] bg-white overflow-hidden relative flex flex-col border border-zinc-950/5 select-none text-zinc-800">
            {/* Status Bar */}
            <div className="h-10 pt-3 px-6 flex items-center justify-between text-xs font-bold text-gray-900 z-40 bg-white/20 select-none">
              <span>{time}</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="tracking-[0.5px] text-[10px]">LTE</span>
                <Wifi className="w-3.5 h-3.5" />
                
                {/* Battery Status Wrapper */}
                <div className="flex items-center gap-1 bg-gray-100/80 px-1 py-0.5 rounded-sm">
                  {isCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Battery className={`w-3.5 h-3.5 ${batteryPercentage < 20 ? 'text-rose-500 animate-pulse' : 'text-gray-700'}`} />
                  )}
                  <span className="text-[9px] font-mono leading-none">{batteryPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Screen Content */}
            <div id={`phone-body-${ownerName.toLowerCase()}`} className="flex-1 flex flex-col relative select-none bg-white">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="h-6 flex items-center justify-center shrink-0 z-40 bg-transparent pointer-events-none select-none">
              <div className="w-28 h-1 bg-black/35 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
