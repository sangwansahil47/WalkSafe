import React, { useState } from 'react';
import {
  User,
  Shield,
  Phone,
  Mail,
  Lock,
  Cpu,
  CheckCircle2,
  Sliders,
  Bell,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, primaryContact } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    deviationSensitivity: 'Standard (200m)',
    inactivityThreshold: '10 Minutes',
    lateNightMonitoring: true,
    voiceCallSimulation: true,
    smsAlerts: true,
    batteryThreshold: '15%',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
              <User className="w-4 h-4" />
            </span>
            Profile & Safety Architecture Rules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage account credentials, deterministic scoring matrices, and automated notification channels.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-lg p-3.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Security parameters updated successfully.</span>
        </div>
      )}

      {/* Grid: User Profile + Guardian Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-400 font-mono">User ID: {user?.id.substring(0, 12)}...</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Email</span>
              <span className="font-medium text-slate-800">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Phone</span>
              <span className="font-mono text-slate-800">{user?.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Role</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px]">
                SOLO TRAVELER
              </span>
            </div>
          </div>
        </div>

        {/* Primary Guardian Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 font-bold text-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {primaryContact ? primaryContact.name : 'Sunita Sharma'}
              </h2>
              <p className="text-xs text-slate-400">Designated Primary Guardian</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Relationship</span>
              <span className="font-medium text-slate-800">
                {primaryContact ? primaryContact.relationship : 'Mother'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Alert Hotline</span>
              <span className="font-mono text-slate-800">
                {primaryContact ? primaryContact.phone : '+91 98111 22334'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Dispatch Priority</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                TIER 1 PRIMARY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety System Scoring Parameters */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
          <Cpu className="w-4 h-4 text-slate-900" />
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Deterministic Safety Engine Specifications
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Corridor Deviation Limit
            </span>
            <p className="font-bold text-slate-900 text-sm">200 Meters</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Triggers +25 risk points when path deviates beyond corridor threshold.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Stationary Inactivity
            </span>
            <p className="font-bold text-slate-900 text-sm">10 Minutes</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Adds +20 risk points when speed &lt; 0.5 km/h unexpectedly mid-route.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Check-in Window
            </span>
            <p className="font-bold text-slate-900 text-sm">60 Seconds</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Auto-escalates directly to guardian if safety prompt is not acknowledged.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-1 text-xs">
          <p className="font-bold text-white text-sm">
            Continuous Protection Policy
          </p>
          <p className="text-slate-300 leading-relaxed font-normal">
            SafeWalk AI is built for proactive prevention — recognizing risk signals early before an emergency unfolds. When you commute, always keep device GPS location active and ensure battery levels remain above 20%.
          </p>
        </div>
      </div>
    </div>
  );
};
