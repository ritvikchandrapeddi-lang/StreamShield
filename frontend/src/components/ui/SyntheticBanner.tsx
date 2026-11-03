import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface SyntheticBannerProps {
  label?: string;
  className?: string;
}

export const SyntheticBanner: React.FC<SyntheticBannerProps> = ({
  label = 'SYNTHETIC DEMO ENVIRONMENT — Data and metrics shown are simulated fixtures for architecture evaluation. No real customer PII or production liabilities exist.',
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-surface border border-border shadow-subtle text-xs text-navy-600 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Info className="w-3.5 h-3.5 text-coral-500 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>Privacy Zero-PII</span>
      </div>
    </div>
  );
};

