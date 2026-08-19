import React from 'react';
import { AlertCircle, ShieldAlert, Phone, Clock, MapPin, Send, Info } from 'lucide-react';
import { SafetyAlert } from '../types';
import { RiskBadge } from './RiskBadge';

export const AlertCard: React.FC<{ alert: SafetyAlert }> = ({ alert }) => {
  const isSOS = alert.type === 'SOS';
  const isAutoEscalate = alert.type === 'AUTO_ESCALATION';

  const getTypeLabel = () => {
    switch (alert.type) {
      case 'SOS':
        return 'Direct Emergency SOS';
      case 'AUTO_ESCALATION':
        return 'Automatic Escalation (Check-In Timeout)';
      case 'USER_REQUESTED_HELP':
        return 'User Requested Assistance';
      default:
        return 'Safety Alert';
    }
  };

  const getStatusBadge = () => {
    if (alert.notificationStatus === 'DEMO_SENT' || alert.simulatedNotification) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          <Info className="w-3 h-3 text-slate-500" />
          SIMULATED LOG
        </span>
      );
    }
    if (alert.notificationStatus === 'SENT') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Send className="w-3 h-3 text-emerald-600" />
          DISPATCHED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
        {alert.notificationStatus}
      </span>
    );
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all bg-white shadow-sm ${
        isSOS
          ? 'border-rose-300 ring-1 ring-rose-100'
          : isAutoEscalate
          ? 'border-amber-300 ring-1 ring-amber-100'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
              isSOS ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {isSOS ? <ShieldAlert className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
              {getTypeLabel()}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
              <Clock className="w-3 h-3" />
              {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="sm" />
          {getStatusBadge()}
        </div>
      </div>

      {/* Incident Reason Log */}
      <div className="mt-4 bg-slate-900 text-slate-100 rounded-lg p-3.5 text-xs font-mono">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
          System Incident Trigger
        </p>
        <p className="text-slate-200 font-sans text-xs font-medium">
          {alert.reason}
        </p>
      </div>

      {/* Primary Contact Notified & Coordinates */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">
              {alert.contactNotified?.name || 'Primary Guardian'}
            </p>
            <p className="text-slate-500 font-mono text-[11px]">
              {alert.contactNotified?.phone || '+91 98111 22334'} • {alert.contactNotified?.relationship || 'Emergency Contact'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">GPS Coordinates</p>
            <p className="text-slate-500 font-mono text-[11px]">
              {alert.lastKnownLocation.latitude.toFixed(4)}, {alert.lastKnownLocation.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
