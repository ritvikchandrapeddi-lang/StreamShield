import React from 'react';
import { RiskLevel } from '../../types';
import { cn } from '../../lib/utils';
import { AlertTriangle, ShieldCheck, Flame, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  score?: number;
  level: RiskLevel;
  showIcon?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  level,
  showIcon = true,
  className,
}) => {
  const configs = {
    critical: {
      label: 'Critical',
      bg: 'bg-red-50 text-red-800 border-red-200/80',
      dot: 'bg-red-600',
      icon: Flame,
    },
    high: {
      label: 'High',
      bg: 'bg-orange-50 text-orange-800 border-orange-200/80',
      dot: 'bg-orange-600',
      icon: AlertTriangle,
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dot: 'bg-amber-500',
      icon: AlertCircle,
    },
    low: {
      label: 'Low',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
    },
  };

  const current = configs[level] || configs.low;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border font-mono tracking-tight select-none',
        current.bg,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-semibold opacity-90 pl-0.5">({score})</span>
      )}
    </span>
  );
};

