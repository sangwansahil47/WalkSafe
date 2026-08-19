import React, { useState } from 'react';
import { PlayCircle, Compass, PauseCircle, Clock, AlertOctagon, PhoneCall, Sparkles } from 'lucide-react';

interface DemoModeBarProps {
  onSimulate: (eventType: 'NORMAL' | 'ROUTE_DEVIATION' | 'INACTIVITY' | 'MISSED_CHECKIN' | 'HIGH_RISK' | 'SOS') => Promise<void>;
  disabled?: boolean;
}

export const DemoModeBar: React.FC<DemoModeBarProps> = ({ onSimulate, disabled = false }) => {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);

  const handleAction = async (type: 'NORMAL' | 'ROUTE_DEVIATION' | 'INACTIVITY' | 'MISSED_CHECKIN' | 'HIGH_RISK' | 'SOS') => {
    setActiveSimulation(type);
    try {
      await onSimulate(type);
    } finally {
      setActiveSimulation(null);
    }
  };

  return (
    <div
      id="demo-mode-panel"
      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-sm mb-8"
    >
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
            Telemetry Simulation Engine • Demo Controls
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Instantaneous sensor trigger overrides
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* NORMAL */}
        <button
          id="btn-demo-normal"
          onClick={() => handleAction('NORMAL')}
          disabled={disabled || !!activeSimulation}
          className="flex flex-col items-start p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all text-left group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-white group-hover:text-emerald-400">Normal</span>
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-400">Score 18 • Low</span>
        </button>

        {/* ROUTE DEVIATION */}
        <button
          id="btn-demo-deviation"
          onClick={() => handleAction('ROUTE_DEVIATION')}
          disabled={disabled || !!activeSimulation}
          className="flex flex-col items-start p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all text-left group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-white group-hover:text-amber-400">Deviation</span>
            <Compass className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400">Score 43 • Moderate</span>
        </button>

        {/* INACTIVITY */}
        <button
          id="btn-demo-inactivity"
          onClick={() => handleAction('INACTIVITY')}
          disabled={disabled || !!activeSimulation}
          className="flex flex-col items-start p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all text-left group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-white group-hover:text-orange-400">Inactivity</span>
            <PauseCircle className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <span className="text-[10px] text-slate-400">Score 68 • High</span>
        </button>

        {/* MISSED CHECK-IN */}
        <button
          id="btn-demo-missed-checkin"
          onClick={() => handleAction('MISSED_CHECKIN')}
          disabled={disabled || !!activeSimulation}
          className="flex flex-col items-start p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all text-left group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-white group-hover:text-rose-400">Check-in Expired</span>
            <Clock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-[10px] text-slate-400">Score 88 • Critical</span>
        </button>

        {/* HIGH RISK */}
        <button
          id="btn-demo-high-risk"
          onClick={() => handleAction('HIGH_RISK')}
          disabled={disabled || !!activeSimulation}
          className="flex flex-col items-start p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all text-left group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-white group-hover:text-red-400">High Risk</span>
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-[10px] text-slate-400">Score 75 • Check-in</span>
        </button>

        {/* SOS */}
        <button
          id="btn-demo-sos"
          onClick={() => handleAction('SOS')}
          disabled={disabled || !!activeSimulation}
          className="flex flex-col items-start p-3 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 rounded-lg transition-all text-left group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-rose-200">Trigger SOS</span>
            <PhoneCall className="w-3.5 h-3.5 text-rose-300" />
          </div>
          <span className="text-[10px] text-rose-400 font-medium">Instant Dispatch</span>
        </button>
      </div>
    </div>
  );
};
