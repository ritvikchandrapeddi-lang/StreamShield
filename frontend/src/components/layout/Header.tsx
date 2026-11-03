import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const routeTitleMap: Record<string, string> = {
  '/': 'Overview Dashboard',
  '/dashboard': 'Overview Dashboard',
  '/transactions': 'Transaction Monitor',
  '/money-trail': 'Money Trail Explorer',
  '/fraud-lab': 'Fraud Intelligence Lab',
  '/investigations': 'Case Investigations',
  '/model-performance': 'Model Performance',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const currentTitle = routeTitleMap[location.pathname] || 'StreamShield';
  const [showNotifications, setShowNotifications] = useState(false);

  const mockAlerts = [
    { id: 1, title: 'High Fan-In Triggered', vpa: 'fastpay_drop88@paytm', time: '2m ago', severity: 'critical' },
    { id: 2, title: 'Structuring Flag ₹49,999', vpa: 'crypto_vault_quick@kotak', time: '8m ago', severity: 'high' },
    { id: 3, title: 'Mule Ring Quarantined', vpa: 'Syndicate Falcon', time: '14m ago', severity: 'medium' },
  ];

  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between shadow-subtle shrink-0 relative z-20">
      {/* Breadcrumb & Screen Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-navy-400">StreamShield</span>
        <span className="text-navy-300">/</span>
        <h1 className="text-sm font-semibold text-navy-900">{currentTitle}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 text-xs">
        {/* Synthetic Data Mode Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-border">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-navy-600 text-[11px]">DEMO MODE: Synthetic UPI Feed</span>
        </div>

        {/* Security verification */}
        <div className="hidden lg:flex items-center gap-1.5 text-navy-500 font-medium text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Deterministic Audit Active</span>
        </div>

        {/* Notification Bell with Demo Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md hover:bg-surface-subtle text-navy-600 transition-colors focus:outline-none"
            title="Real-Time Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface rounded-lg border border-border shadow-dropdown p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-semibold text-xs text-navy-900">Recent Stream Alerts</span>
                <span className="text-[10px] font-mono text-coral-600 bg-coral-50 px-1.5 py-0.5 rounded">
                  3 Unresolved
                </span>
              </div>
              <div className="divide-y divide-border-subtle mt-2 space-y-1">
                {mockAlerts.map((a) => (
                  <div key={a.id} className="py-2.5 first:pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-navy-900 flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${a.severity === 'critical' ? 'text-red-600' : 'text-amber-500'}`} />
                        {a.title}
                      </span>
                      <span className="text-[10px] text-navy-400">{a.time}</span>
                    </div>
                    <div className="text-[11px] font-mono text-navy-500 mt-0.5 pl-5">{a.vpa}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border mt-3 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-medium text-coral-600 hover:text-coral-700"
                >
                  Close Notification Feed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-navy-900 text-coral-400 font-semibold text-xs flex items-center justify-center border border-navy-700">
            SR
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-navy-900 leading-tight">Inspector S. Roy</div>
            <div className="text-[10px] text-navy-400 font-mono">Cyber Crime Cell</div>
          </div>
        </div>
      </div>
    </header>
  );
};
