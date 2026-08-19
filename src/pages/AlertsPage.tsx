import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, RefreshCw, Send, Radio } from 'lucide-react';
import { alertService } from '../services/alertService';
import { SafetyAlert } from '../types';
import { AlertCard } from '../components/AlertCard';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const list = await alertService.getAlerts();
      setAlerts(list);
    } catch (err) {
      console.warn('Failed to load alert audit log:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-black">
              <AlertTriangle className="w-4 h-4" />
            </span>
            Emergency Alert & Dispatch Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete compliance ledger of emergency transmissions, auto-escalations, and contact alerts.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Protocol Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Dispatch Audit Protocol
        </p>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          All automated alerts and direct SOS triggers generate persistent immutable records including precise timestamp, GPS coordinate telemetry, AI risk score calculation, and recipient notification delivery status.
        </p>
      </div>

      {/* Alerts Ledger */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
          <span>Loading dispatch audit logs...</span>
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Emergency Incidents Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            No active escalations or SOS dispatches have occurred on your profile.
          </p>
        </div>
      )}
    </div>
  );
};
