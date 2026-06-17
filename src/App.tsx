/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import MapSimulator from './components/MapSimulator';
import PhoneSimulator from './components/PhoneSimulator';
import PhoneApp from './components/PhoneApp';
import AuthControls from './components/AuthControls';
import PushNotificationControls from './components/PushNotificationControls';
import { SignedInShell, SignedOutShell } from './components/SignedOutLanding';
import { useAppState } from './hooks/useAppState';
import { useClerkSupabaseSync } from './hooks/useClerkSupabaseSync';
import { Heart, Terminal, Shield } from 'lucide-react';

function AppContent() {
  useClerkSupabaseSync();

  const {
    userA,
    userB,
    activeControl,
    setActiveControl,
    notifications,
    chatMessages,
    logs,
    backendReady,
    useSupabase,
    handleUpdateUser,
    handlePair,
    handleUnpair,
    handleAddNotification,
    handleClearNotifications,
    handleDeleteAccount,
    handleSendChatMessage,
    triggerLowBatteryScenario,
    triggerCommuteWalk,
    triggerResetEverything,
  } = useAppState();

  if (!backendReady) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
        <p className="text-[#FF4D6D] font-semibold">Connecting to Supabase…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col font-sans text-[#2B2D42] antialiased p-4 lg:p-8">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF4D6D] z-50"></div>

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
                {useSupabase ? 'Live Supabase' : 'Simulator'}
              </span>
            </div>
            <p className="text-xs text-[#8D99AE] mt-1.5 font-semibold tracking-wide uppercase">
              End-to-End Encrypted Location Stream & Dual-Consent Sanctuary
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-4 bg-white/70 p-3 rounded-2xl border border-[#FFCCD5]">
            <div className="p-2 bg-[#FFF0F3] rounded-xl text-[#C9184A] border border-[#FFCCD5]">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left leading-normal hidden sm:block">
              <span className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest block">MUTUAL CONSENT ACTIVE</span>
              <div className="font-extrabold text-xs text-[#2B2D42] mt-0.5 flex items-center gap-2">
                <span>Both Users Online</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            </div>
          </div>
          <PushNotificationControls partnerId={userA.partnerId ?? userB.partnerId} />
          <AuthControls />
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-[640px]">
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

          <div className="bg-white rounded-3xl border border-[#FFCCD5] shadow-sm p-5 flex flex-col gap-3 select-none">
            <div className="flex items-center gap-2 border-b border-[#FFF0F3] pb-3 mb-1">
              <span className="p-1 px-1.5 text-xs bg-[#FFF0F3] text-[#FF4D6D] rounded-lg border border-[#FFCCD5]">💻</span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2B2D42]">Simulation Control Beacons</h3>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={triggerLowBatteryScenario} className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#FFCCD5] bg-white hover:bg-[#FFF0F3]/30 text-left transition-all text-xs font-bold text-[#2B2D42]">
                <span>🔋 Low Battery Warning <span className="text-[#8D99AE] font-normal">[Taylor]</span></span>
                <span className="text-[9px] text-[#C9184A] font-black uppercase tracking-wider bg-[#FFF0F3] border border-[#FFCCD5] px-2 py-0.5 rounded-full">Trigger</span>
              </button>
              <button onClick={triggerCommuteWalk} className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#FFCCD5] bg-white hover:bg-[#FFF0F3]/30 text-left transition-all text-xs font-bold text-[#2B2D42]">
                <span>🚶 Simulate Commute Route <span className="text-[#8D99AE] font-normal">[Alex]</span></span>
                <span className="text-[9px] text-[#C9184A] font-black uppercase tracking-wider bg-[#FFF0F3] border border-[#FFCCD5] px-2 py-0.5 rounded-full">Commute</span>
              </button>
              <button onClick={triggerResetEverything} className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#FFCCD5]/80 bg-red-50/50 hover:bg-rose-50 text-left transition-all text-xs font-bold text-[#C9184A]">
                <span>🔄 Reset Device States completely</span>
                <span className="text-[9px] text-[#C9184A] font-black uppercase tracking-wider bg-rose-100/40 px-2 py-0.5 rounded-full">Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
            <PhoneSimulator ownerName="Alex" avatarUrl={userA.profilePicture} batteryPercentage={userA.batteryPercentage} isCharging={userA.isCharging} themeColor="pink">
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

            <PhoneSimulator ownerName="Taylor" avatarUrl={userB.profilePicture} batteryPercentage={userB.batteryPercentage} isCharging={userB.isCharging} themeColor="slate">
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

      <footer className="max-w-7xl mx-auto w-full mt-6 select-none bg-[#090d16] text-[#6ee7b7] rounded-3xl p-5 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-slate-800 rounded-md">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-xs text-slate-100 tracking-wider">DEV SYSTEM FRAME TERMINAL LOGS</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 uppercase tracking-widest">
            {useSupabase ? 'Supabase Realtime: Active' : 'Mock Data: Active'}
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

export default function App() {
  return (
    <>
      <SignedOutShell />
      <SignedInShell>
        <AppContent />
      </SignedInShell>
    </>
  );
}
