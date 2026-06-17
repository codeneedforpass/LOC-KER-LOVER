/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, SavedPlace, AppNotification, ChatMessage } from '../types';
import { PRESET_PLACES, calculateDistance, formatDistance } from '../data/mockData';
import {
  MapPin, Battery, Shield, Heart, Lock, Unlink, LogOut, Trash2,
  AlertTriangle, MessageSquare, Calendar, Image as ImageIcon, ArrowRight,
  ChevronLeft, Plus, RefreshCw, Sliders, Eye, EyeOff, Clock, User as UserIcon,
  Settings as SettingsIcon, Bell, Navigation, Coffee, Home, Briefcase, Camera, Check,
  Sparkles, History, Smile
} from 'lucide-react';

interface PhoneAppProps {
  userId: 'alex' | 'taylor';
  user: User;
  partner: User;
  onUpdateUser: (userId: 'alex' | 'taylor', updates: Partial<User>) => void;
  onPair: (code: string) => boolean;
  onUnpair: () => void;
  onAddNotification: (userId: 'alex' | 'taylor', title: string, msg: string, type: AppNotification['type']) => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  onDeleteAccount: () => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
}

type ScreenType =
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'verify'
  | 'dashboard'
  | 'pair'
  | 'map'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'future_chat'
  | 'future_places'
  | 'future_history'
  | 'future_gallery';

export default function PhoneApp({
  userId,
  user,
  partner,
  onUpdateUser,
  onPair,
  onUnpair,
  onAddNotification,
  notifications,
  onClearNotifications,
  onDeleteAccount,
  chatMessages,
  onSendChatMessage,
}: PhoneAppProps) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Logged in by default to show interactive couple dashboard directly, but can log out
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState(user.email);
  const [passwordInput, setPasswordInput] = useState('password123');
  const [nameInput, setNameInput] = useState(user.fullName);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [pairingError, setPairingError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Local settings simulation
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [trackingAccuracy, setTrackingAccuracy] = useState('high');

  // Verify code simulation
  const [verifyCode, setVerifyCode] = useState(['', '', '', '']);

  // Dynamic status list
  const statuses: Array<'online' | 'moving' | 'offline' | 'paused'> = ['online', 'moving', 'offline', 'paused'];

  useEffect(() => {
    // Simulate auto-refresh timer if enabled
    let intervalId: NodeJS.Timeout;
    if (user.isLocationSharing && user.status !== 'paused' && isAuthenticated) {
      const seconds = refreshInterval === '5s' ? 5000 : refreshInterval === '10s' ? 10000 : 30000;
      intervalId = setInterval(() => {
        // Soft jitter coordinates slightly to simulate natural GPS drift/movement
        const latJitter = (Math.random() - 0.5) * 0.001;
        const lonJitter = (Math.random() - 0.5) * 0.001;
        onUpdateUser(userId, {
          latitude: user.latitude + latJitter,
          longitude: user.longitude + lonJitter,
          lastSeen: 'Just now',
        });
      }, seconds);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user.latitude, user.longitude, user.isLocationSharing, user.status, refreshInterval, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@') || passwordInput.length < 4) {
      alert('Please enter a valid email and password');
      return;
    }
    onUpdateUser(userId, { email: emailInput, fullName: nameInput });
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');
    onAddNotification(userId, 'Welcome back!', 'Securely logged in using Clerk.', 'status_change');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || !emailInput.includes('@') || passwordInput.length < 4) {
      alert('Please fill out all fields correctly.');
      return;
    }
    onUpdateUser(userId, { fullName: nameInput, email: emailInput });
    setCurrentScreen('verify');
  };

  const handleVerify = () => {
    setIsAuthenticated(true);
    setCurrentScreen('pair');
    onAddNotification(userId, 'Account verified!', 'Start pairing with your partner.', 'pair_request');
  };

  const handlePairSubmit = () => {
    setPairingError('');
    const success = onPair(pairingCodeInput.trim().toUpperCase());
    if (success) {
      setCurrentScreen('dashboard');
    } else {
      setPairingError('Invalid partner code. Try matching LVR-9426 or LVR-1378.');
    }
  };

  const triggerSOS = () => {
    setSosActive(true);
    onAddNotification(
      userId === 'alex' ? 'taylor' : 'alex',
      '🚨 EMERGENCY SOS ALERT',
      `${user.fullName} triggered an emergency SOS! Tap to locate.`,
      'emergency'
    );
    // Auto turn off after 5 seconds
    setTimeout(() => {
      setSosActive(false);
    }, 5000);
  };

  const manualLocationRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onUpdateUser(userId, { lastSeen: 'Just now' });
      onAddNotification(userId, 'Location Synced', 'Successfully refreshed current coordinate beacons with Supabase Realtime.', 'sharing_start');
    }, 800);
  };

  const toggleLocationSharing = () => {
    const isNowSharing = !user.isLocationSharing;
    onUpdateUser(userId, { isLocationSharing: isNowSharing });
    const title = isNowSharing ? 'Sharing Resumed' : 'Location Paused';
    const msg = isNowSharing ? `${user.fullName} is now active on map.` : `${user.fullName} paused location tracking.`;
    
    onAddNotification(userId === 'alex' ? 'taylor' : 'alex', title, msg, isNowSharing ? 'sharing_start' : 'sharing_stop');
  };

  const changeStatus = (newStatus: 'online' | 'moving' | 'offline' | 'paused') => {
    onUpdateUser(userId, { status: newStatus });
    onAddNotification(
      userId === 'alex' ? 'taylor' : 'alex',
      'Status Changed',
      `${user.fullName} is now ${newStatus}.`,
      'status_change'
    );
  };

  const isPaired = user.partnerId && partner && partner.partnerId === user.id;
  const filterNotifications = notifications.filter((n) => n.userId === user.id);

  // Compute stats
  const dist = calculateDistance(user.latitude, user.longitude, partner.latitude, partner.longitude);
  const formattedDist = formatDistance(dist);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative select-none">
      {/* Dynamic Emergency Banner Alert Overlay */}
      {sosActive && (
        <div className="absolute inset-0 bg-red-600/95 flex flex-col items-center justify-center text-center p-6 z-50 animate-pulse text-white">
          <AlertTriangle className="w-16 h-16 animate-bounce mb-3" />
          <h2 className="text-xl font-extrabold tracking-tight uppercase">Emergency SOS Sent!</h2>
          <p className="text-sm mt-2 opacity-90 font-medium">Your precise live coordinates have been broadcasted to {partner.fullName} and emergency services with Clerk telemetry.</p>
          <button
            onClick={() => setSosActive(false)}
            className="mt-6 bg-white text-red-600 font-extrabold px-6 py-2 rounded-full shadow-lg text-xs"
          >
            DISMISS ALERT
          </button>
        </div>
      )}

      {/* Screen Render Switchboard */}

      {/* 1. Splash Screen - Editorial theme styled */}
      {currentScreen === 'splash' && (
        <div className="flex-1 bg-[#FFF5F7] flex flex-col items-center justify-between p-6 z-10">
          <div />
          <div className="flex flex-col items-center gap-2">
            <div className="bg-[#FF4D6D] p-5 rounded-[28px] shadow-lg border border-[#FFCCD5] animate-pulse">
              <Heart className="w-11 h-11 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-extrabold font-serif italic tracking-tight text-[#FF4D6D] mt-3">Loc-Ker Lover</h1>
            <p className="text-[10px] text-[#8D99AE] font-bold uppercase tracking-widest text-center leading-relaxed mt-1">
              Exclusively for Couples
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setCurrentScreen('dashboard');
                } else {
                  setCurrentScreen('login');
                }
              }}
              className="w-full py-4 bg-[#2B2D42] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md hover:bg-[#C9184A] active:scale-95 transition-all text-center flex items-center justify-center gap-2 border border-[#2B2D42]"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[9px] text-[#8D99AE] font-bold uppercase tracking-wider text-center mt-1">
               End-to-end Encrypted Beacons
            </p>
          </div>
        </div>
      )}

      {/* 2. Login Screen */}
      {currentScreen === 'login' && (
        <div className="flex-1 bg-white flex flex-col justify-between p-6 overflow-y-auto">
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-[#2B2D42] tracking-tight font-serif italic">Welcome back</h2>
            <p className="text-xs text-[#8D99AE] font-semibold uppercase mt-1 tracking-wide">Sign in to your private sanctuary</p>
            
            <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Email Address</label>
                <div className="bg-[#FFF5F7]/40 border border-[#FFCCD5] rounded-xl px-3 py-3.5 text-xs focus-within:border-[#FF4D6D] transition-all flex items-center gap-2">
                  <span className="text-[#8D99AE] font-mono">@</span>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="alex@example.com"
                    className="bg-transparent border-none outline-none flex-1 text-[#2B2D42] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Password</label>
                <div className="bg-[#FFF5F7]/40 border border-[#FFCCD5] rounded-xl px-3 py-3.5 text-xs focus-within:border-[#FF4D6D] transition-all flex items-center justify-between">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent border-none outline-none flex-1 text-[#2B2D42] font-semibold"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#8D99AE]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentScreen('forgot_password')}
                className="text-right text-[11px] font-bold text-[#C9184A] hover:underline mt-1"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="w-full py-4 bg-[#2B2D42] text-white font-bold text-xs uppercase tracking-widest rounded-xl mt-4 shadow-md hover:bg-[#FF4D6D] transition-all"
              >
                Sign In
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <span className="text-xs text-[#8D99AE] font-semibold">New to Loc-Ker Lover? </span>
            <button
              onClick={() => setCurrentScreen('register')}
              className="text-xs font-bold text-[#FF4D6D] hover:underline"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* 3. Register Screen */}
      {currentScreen === 'register' && (
        <div className="flex-1 bg-white flex flex-col justify-between p-6 overflow-y-auto">
          <div className="mt-4">
            <button onClick={() => setCurrentScreen('login')} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-6">
              <ChevronLeft className="w-4 h-4" /> Back to login
            </button>
            <h2 className="text-2xl font-bold text-[#2B2D42] font-serif italic tracking-tight">Create Account</h2>
            <p className="text-xs text-[#8D99AE] font-semibold uppercase tracking-wider mt-1">Start tracking each other safely</p>

            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Your Full Name</label>
                <div className="bg-[#FFF5F7]/40 border border-[#FFCCD5] rounded-xl px-3 py-3 text-xs">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Alex Carter"
                    className="bg-transparent border-none outline-none w-full text-[#2B2D42] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Email address</label>
                <div className="bg-[#FFF5F7]/40 border border-[#FFCCD5] rounded-xl px-3 py-3 text-xs">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="alex@lockerlover.app"
                    className="bg-transparent border-none outline-none w-full text-[#2B2D42] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Password</label>
                <div className="bg-[#FFF5F7]/40 border border-[#FFCCD5] rounded-xl px-3 py-3 text-xs">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent border-none outline-none w-full text-[#2B2D42] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" required id="consentChecked" className="rounded text-[#FF4D6D] focus:ring-[#FFCCD5] accent-[#FF4D6D]" />
                <label htmlFor="consentChecked" className="text-[10px] text-gray-500 font-medium leading-tight">
                  I explicitly consent to mutually share location coordinates with my partner.
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#2B2D42] text-white font-bold text-xs uppercase tracking-widest rounded-xl mt-4 shadow-md hover:bg-[#FF4D6D]"
              >
                Sign Up
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <span className="text-xs text-gray-400 font-semibold">Already have an account? </span>
            <button
              onClick={() => setCurrentScreen('login')}
              className="text-xs font-bold text-[#FF4D6D] hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* 4. Forgot Password Screen */}
      {currentScreen === 'forgot_password' && (
        <div className="flex-1 bg-white flex flex-col justify-between p-6">
          <div className="mt-4">
            <button onClick={() => setCurrentScreen('login')} className="flex items-center gap-1 text-xs font-bold text-[#8D99AE] hover:text-[#2B2D42] mb-6">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-2xl font-bold text-[#2B2D42] font-serif italic tracking-tight">Reset Password</h2>
            <p className="text-xs text-[#8D99AE] font-semibold uppercase tracking-wider mt-1">
              Enter network electronic address to receive password recovery token.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Your Email</label>
                <div className="bg-[#FFF5F7]/40 border border-[#FFCCD5] rounded-xl px-3 py-3 text-xs">
                  <input
                    type="email"
                    value={emailInput}
                    placeholder="alex@lockerlover.app"
                    className="bg-transparent border-none outline-none w-full text-[#2B2D42] font-semibold"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  alert('Password recovery link sent! Check your email inbox shortly.');
                  setCurrentScreen('login');
                }}
                className="w-full py-4 bg-[#2B2D42] text-white font-bold text-xs uppercase tracking-widest rounded-xl mt-2 shadow-md hover:bg-[#FF4D6D]"
              >
                Send Reset Link
              </button>
            </div>
          </div>
          <div />
        </div>
      )}

      {/* 5. Email Verification Screen */}
      {currentScreen === 'verify' && (
        <div className="flex-1 bg-white flex flex-col p-6 justify-between">
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-[#2B2D42] font-serif italic tracking-tight">Verify Email</h2>
            <p className="text-xs text-[#8D99AE] font-semibold uppercase tracking-wider mt-1">
              We simulated sending a 4-digit verification code to <span className="font-bold text-[#FF4D6D]">{emailInput}</span>.
            </p>

            <div className="flex justify-center gap-3 mt-8">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={verifyCode[idx]}
                  onChange={(e) => {
                    const next = [...verifyCode];
                    next[idx] = e.target.value;
                    setVerifyCode(next);
                  }}
                  className="w-12 h-14 bg-[#FFF5F7]/40 border-2 border-[#FFCCD5] text-center text-xl font-bold rounded-xl focus:border-[#FF4D6D] outline-none text-[#2B2D42]"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              className="w-full py-4 bg-[#2B2D42] text-white font-bold text-xs uppercase tracking-widest rounded-xl mt-8 shadow-md hover:bg-[#FF4D6D]"
            >
              Verify & Complete
            </button>
          </div>

          <div className="text-center font-bold text-xs text-gray-400">
            Resend code in <span className="text-[#FF4D6D]">0:45</span>
          </div>
        </div>
      )}

      {/* 6. Home Dashboard (Paired / Unpaired split render) */}
      {currentScreen === 'dashboard' && (
        <div className="flex-1 flex flex-col h-full bg-[#FFF5F7]/30 overflow-y-auto font-sans">
          {/* Dashboard Header Bar */}
          <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-[#FFCCD5] sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-[#FF4D6D] p-1.5 rounded-full">
                <Heart className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-extrabold font-serif italic text-md text-[#FF4D6D] tracking-tight">Loc-Ker Lover</span>
            </div>
            
            {/* Quick mini profile bubble or Status badge */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentScreen('notifications')}
                className="relative p-1.5 rounded-full hover:bg-slate-100 text-[#2B2D42]"
              >
                <Bell className="w-4 h-4" />
                {filterNotifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-[#FF4D6D] rounded-full border border-white"></span>
                )}
              </button>
              <button
                onClick={() => setCurrentScreen('profile')}
                className="w-6.5 h-6.5 rounded-full overflow-hidden border border-[#FFCCD5]"
              >
                <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Welcome Message Card */}
            <div className="bg-white p-4 rounded-3xl border border-[#FFCCD5] shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black text-[#FF4D6D] tracking-wider">HI, {user.fullName.toUpperCase().split(' ')[0]}! 👋</h3>
                <h4 className="text-lg font-bold text-[#2B2D42] font-serif italic leading-tight">Your Relationship Sanctuary</h4>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FFF0F3] text-[#FF4D6D] px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#FFCCD5]">
                <Lock className="w-3 h-3" /> Encrypted
              </div>
            </div>

            {/* If NOT paired or connection broken, show Pairing CTA banner */}
            {!isPaired ? (
              <div className="bg-[#FF4D6D] text-white p-5 rounded-3xl shadow-sm border border-[#FFCCD5] relative overflow-hidden flex flex-col gap-3">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15">
                  <Heart className="w-40 h-40 fill-white text-white" />
                </div>
                <h3 className="text-md font-bold font-serif italic tracking-tight">Love Link is Incomplete</h3>
                <p className="text-xs opacity-90 leading-relaxed font-semibold">
                  You cannot stream location vectors until paired with your partner. Generate a pairing code or connect using theirs.
                </p>
                <button
                  onClick={() => setCurrentScreen('pair')}
                  className="bg-white text-[#FF4D6D] font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-xs self-start hover:scale-105 active:scale-95 transition-all text-center"
                >
                  Link Up Now (Pair Partner)
                </button>
              </div>
            ) : (
              /* PAIRED COUPLE DASHBOARD VIEW */
              <>
                {/* Connected Partner card - Editorial Slate theme */}
                <div className="bg-[#2B2D42] text-white p-5 rounded-3xl shadow-sm flex flex-col gap-3 border border-[#2B2D42]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={partner.profilePicture}
                          alt={partner.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white ring-2 ring-[#FFCCD5]"
                        />
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          partner.status === 'online' ? 'bg-green-500' :
                          partner.status === 'moving' ? 'bg-amber-500' :
                          partner.status === 'paused' ? 'bg-neutral-800' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black tracking-widest text-[#FFF0F3]/70 uppercase">CONNECTED PARTNER</h4>
                        <h3 className="text-md font-bold font-serif italic tracking-tight leading-none mt-1 text-[#FFF0F3]">{partner.fullName}</h3>
                        <div className="flex items-center gap-1.5 mt-2 bg-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/5">
                          {partner.status === 'online' && <span>🟢 Online</span>}
                          {partner.status === 'moving' && <span>🟡 Commuting</span>}
                          {partner.status === 'offline' && <span>🔴 Offline / Inactive</span>}
                          {partner.status === 'paused' && <span>⚫ Location Paused</span>}
                        </div>
                      </div>
                    </div>

                    {/* Shared Battery / Power Telemetry syncing */}
                    <div className="flex flex-col items-end gap-1 font-mono text-[9px] text-white bg-white/10 p-2 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-1 leading-none">
                        {partner.isCharging ? '⚡ CHARGING' : 'BATTERY'}
                      </div>
                      <span className="text-xs font-black tracking-tight leading-none mt-1">
                        {partner.batteryPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Distance & Last Updated sync stats */}
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between font-bold text-[11px] gap-2">
                    <div className="flex items-center gap-1 text-[#FFF0F3]/90">
                      <MapPin className="w-3.5 h-3.5 text-[#FFCCD5]" />
                      <span>{formattedDist} Away</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#FFF0F3]/90">
                      <Clock className="w-3.5 h-3.5 text-[#FFCCD5]" />
                      <span>Synced {partner.lastSeen}</span>
                    </div>
                  </div>
                </div>

                {/* Main Sharing Privacy Controls Frame */}
                <div className="bg-white p-4 rounded-3xl border border-[#FFCCD5] shadow-xs flex flex-col gap-3">
                  <h4 className="text-[10px] font-black text-[#FF4D6D] uppercase tracking-widest">Privacy Consent & Device Broadcast</h4>
                  
                  <div className="flex items-center justify-between p-2.5 bg-[#FFF5F7]/30 rounded-2xl border border-[#FFCCD5]/50">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl text-white ${user.isLocationSharing && user.status !== 'paused' ? 'bg-[#FF4D6D]' : 'bg-[#8D99AE]'}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2B2D42] leading-tight">My Live Coordinates</h4>
                        <p className="text-[10px] text-[#2B2D42]/60 leading-tight">
                          {user.isLocationSharing && user.status !== 'paused' ? 'Currently broadcasting live' : 'Sharing disabled'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle */}
                    <button
                      onClick={toggleLocationSharing}
                      className={`w-11 h-6 rounded-full p-1 transition-all ${
                        user.isLocationSharing && user.status !== 'paused' ? 'bg-[#FF4D6D]' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${
                        user.isLocationSharing && user.status !== 'paused' ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Manual / Auto controls */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setCurrentScreen('map')}
                      className="flex items-center justify-center gap-1.5 py-3.5 bg-[#2B2D42] hover:bg-[#C9184A] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xs transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" /> View Map
                    </button>
                    <button
                      onClick={manualLocationRefresh}
                      disabled={isRefreshing}
                      className="flex items-center justify-center gap-1.5 py-3.5 bg-white hover:bg-[#FFF0F3] text-[#2B2D42] font-bold text-xs uppercase tracking-widest rounded-2xl border border-[#FFCCD5] shadow-xs transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#FF4D6D] ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>

                  {/* Quick self status toggles to notify partner */}
                  <div className="mt-2 text-center border-t border-[#FFCCD5]/50 pt-3">
                    <span className="text-[10px] font-black tracking-wider text-[#8D99AE] uppercase">My Active Status:</span>
                    <div className="flex gap-2 justify-center mt-2 flex-wrap">
                      {statuses.map((stat) => (
                        <button
                          key={stat}
                          onClick={() => changeStatus(stat)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            user.status === stat
                              ? 'bg-[#FF4D6D] text-white border-[#FF4D6D] scale-105 shadow-xs'
                              : 'bg-white text-gray-600 border-[#FFCCD5] hover:bg-[#FFF0F3]'
                          }`}
                        >
                          {stat === 'online' && '🟢 Active'}
                          {stat === 'moving' && '🟡 Commuting'}
                          {stat === 'offline' && '🔴 Inactive'}
                          {stat === 'paused' && '⚫ Paused'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts to Future Features in Capstone checklist */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setCurrentScreen('future_chat')}
                    className="bg-white p-3 rounded-2xl border border-pink-50 cursor-pointer hover:bg-pink-50/10 transition-all flex flex-col gap-2 shadow-xs group"
                  >
                    <div className="p-2 bg-pink-50 rounded-xl text-pink-500 self-start">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        In-App Chat <span className="text-[8px] bg-rose-50 text-rose-500 px-1 py-0.5 rounded-sm">Coming</span>
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-tight mt-1">Inter-couple direct texting and quick emoji snaps.</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentScreen('future_places')}
                    className="bg-white p-3 rounded-2xl border border-pink-50 cursor-pointer hover:bg-pink-50/10 transition-all flex flex-col gap-2 shadow-xs group"
                  >
                    <div className="p-2 bg-pink-50 rounded-xl text-pink-500 self-start">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        Geofence SOS <span className="text-[8px] bg-rose-50 text-rose-500 px-1 py-0.5 rounded-sm">Coming</span>
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-tight mt-1">Setup Home/Work geofences and alarms.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Emergency SOS Panic Button Card */}
            {isPaired && (
              <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center justify-between mt-1">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-red-100 text-red-600 rounded-2xl">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-red-800">EMERGENCY SOS BEACON</h4>
                    <p className="text-[10px] text-red-600/70 font-semibold leading-snug mt-0.5">Need immediate assistance? Tap to send an instant alert to partner.</p>
                  </div>
                </div>
                <button
                  onClick={triggerSOS}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl shadow-md transition-all self-center"
                >
                  PANIC
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Bottom Custom Tab Bar Navigation */}
          <div className="bg-white border-t border-[#FFCCD5] py-3.5 px-4 flex items-center justify-around sticky bottom-0 z-10 shrink-0">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                currentScreen === 'dashboard' ? 'text-[#FF4D6D]' : 'text-[#8D99AE]'
              }`}
            >
              <Heart className={`w-5 h-5 ${currentScreen === 'dashboard' ? 'fill-[#FF4D6D] text-[#FF4D6D]' : ''}`} />
              <span>Sancutary</span>
            </button>

            <button
              onClick={() => {
                if (isPaired) {
                  setCurrentScreen('map');
                } else {
                  setCurrentScreen('pair');
                }
              }}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                currentScreen === 'map' ? 'text-[#FF4D6D]' : 'text-[#8D99AE]'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>Map</span>
            </button>

            <button
              onClick={() => setCurrentScreen('profile')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                currentScreen === 'profile' ? 'text-[#FF4D6D]' : 'text-[#8D99AE]'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setCurrentScreen('settings')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                currentScreen === 'settings' ? 'text-[#FF4D6D]' : 'text-[#8D99AE]'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Pair Partner Screen */}
      {currentScreen === 'pair' && (
        <div className="flex-1 bg-white flex flex-col justify-between p-5 overflow-y-auto font-sans">
          <div>
            <button onClick={() => setCurrentScreen('dashboard')} className="flex items-center gap-1 text-xs font-bold text-[#8D99AE] hover:text-[#2B2D42] mb-6">
              <ChevronLeft className="w-4 h-4" /> Back to Sanctuary
            </button>

            <h2 className="text-xl font-bold font-serif italic text-[#2B2D42] tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FF4D6D]" /> Start Love Link
            </h2>
            <p className="text-xs text-[#8D99AE] font-semibold uppercase tracking-wider mt-1">Both users must explicitly connect together.</p>

            {/* User's own pairing code display */}
            <div className="mt-6 bg-[#FFF5F7]/70 p-4 rounded-3xl border border-[#FFCCD5] text-center flex flex-col items-center gap-2">
              <span className="text-[10px] font-black text-[#FF4D6D] uppercase tracking-widest leading-none">Your Unique Link Code</span>
              <span className="text-3xl font-black tracking-widest text-[#2B2D42] font-mono mt-1">
                {user.pairingCode}
              </span>
              <p className="text-[10px] text-[#2B2D42]/60 leading-normal font-semibold max-w-[200px] mt-1">
                Share this with your partner. Once they enter it, you guys will link up!
              </p>
            </div>

            {/* Input partner code */}
            <div className="mt-8 flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-[#8D99AE] uppercase tracking-widest">Connect Partner's Code</label>
              <input
                type="text"
                value={pairingCodeInput}
                onChange={(e) => setPairingCodeInput(e.target.value)}
                placeholder="LVR-XXXX"
                className="w-full bg-[#FFF5F7]/30 border border-[#FFCCD5] rounded-2xl px-4 py-3.5 text-center font-black tracking-widest font-mono text-lg text-[#2B2D42] outline-none focus:border-[#FF4D6D]"
              />
              {pairingError && <p className="text-[11px] font-semibold text-red-500 text-center leading-normal">{pairingError}</p>}
              
              <button
                onClick={handlePairSubmit}
                className="w-full py-4 bg-[#2B2D42] text-white font-bold text-xs uppercase tracking-widest rounded-2xl mt-3 shadow-md hover:bg-[#FF4D6D]"
              >
                Sync Mutual Consent Link
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 leading-normal max-w-xs mx-auto py-4">
            🔒 Unpaired user lists remain fully private. Zero tracking coordinates are recorded globally unless mutual paired link is active.
          </div>
        </div>
      )}

      {/* 8. Live Map Screen (Mobile Sub-Map view) */}
      {currentScreen === 'map' && (
        <div className="flex-1 flex flex-col h-full bg-[#FFF5F7]/30 relative font-sans">
          {/* Header overlay transparency */}
          <div className="absolute top-2 left-3 right-3 z-30 flex items-center justify-between">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="bg-white/95 backdrop-blur-xs p-2.5 rounded-full border border-[#FFCCD5] shadow-xs text-[#2B2D42]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="bg-[#2B2D42] text-white px-3.5 py-1.5 rounded-full border border-[#2B2D42] shadow-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${partner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{partner.fullName.split(' ')[0]} {formattedDist}</span>
            </div>
          </div>

          {/* Map Simulation Inside Phone Screen */}
          <div className="flex-1 relative bg-[#FFF5F7]/20 flex items-center justify-center p-4">
            <div className="text-center p-6 bg-white rounded-3xl border border-[#FFCCD5] shadow-xs max-w-[250px]">
              <MapPin className="w-10 h-10 text-[#FF4D6D] mx-auto mb-2 animate-bounce animate-duration-1000" />
              <h3 className="font-bold text-xs text-[#2B2D42] font-serif italic leading-snug">Active Map Session</h3>
              <p className="text-[10px] text-[#2B2D42]/70 leading-normal mt-1">
                You are currently tracking your partner in real-time. Please refer to the **Desktop Interactive Playground Grid Map** on the left screen to inspect and click to move pins!
              </p>
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="mt-4 w-full py-2 bg-[#FFF0F3] text-[#FF4D6D] hover:bg-[#FFF5F7] text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-[#FFCCD5]"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Quick Stats Overlay footer at map bottom */}
          <div className="absolute bottom-4 left-3 right-3 bg-[#2B2D42] text-white p-4 rounded-2xl border border-[#2B2D42] shadow-md flex items-center justify-between z-30">
            <div className="flex items-center gap-2.5">
              <div className="p-1 px-1.5 rounded-xl bg-[#FF4D6D] text-white font-bold text-[9px] flex items-center gap-0.5">
                <Battery className="w-3.5 h-3.5 shrink-0" />
                <span>{partner.batteryPercentage}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold leading-none text-[#FFF0F3] mt-0.5 uppercase tracking-wider">{partner.fullName.split(' ')[0]} Commuting</span>
                <span className="text-[8px] text-white/50 mt-1 font-semibold uppercase tracking-widest">Synced {partner.lastSeen}</span>
              </div>
            </div>
            
            <button
              onClick={manualLocationRefresh}
              className="p-2.5 bg-[#FF4D6D] text-white rounded-full shadow-xs hover:bg-[#C9184A] transition-colors"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </button>
          </div>
        </div>
      )}

      {/* 9. Notifications Screen */}
      {currentScreen === 'notifications' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden font-sans">
          <div className="p-5 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <button onClick={() => setCurrentScreen('dashboard')} className="flex items-center gap-1 text-xs font-bold text-[#8D99AE] hover:text-[#2B2D42]">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={onClearNotifications} className="text-[10px] font-black text-[#FF4D6D] hover:underline uppercase tracking-wide">
                Clear All
              </button>
            </div>

            <h2 className="text-xl font-bold font-serif italic text-[#2B2D42] tracking-tight shrink-0 flex items-center gap-1.5">
              📬 Notifications Inbox
            </h2>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-2">
              {filterNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 opacity-55">
                  <Bell className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-xs font-bold text-gray-500">Your feed is pristine!</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Events like partner status updates appear here.</p>
                </div>
              ) : (
                filterNotifications.map((noti) => (
                  <div
                    key={noti.id}
                    className={`p-3.5 rounded-2xl border flex items-start gap-2.5 transition-all leading-normal ${
                      noti.type === 'emergency' ? 'bg-[#FFF0F3] border-red-200 text-red-950' :
                      noti.type === 'pair_accepted' ? 'bg-green-50 border-green-100 text-green-950' : 'bg-white border-[#FFCCD5] text-[#2B2D42]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {noti.type === 'emergency' ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> :
                       noti.type === 'pair_accepted' ? <Check className="w-3.5 h-3.5 text-green-500" /> :
                       noti.type === 'sharing_stop' ? <Sliders className="w-3.5 h-3.5 text-gray-400" /> : <Sparkles className="w-3.5 h-3.5 text-[#FF4D6D]" />}
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 text-left">
                      <span className="text-[11px] font-bold leading-tight tracking-tight text-[#2B2D42]">{noti.title}</span>
                      <span className="text-[10px] leading-snug mt-0.5 text-[#2B2D42]/70 font-medium">{noti.message}</span>
                      <span className="text-[8px] text-[#8D99AE] font-black self-start mt-1 uppercase tracking-widest">{noti.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div />
        </div>
      )}

      {/* 10. Profile Screen */}
      {currentScreen === 'profile' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-y-auto">
          <div className="p-5 font-sans">
            <button onClick={() => setCurrentScreen('dashboard')} className="flex items-center gap-1 text-xs font-bold text-[#8D99AE] hover:text-[#2B2D42] mb-5">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-bold font-serif italic text-[#2B2D42] tracking-tight flex items-center gap-1.5 mb-6">
              👤 Personal Canvas
            </h2>

            {/* Profile Avatar Frame */}
            <div className="flex flex-col items-center text-center gap-3 bg-[#FFF5F7]/30 p-4 rounded-3xl border border-[#FFCCD5]">
              <div className="relative">
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => alert("Upload a cute couple style custom selfie!")}
                  className="absolute bottom-0 right-0 p-1 bg-[#FF4D6D] text-white rounded-full border border-white hover:scale-105 active:scale-95 transition-all shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="font-bold font-serif italic text-base text-[#2B2D42]">{user.fullName}</h3>
                <p className="text-[10px] text-[#8D99AE] font-semibold">{user.email}</p>
              </div>
            </div>

            {/* Couple Bond Link info */}
            <div className="mt-5 flex flex-col gap-3">
              <h4 className="text-[10px] font-black text-[#FF4D6D] uppercase tracking-widest">Active Relationships</h4>
              
              {isPaired ? (
                <div className="p-3.5 bg-[#FFF5F7]/30 rounded-2xl border border-[#FFCCD5] flex items-center justify-between leading-none">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={partner.profilePicture}
                      alt={partner.fullName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#FFCCD5]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#2B2D42]">{partner.fullName}</h4>
                      <p className="text-[9px] text-[#8D99AE] mt-1">Paired since Jun 2026</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Disconnect partner? You won't be able to track each other until re-pairing.")) {
                        onUnpair();
                        setCurrentScreen('dashboard');
                      }
                    }}
                    className="p-2 hover:bg-rose-50 text-[#FF4D6D] rounded-xl border border-[#FFCCD5] bg-white shadow-xs transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                  >
                    <Unlink className="w-3.5 h-3.5" /> Unlink
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-yellow-50 rounded-2xl border border-yellow-100/50 flex flex-col gap-2">
                  <p className="text-xs text-yellow-800 font-semibold leading-normal">
                    You currently have zero active connected soulmates. Pair up to unlock instant vector GPS tracking.
                  </p>
                  <button
                    onClick={() => setCurrentScreen('pair')}
                    className="bg-white text-yellow-700 font-bold border border-yellow-250 py-1.5 rounded-lg text-[10px] shadow-xs"
                  >
                    Sync Pairing Code
                  </button>
                </div>
              )}
            </div>

            {/* Quick stats panel */}
            <div className="mt-5 flex flex-col gap-3">
              <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Future Placeholders</h4>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setCurrentScreen('future_history')}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-rose-50/10 flex items-center gap-2"
                >
                  <History className="w-4 h-4 text-pink-500" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-gray-700">Commute History</span>
                    <span className="text-[8px] text-gray-400 font-medium">Capture trails</span>
                  </div>
                </div>

                <div
                  onClick={() => setCurrentScreen('future_gallery')}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-rose-50/10 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-gray-700">Photo Scrapbook</span>
                    <span className="text-[8px] text-gray-400 font-medium">Share memories</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Log Out Button at bottom */}
          <div className="p-5 shrink-0">
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setCurrentScreen('splash');
                onUpdateUser(userId, { status: 'offline' });
                onAddNotification(userId === 'alex' ? 'taylor' : 'alex', 'Partner offline', `${user.fullName} logged out of application.`, 'status_change');
              }}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-2xl transition-all border border-rose-100 shadow-xs flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Log Out From Device
            </button>
          </div>
        </div>
      )}

      {/* 11. Settings Screen */}
      {currentScreen === 'settings' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-y-auto">
          <div className="p-5">
            <button onClick={() => setCurrentScreen('dashboard')} className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-5">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-1.5 mb-6">
              ⚙️ Client Settings
            </h2>

            {/* Custom Refresh interval settings */}
            <div className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100/40">
              <div className="flex flex-col gap-1.5 text-left select-none">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Auto Map Stream Interval</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['5s', '10s', '30s'].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => {
                        setRefreshInterval(interval);
                        onAddNotification(userId, 'Settings Updated', `Automatic refresh interval changed to ${interval}`, 'status_change');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                        refreshInterval === interval
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500'
                          : 'bg-white text-gray-600 border-rose-100/50 hover:bg-rose-50/20'
                      }`}
                    >
                      {interval === '5s' ? '🔥 5 sec (Fast)' : interval === '10s' ? '⚡ 10 sec' : '🐢 30 sec'}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-medium leading-none">Faster intervals synchronize live location markers instantly.</p>
              </div>

              {/* Push Notifications simulation toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-gray-800">Push Notifications alerts</h4>
                  <p className="text-[10px] text-gray-400">Trigger warnings when partner changes status</p>
                </div>
                {/* Simple Checkbox switch styled as toggle */}
                <button
                  type="button"
                  onClick={() => setPushEnabled(!pushEnabled)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-all ${pushEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-all ${pushEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Advanced Geofence accuracy setup */}
              <div className="flex flex-col gap-1.5 text-left border-t border-slate-100 pt-3 select-none">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">GPS Tracking Precision</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['high', 'saver'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTrackingAccuracy(mode)}
                      className={`py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                        trackingAccuracy === mode
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500'
                          : 'bg-white text-slate-600 border-rose-100/50 hover:bg-rose-50/20'
                      }`}
                    >
                      {mode === 'high' ? '🎯 High Precision' : '🔋 Battery Saver'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dark mode simulation banner */}
            <div className="mt-4 p-3 bg-rose-50/35 border border-pink-100 hover:bg-rose-50/60 transition-all rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Dark Mode (Placeholder)</span>
              <span className="text-[9px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-md font-bold border border-rose-100">Coming Soon</span>
            </div>
          </div>

          {/* Delete Account & Disconnect buttons at bottom */}
          <div className="p-5 mt-auto flex flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                if (confirm("🚨 WARNING: Are you absolutely sure you want to permanently delete your Loc-Ker Lover account? All historical location beacons and coupling connections will be scrubbed from Supabase PostgreSQL database.")) {
                  onDeleteAccount();
                  setCurrentScreen('splash');
                  setIsAuthenticated(false);
                }
              }}
              className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-2xl transition-all border border-red-100 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Delete Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* 12. Future Feature Placeholders Screen: Chat */}
      {currentScreen === 'future_chat' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden">
          <div className="p-4 bg-pink-50/40 border-b border-pink-100 flex items-center gap-2.5 shrink-0 justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentScreen('dashboard')} className="p-1 rounded-full text-gray-500 hover:bg-slate-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <img src={partner.profilePicture} alt={partner.fullName} className="w-7 h-7 rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white bg-green-500" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-800 leading-none">{partner.fullName.split(' ')[0]}</span>
                <span className="text-[8px] text-gray-400 mt-1 font-bold">Active in chat room</span>
              </div>
            </div>

            <span className="text-[8px] font-black bg-rose-50 border border-rose-100 text-rose-500 px-2 py-0.5 rounded-md">ALPHA PREVIEW</span>
          </div>

          {/* Chat scrolling log */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <div className="text-center py-2 shrink-0">
              <span className="text-[9px] font-black tracking-widest text-gray-400 bg-slate-50 px-2.5 py-1 rounded-full border uppercase">Love Lounge Sync Channel</span>
            </div>

            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-45 py-12">
                <Smile className="w-10 h-10 text-gray-400 mb-1" />
                <p className="text-xs font-bold text-gray-500">Zero messages sent yet</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Use quick text tags below to test real-time chat sync!</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs font-medium leading-normal leading-relaxed ${
                      isMe ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-tr-xs' : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-gray-400 mt-1 font-bold uppercase">{msg.timestamp}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Box with preset love tags */}
          <div className="p-3 border-t border-rose-50 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {['I am on my way! 🚗', 'Near you! ❤️', 'Where are you? 👀', 'Pick up coffee? ☕', 'Love you! 😘'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => onSendChatMessage(tag)}
                  className="text-[10px] font-bold text-pink-650 bg-rose-50 hover:bg-rose-100/50 px-2.5 py-1 rounded-full whitespace-nowrap border border-pink-100/50"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a private message..."
                className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-xs border border-slate-100 outline-none focus:border-pink-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    onSendChatMessage(chatInput.trim());
                    setChatInput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (chatInput.trim()) {
                    onSendChatMessage(chatInput.trim());
                    setChatInput('');
                  }
                }}
                className="bg-pink-500 text-white p-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Future Feature Placeholders Screen: Places (Geofencing rules showcase) */}
      {currentScreen === 'future_places' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-y-auto p-5">
          <div>
            <button onClick={() => setCurrentScreen('dashboard')} className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-5">
              <ChevronLeft className="w-4 h-4" /> Back Settings
            </button>

            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-1.5">
              🏢 Smart Places & Geofencing
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-normal">
              Simulate automatic geofence push signals and arrival notification triggers for the couple.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              {PRESET_PLACES.map((place) => (
                <div key={place.id} className="p-3 bg-slate-55 border border-slate-150/40 rounded-2xl flex items-center justify-between leading-none text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                      {place.type === 'home' ? <Home className="w-4 h-4" /> :
                       place.type === 'work' ? <Briefcase className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold text-gray-800">{place.name}</h4>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5 mt-1 tracking-wider">
                        Geofence: {place.radius}m Radius • Active
                      </p>
                    </div>
                  </div>

                  <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-md">
                    ALARM ACTIVE
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert("Create a custom family/couple safe-haven geofenced sanctuary!")}
              className="mt-4 w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-2xl transition-all border border-rose-150/40 flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Saved Place Beacon
            </button>
          </div>

          <div className="bg-rose-50/30 p-3.5 rounded-2xl border border-pink-100 text-[10px] text-slate-500 font-medium leading-normal leading-relaxed text-center mt-6">
            💡 **Geofencing Concept**: Both partners will automatically receive a mobile push notify event instantly when either crosses a 100m geofence.
          </div>
        </div>
      )}

      {/* 14. Future Feature Placeholders Screen: History */}
      {currentScreen === 'future_history' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-y-auto p-5">
          <div>
            <button onClick={() => setCurrentScreen('profile')} className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-5">
              <ChevronLeft className="w-4 h-4" /> Back to Profile
            </button>

            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-1.5">
              🏝️ Travel Trails / History Space
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-normal">
              Browse historical travel trails and common paths shared mutually during week's date adventures.
            </p>

            <div className="mt-8 relative border-l-2 border-dashed border-rose-200 pl-4 ml-2 flex flex-col gap-6 text-left">
              <div className="relative">
                <span className="absolute -left-[23px] top-0 w-3 h-3 bg-pink-500 rounded-full border border-white ring-4 ring-pink-100" />
                <h4 className="text-xs font-bold text-slate-800">Lovers Point Lookout Picnic</h4>
                <p className="text-[10px] text-slate-400 mt-1">Simulated Trail • Monday, 5:30 PM</p>
                <p className="text-[10px] text-gray-600 leading-normal mt-1">Both of you met up for sunset scenery lookout watching date.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[23px] top-0 w-3 h-3 bg-pink-500 rounded-full border border-white ring-4 ring-pink-100" />
                <h4 className="text-xs font-bold text-slate-800">Sweethearts Cafe Connect</h4>
                <p className="text-[10px] text-slate-400 mt-1">Simulated Trail • Sunday, 11:20 AM</p>
                <p className="text-[10px] text-gray-600 leading-normal mt-1">Alex checked out a cozy cappuccino while waiting for Taylor.</p>
              </div>
            </div>
          </div>

          <div />
        </div>
      )}

      {/* 15. Future Feature Placeholders Screen: Gallery */}
      {currentScreen === 'future_gallery' && (
        <div className="flex-1 bg-white flex flex-col justify-between overflow-y-auto p-5">
          <div>
            <button onClick={() => setCurrentScreen('profile')} className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-5">
              <ChevronLeft className="w-4 h-4" /> Back to Profile
            </button>

            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-1.5">
              📸 Mutual Photo Scrapbook
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-normal">
              Collaborative space to snap and pin sweet scenery memories right next to location beacons.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <div className="relative rounded-2xl overflow-hidden aspect-square border group shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=300"
                  alt="Cozy Cafe Meeting"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 flex items-end">
                  <span className="text-[9px] font-bold text-white">Cafe Coffee Meet ❤️</span>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-square border group shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300"
                  alt="Sunset walk"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 flex items-end">
                  <span className="text-[9px] font-bold text-white">Sunset Walk 🌅</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert("Pin a cute memory!")}
              className="mt-4 w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-2xl transition-all border border-rose-150/40 flex items-center justify-center gap-1"
            >
              <Camera className="w-4 h-4" /> Pin New Memory Selfie
            </button>
          </div>

          <div />
        </div>
      )}
    </div>
  );
}
