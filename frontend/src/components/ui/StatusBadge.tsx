import React from 'react';
import { Decision, CaseStatus } from '../../types';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, ShieldX, AlertCircle, ArrowUpRight } from 'lucide-react';

interface StatusBadgeProps {
  status: Decision | CaseStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'approved':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70',
            className
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    case 'review':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70',
            className
          )}
        >
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Under Review</span>
        </span>
      );
    case 'blocked':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200/70',
            className
          )}
        >
          <ShieldX className="w-3 h-3 text-red-600" />
          <span>Blocked</span>
        </span>
      );
    case 'open':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/70',
            className
          )}
        >
          <AlertCircle className="w-3 h-3 text-blue-600" />
          <span>Open</span>
        </span>
      );
    case 'investigating':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200/70',
            className
          )}
        >
          <Clock className="w-3 h-3 text-purple-600" />
          <span>Investigating</span>
        </span>
      );
    case 'escalated':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200/70',
            className
          )}
        >
          <ArrowUpRight className="w-3 h-3 text-orange-600" />
          <span>Escalated</span>
        </span>
      );
    case 'resolved':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80',
            className
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-slate-500" />
          <span>Resolved</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200',
            className
          )}
        >
          {status}
        </span>
      );
  }
};

