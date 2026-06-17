/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, AppNotification, ChatMessage } from './types';
import { INITIAL_USER_A, INITIAL_USER_B } from './data/mockData';
import { env, isSupabaseConfigured } from './lib/env';
import MapSimulator from './components/MapSimulator';
import PhoneSimulator from './components/PhoneSimulator';
import PhoneApp from './components/PhoneApp';
import { Heart, Terminal, Shield, Wifi, Share2, HelpCircle } from 'lucide-react';

export default function App() {
  // Master Simulated Database State (Supabase / In-Memory Synchronization Engine)
  const [userA, setUserA] = useState<User>(INITIAL_USER_A);
  const [userB, setUserB] = useState<User>(INITIAL_USER_B);

  // Active Map click simulator controls (Determines who you move when clicking directly on the SVG map)
  const [activeControl, setActiveControl] = useState<'alex' | 'taylor'>('alex');

  // Unified Notification Logs database (Simulated Supabase Notifications framework)
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n1',
      userId: 'user-alex',
      title: 'Pair request accepted!',
      message: 'You are now successfully linked with Taylor. Mutual location sharing is active.',
      type: 'pair_accepted',
      timestamp: '2h ago',
      read: false,
    },
    {
      id: 'n2',
      userId: 'user-taylor',
      title: 'Pair request accepted!',
      message: 'You are now successfully linked with Alex. Mutual location sharing is active.',
      type: 'pair_accepted',
      timestamp: '2h ago',
      read: false,
    },
  ]);

  // Unified Chat state database for simulations
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderId: 'user-alex',
      text: 'Hey sweetheart! Ready for our coffee meetup? ☕',
      timestamp: '10:05 AM',
    },
    {
      id: 'm2',
      senderId: 'user-taylor',
      text: 'Yes! Heading towards Sweethearts Cafe now, you can watch my commute path live. ❤️',
      timestamp: '10:06 AM',
    },
  ]);

  // Stateful Developer Real-time System Terminal Logs
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'warn' | 'success' | 'alert' }>>([
    {
      timestamp: '08:19:58',
      message: env.useMockData
        ? 'Loc-Ker Lover simulator booted (VITE_USE_MOCK_DATA=true).'
        : 'Loc-Ker Lover booted with live backend mode.',
      type: 'success',
    },
    {
      timestamp: '08:19:59',
      message: isSupabaseConfigured()
        ? `Supabase client ready (${env.appEnv}).`
        : 'Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
      type: isSupabaseConfigured() ? 'info' : 'warn',
    },
    { timestamp: '10:00:00', message: 'Established mutual love-link bond. Encryption key generated: AES-GCM-256', type: 'success' },
    { timestamp: '10:05:00', message: 'Supabase Realtime subscription established on table "users". Listening for lat/lon updates...', type: 'info' },
  ]);

  const addLog = (message: string, type: 'info' | 'warn' | 'success' | 'alert' = 'info') => {
    const now = new Date();
    const strTime = now.toTimeString().split(' ')[0];
    setLogs((prev) => [{ timestamp: strTime, message, type }, ...prev].slice(0, 30));
  };

  const handleUpdateUser = (userId: 'alex' | 'taylor', updates: Partial<User>) => {
    if (userId === 'alex') {
      setUserA((prev) => {
        const next = { ...prev, ...updates };
        // Log coordinates changes distinctly
        if (updates.latitude !== undefined && updates.longitude !== undefined) {
          addLog(`Supabase Realtime [Alex CART]: Lat: ${updates.latitude.toFixed(5)}, Lon: ${updates.longitude.toFixed(5)} Status: ${next.status.toUpperCase()}`, 'info');
        }
        return next;
      });
    } else {
      setUserB((prev) => {
        const next = { ...prev, ...updates };
        if (updates.latitude !== undefined && updates.longitude !== undefined) {
          addLog(`Supabase Realtime [Taylor VANCE]: Lat: ${updates.latitude.toFixed(5)}, Lon: ${updates.longitude.toFixed(5)} Status: ${next.status.toUpperCase()}`, 'info');
        }
        return next;
      });
    }
  };

  const handlePair = (code: string): boolean => {
    addLog(`Clerk Auth / Supabase trying pairing with code: "${code}"`, 'info');
    // Code matching Alex or Taylor
    if (code === 'LVR-9426' || code === 'LVR-1378') {
      setUserA((prev) => ({ ...prev, partnerId: 'user-taylor' }));
      setUserB((prev) => ({ ...prev, partnerId: 'user-alex' }));
      
      const newNotiA: AppNotification = {
        id: `noti-${Date.now()}-a`,
        userId: 'user-alex',
        title: 'Partner Connected!',
        message: 'Your custom pairing bond is now fully synced on Supabase Realtime.',
        type: 'pair_accepted',
        timestamp: 'Just now',
        read: false,
      };

      const newNotiB: AppNotification = {
        id: `noti-${Date.now()}-b`,
        userId: 'user-taylor',
        title: 'Partner Connected!',
        message: 'Your custom pairing bond is now fully synced on Supabase Realtime.',
        type: 'pair_accepted',
        timestamp: 'Just now',
        read: false,
      };

      setNotifications((prev) => [newNotiA, newNotiB, ...prev]);
      addLog('Love-Link Pairing SUCCEEDED. Dual consent recorded on Supabase.', 'success');
      return true;
    }
    addLog(`Pairing FAILED. Code "${code}" is invalid.`, 'warn');
    return false;
  };

  const handleUnpair = () => {
    setUserA((prev) => ({ ...prev, partnerId: null }));
    setUserB((prev) => ({ ...prev, partnerId: null }));
    addLog('Love-Link Partnership DISCONNECTED. Revoked mapping permission.', 'warn');
  };

  const handleAddNotification = (
    userId: 'alex' | 'taylor',
    title: string,
    msg: string,
    type: AppNotification['type']
  ) => {
    const targetUserId = userId === 'alex' ? 'user-alex' : 'user-taylor';
    setNotifications((prev) => [
      {
        id: `noti-${Date.now()}`,
        userId: targetUserId,
        title,
        message: msg,
        type,
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
    addLog(`Notification trigger sent for ${userId.toUpperCase()}: "${title} - ${msg}"`, type === 'emergency' ? 'alert' : 'info');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    addLog('Notifications database table cleared on Supabase.', 'info');
  };

  const handleDeleteAccount = () => {
    handleUnpair();
    addLog('Hard account scrub complete. Deleted from Supabase PostgreSQL schemas successfully.', 'alert');
  };

  const handleSendChatMessage = (text: string) => {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sender = activeControl === 'alex' ? 'user-alex' : 'user-taylor';
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: sender,
        text,
        timestamp: ts,
      },
    ]);
    addLog(`In-App Chat message streamed: ${activeControl.toUpperCase()}: "${text}"`, 'info');
  };

  // Preset Scenario Controllers
  const triggerLowBatteryScenario = () => {
    handleUpdateUser('taylor', { batteryPercentage: 9, isCharging: false });
    handleAddNotification('alex', 'Partner Low Battery Warning!', 'Taylor is at 9% battery! Ensure they charging soon.', 'emergency');
    addLog('Triggered Preset Scenario: Low Battery Sync telemetry.', 'warn');
  };

  const triggerCommuteWalk = () => {
    addLog('Starting simulated walk commuted route for Alex...', 'info');
    handleUpdateUser('alex', { status: 'moving' });
    // Soft animated translation towards cafe
    let steps = 0;
    const interval = setInterval(() => {
      if (steps >= 4) {
        clearInterval(interval);
        handleUpdateUser('alex', { latitude: 37.7749, longitude: -122.4194, status: 'online' });
        handleAddNotification('taylor', 'Arrived at Cozy Cafe', 'Alex Carter arrived at Sweethearts Cafe for coffee date.', 'geofence');
        return;
      }
      const latDelta = (37.7749 - 37.7694) / 4;
      const lonDelta = (-122.4194 - (-122.4214)) / 4;
      handleUpdateUser('alex', {
        latitude: 37.7694 + latDelta * (steps + 1),
        longitude: -122.4214 + lonDelta * (steps + 1),
      });
      steps++;
    }, 2000);
  };

  const triggerResetEverything = () => {
    setUserA(INITIAL_USER_A);
    setUserB(INITIAL_USER_B);
    setChatMessages([]);
    addLog('Full application states reset to standard defaults.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col font-sans text-[#2B2D42] antialiased p-4 lg:p-8">
      {/* Decorative top soft bar that fits the premium look */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF4D6D] z-50"></div>

      {/* Corporate Title Header Section - Re-styled for Editorial Aesthetic */}
      <header className="max-w-7xl mx-auto w-full mb-8 flex flex-col md:flex-row items-end justify-between bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-[#FFCCD5] shadow-sm gap-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="bg-[#FF4D6D] p-3.5 rounded-2xl text-white shadow-md shadow-[#FF4D6D]/15">
            <Heart className="w-8 h-8 fill-white" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5">
              <h1 className="text-4xl font-extrabold text-[#FF4D6D] tracking-tight italic font-serif">
                Loc-Ker Lover
              </h1>
              <span className="bg-[#FFF0F3] border border-[#FFCCD5] text-[#C9184A] text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block uppercase tracking-widest">
                The Private Space for Us
              </span>
            </div>
            <p className="text-xs text-[#8D99AE] mt-1.5 font-semibold tracking-wide uppercase">
              End-to-End Encrypted Location Stream & Dual-Consent Sanctuary 
            </p>
          </div>
        </div>

        {/* Global Protection Badges - Styled to blend smoothly */}
        <div className="flex items-center gap-4 bg-white/70 p-3 rounded-2xl border border-[#FFCCD5] shrink-0">
          <div className="p-2 bg-[#FFF0F3] rounded-xl text-[#C9184A] border border-[#FFCCD5]">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-left leading-normal">
            <span className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest block">MUTUAL CONSENT ACTIVE</span>
            <div className="font-extrabold text-xs text-[#2B2D42] mt-0.5 flex items-center gap-2">
              <span>Both Users Fully Online</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dual View Dashboard Container */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-[640px]">
        {/* Left Side: Interactive Playground Vector Map */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="flex-1 min-h-[350px]">
            <MapSimulator
              userA={userA}
              userB={userB}
              onUpdateLocation={(userId, lat, lon) => handleUpdateUser(userId, { latitude: lat, longitude: lon, lastSeen: 'Just now' })}
              activeControl={activeControl}
              setActiveControl={setActiveControl}
            />
          </div>

          {/* Quick Preset Action Controller Drawer */}
          <div className="bg-white rounded-3xl border border-[#FFCCD5] shadow-sm p-5 flex flex-col gap-3 select-none">
            <div className="flex items-center gap-2 border-b border-[#FFF0F3] pb-3 mb-1">
              <span className="p-1 px-1.5 text-xs bg-[#FFF0F3] text-[#FF4D6D] rounded-lg border border-[#FFCCD5]">💻</span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2B2D42]">Simulation Control Beacons</h3>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={triggerLowBatteryScenario}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#FFCCD5] bg-white hover:bg-[#FFF0F3]/30 text-left transition-all text-xs font-bold text-[#2B2D42]"
              >
                <span>🔋 Low Battery Warning <span className="text-[#8D99AE] font-normal">[Taylor]</span></span>
                <span className="text-[9px] text-[#C9184A] font-black uppercase tracking-wider bg-[#FFF0F3] border border-[#FFCCD5] px-2 py-0.5 rounded-full">Trigger</span>
              </button>

              <button
                onClick={triggerCommuteWalk}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#FFCCD5] bg-white hover:bg-[#FFF0F3]/30 text-left transition-all text-xs font-bold text-[#2B2D42]"
              >
                <span>🚶 Simulate Commute Route <span className="text-[#8D99AE] font-normal">[Alex]</span></span>
                <span className="text-[9px] text-[#C9184A] font-black uppercase tracking-wider bg-[#FFF0F3] border border-[#FFCCD5] px-2 py-0.5 rounded-full">Commute</span>
              </button>

              <button
                onClick={triggerResetEverything}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#FFCCD5]/80 bg-red-50/50 hover:bg-rose-50 text-left transition-all text-xs font-bold text-[#C9184A]"
              >
                <span>🔄 Reset Device States completely</span>
                <span className="text-[9px] text-[#C9184A] font-black uppercase tracking-wider bg-rose-100/40 px-2 py-0.5 rounded-full">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Side-by-Side Connected iPhone Simulators */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
            {/* Screen 1: Alex Carter's view wrapper */}
            <PhoneSimulator
              ownerName="Alex"
              avatarUrl={userA.profilePicture}
              batteryPercentage={userA.batteryPercentage}
              isCharging={userA.isCharging}
              themeColor="pink"
            >
              <PhoneApp
                userId="alex"
                user={userA}
                partner={userB}
                onUpdateUser={handleUpdateUser}
                onPair={handlePair}
                onUnpair={handleUnpair}
                onAddNotification={handleAddNotification}
                notifications={notifications}
                onClearNotifications={handleClearNotifications}
                onDeleteAccount={handleDeleteAccount}
                chatMessages={chatMessages}
                onSendChatMessage={handleSendChatMessage}
              />
            </PhoneSimulator>

            {/* Screen 2: Taylor Vance's view wrapper */}
            <PhoneSimulator
              ownerName="Taylor"
              avatarUrl={userB.profilePicture}
              batteryPercentage={userB.batteryPercentage}
              isCharging={userB.isCharging}
              themeColor="slate"
            >
              <PhoneApp
                userId="taylor"
                user={userB}
                partner={userA}
                onUpdateUser={handleUpdateUser}
                onPair={handlePair}
                onUnpair={handleUnpair}
                onAddNotification={handleAddNotification}
                notifications={notifications}
                onClearNotifications={handleClearNotifications}
                onDeleteAccount={handleDeleteAccount}
                chatMessages={chatMessages}
                onSendChatMessage={handleSendChatMessage}
              />
            </PhoneSimulator>
          </div>
        </div>
      </main>

      {/* Developer Live Terminal Console logs */}
      <footer className="max-w-7xl mx-auto w-full mt-6 select-none bg-[#090d16] text-[#6ee7b7] rounded-3xl p-5 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-slate-800 rounded-md">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-xs text-slate-100 tracking-wider">DEV SYSTEM FRAME TERMINAL LOGS</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 uppercase tracking-widest">
            Supabase Realtime Channel: Active
          </span>
        </div>

        <div className="flex flex-col gap-1.5 h-[120px] overflow-y-auto text-[11px] font-mono select-text scrollbar-thin scrollbar-thumb-slate-800 pr-1">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-1 leading-relaxed">
              <span className="text-slate-500">[{log.timestamp}]</span>
              <span className={`px-1 rounded text-[10px] mr-1 ${
                log.type === 'success' ? 'bg-emerald-950 text-emerald-400' :
                log.type === 'warn' ? 'bg-amber-950 text-amber-500' :
                log.type === 'alert' ? 'bg-red-950 text-red-500 font-extrabold px-1.5' : 'bg-slate-950 text-slate-405'
              }`}>
                {log.type.toUpperCase()}
              </span>
              <p className="text-slate-300 inline">{log.message}</p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
