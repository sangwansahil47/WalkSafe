import React from 'react';
import { RiskLevel } from '../types';

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, level, size = 'md', showLabel = true }) => {
  const getProgressColor = () => {
    switch (level) {
      case 'LOW':
        return 'stroke-emerald-500 text-emerald-600';
      case 'MODERATE':
        return 'stroke-amber-500 text-amber-600';
      case 'HIGH':
        return 'stroke-orange-500 text-orange-600';
      case 'CRITICAL':
        return 'stroke-rose-600 text-rose-600';
      default:
        return 'stroke-slate-500 text-slate-600';
    }
  };

  const getTrackColor = () => {
    return 'stroke-slate-100';
  };

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-22 h-22 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`${getTrackColor()} stroke-[7] fill-none`}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`${getProgressColor().split(' ')[0]} stroke-[7] fill-none transition-all duration-700 ease-out`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono leading-none">
            {score}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Real-time Risk Level
          </span>
          <span className={`text-xl font-bold tracking-tight mt-0.5 ${getProgressColor().split(' ')[1]}`}>
            {level}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 font-medium">
            {level === 'LOW' && 'Telemetry within standard corridor bounds'}
            {level === 'MODERATE' && 'Active tracking for deviation signals'}
            {level === 'HIGH' && 'Safety check-in prompt engaged'}
            {level === 'CRITICAL' && 'Immediate escalation threshold active'}
          </span>
        </div>
      )}
    </div>
  );
};
