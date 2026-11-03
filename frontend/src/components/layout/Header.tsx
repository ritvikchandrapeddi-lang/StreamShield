import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Server, ShieldCheck, AlertCircle } from 'lucide-react';

const routeTitleMap: Record<string, string> = {
  '/': 'Overview Dashboard',
  '/transactions': 'Transaction Monitor',
  '/money-trail': 'Money Trail Explorer',
  '/fraud-lab': 'Fraud Intelligence Lab',
  '/investigations': 'Case Investigations',
  '/model-performance': 'Model Performance',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const currentTitle = routeTitleMap[location.pathname] || 'StreamShield';

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          const duration = Math.round(performance.now() - startTime);
          if (isMounted) {
            setBackendStatus('online');
            setLatency(duration);
          }
        } else {
          if (isMounted) setBackendStatus('offline');
        }
      } catch {
        if (isMounted) setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between shadow-subtle shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-navy-400">StreamShield /</span>
        <span className="text-sm font-semibold text-navy-900">{currentTitle}</span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-subtle border border-border">
          <Server className="w-3.5 h-3.5 text-navy-500" />
          <span className="text-navy-600 font-medium">FastAPI Core:</span>
          {backendStatus === 'online' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected {latency !== null && `(${latency}ms)`}
            </span>
          ) : backendStatus === 'offline' ? (
            <span className="inline-flex items-center gap-1.5 text-coral-600 font-medium">
              <AlertCircle className="w-3 h-3 text-coral-500" />
              Offline
            </span>
          ) : (
            <span className="text-navy-400">Checking...</span>
          )}
        </div>

        {/* Security badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-navy-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Secrets Enforced</span>
        </div>
      </div>
    </header>
  );
};

