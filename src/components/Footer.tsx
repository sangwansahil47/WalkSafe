import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 text-slate-500 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-4">
        {/* Safety Disclaimer Callout */}
        <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-center gap-2.5 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="leading-snug">
            <strong>Safety Protocol:</strong> WalkSafe AI is an assistive risk monitoring companion. It does not replace local emergency dispatch authorities (Dial 112 / 911 in an active life-threatening crisis).
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs tracking-tight">
          <div className="w-4 h-4 bg-slate-900 rounded flex items-center justify-center text-white">
            <Shield className="w-2.5 h-2.5 fill-white" />
          </div>
          <span>WalkSafe AI — Enterprise Safety & Telemetry Architecture</span>
        </div>

        <p className="text-[11px] text-slate-400 max-w-md">
          Continuous anomaly detection • Deterministic scoring matrix • Autonomous guardian escalation
        </p>
      </div>
    </footer>
  );
};
