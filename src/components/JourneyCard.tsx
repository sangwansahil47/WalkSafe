import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Clock, Calendar } from 'lucide-react';
import { Journey } from '../types';
import { RiskBadge } from './RiskBadge';

export const JourneyCard: React.FC<{ journey: Journey }> = ({ journey }) => {
  const isCompleted = journey.status === 'COMPLETED';
  const isAlert = journey.status === 'ALERT' || journey.status === 'SOS';
  const isActive = journey.status === 'ACTIVE';

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all bg-white shadow-sm hover:border-slate-300 ${
        isAlert
          ? 'border-rose-300 ring-1 ring-rose-200'
          : isActive
          ? 'border-emerald-300 ring-1 ring-emerald-200'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <RiskBadge level={journey.riskLevel} score={journey.riskScore} size="sm" />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              isCompleted
                ? 'bg-slate-100 text-slate-600'
                : isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {journey.status}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(journey.startTime)}</span>
        </div>
      </div>

      {/* Origin -> Destination Route */}
      <div className="my-3.5 flex items-center gap-2 text-slate-900 font-bold text-sm">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
          <span className="truncate">{journey.startLocation.name || 'Start Point'}</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="truncate">{journey.destination.name}</span>
        </div>
      </div>

      {/* Meta duration & signals summary */}
      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1 border border-slate-100">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            Expected: {journey.expectedDuration} mins
          </span>
          <span className="text-slate-500">Started: {formatTime(journey.startTime)}</span>
        </div>
        {journey.lastRiskAnalysis?.summary && (
          <p className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60 font-medium">
            {journey.lastRiskAnalysis.summary}
          </p>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-3.5 flex items-center justify-end">
        <Link
          to={`/journey/${journey.id}`}
          className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <span>{isActive ? 'Live Telemetry' : 'View Incident Record'}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
