import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, className = '', size = 'md' }) => {
  const getColors = () => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'LOW RISK',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'MODERATE',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500 animate-pulse',
          label: 'HIGH RISK',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-600 animate-ping',
          label: 'CRITICAL',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: 'NORMAL',
        };
    }
  };

  const { bg, dot, label } = getColors();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-bold',
    md: 'text-xs font-bold px-2.5 py-1 gap-1.5',
    lg: 'text-xs font-extrabold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wider uppercase font-sans ${bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{label}</span>
      {score !== undefined && <span className="opacity-80 font-mono text-[10px]">({score}/100)</span>}
    </span>
  );
};
