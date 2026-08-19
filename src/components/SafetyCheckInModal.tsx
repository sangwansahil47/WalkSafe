import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, PhoneCall, AlertCircle } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';

interface SafetyCheckInModalProps {
  isOpen: boolean;
  reasons: string[];
  onSafe: () => void;
  onNeedHelp: () => void;
  onSOS: () => void;
  onCountdownExpire: () => void;
  primaryContactName?: string;
}

export const SafetyCheckInModal: React.FC<SafetyCheckInModalProps> = ({
  isOpen,
  reasons,
  onSafe,
  onNeedHelp,
  onSOS,
  onCountdownExpire,
  primaryContactName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="safety-checkin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="safety-checkin-modal-card"
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Safety Verification Check-In
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Autonomous wellbeing monitoring prompt
            </p>
          </div>
        </div>

        {/* Message body */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-900">
            Telemetry Anomaly Detected:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium">
            {reasons.length > 0 ? (
              reasons.map((r, i) => <li key={i} className="leading-snug">{r}</li>)
            ) : (
              <>
                <li>Trajectory deviated &gt; 200m from scheduled corridor</li>
                <li>Prolonged stationary inactivity interval</li>
              </>
            )}
          </ul>
        </div>

        {/* Question & Countdown */}
        <div className="text-center py-1">
          <p className="text-sm font-bold text-slate-900">Are you safe?</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-escalation dispatches to <strong>{primaryContactName ? primaryContactName : 'Primary Guardian'}</strong>:
          </p>
          <CountdownTimer initialSeconds={60} onExpire={onCountdownExpire} isActive={isOpen} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* I'M SAFE */}
          <button
            id="modal-btn-im-safe"
            onClick={onSafe}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I'M SAFE — CONTINUE JOURNEY</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* I NEED HELP */}
            <button
              id="modal-btn-need-help"
              onClick={onNeedHelp}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>I NEED HELP</span>
            </button>

            {/* DIRECT SOS */}
            <button
              id="modal-btn-sos"
              onClick={onSOS}
              className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>EMERGENCY SOS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
