import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCheck,
  UserCheck,
  RotateCcw,
  Radio,
  ChevronDown,
  X,
} from 'lucide-react';
import { useStreamShield, officerProfiles } from '../../context/StreamShieldContext';
import { AlertItem } from '../../types';

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
  const navigate = useNavigate();
  const currentTitle = routeTitleMap[location.pathname] || 'StreamShield';

  const {
    alerts,
    dismissAlert,
    markAllAlertsAsRead,
    setSelectedTxId,
    setSelectedCaseId,
    activeOfficer,
    switchOfficer,
    resetDemoState,
    isSimulatingGlobalStream,
    setIsSimulatingGlobalStream,
  } = useStreamShield();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadAlerts = alerts.filter((a) => !a.read);

  const handleAlertClick = (alert: AlertItem) => {
    setShowNotifications(false);
    if (alert.txId) {
      setSelectedTxId(alert.txId);
      navigate('/transactions');
    } else if (alert.caseId) {
      setSelectedCaseId(alert.caseId);
      navigate('/investigations');
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-6 sm:px-8 flex items-center justify-between shadow-subtle shrink-0 relative z-30 select-none">
      {/* Breadcrumb & Screen Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-navy-400">StreamShield</span>
        <span className="text-navy-300">/</span>
        <h1 className="text-sm font-semibold text-navy-900">{currentTitle}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs">
        {/* Stream Ingestion Play/Pause Toggle */}
        <button
          onClick={() => setIsSimulatingGlobalStream(!isSimulatingGlobalStream)}
          className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all ${
            isSimulatingGlobalStream
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-canvas border-border text-navy-500'
          }`}
          title="Toggle live simulated transaction stream arrival"
        >
          <Radio
            className={`w-3 h-3 ${
              isSimulatingGlobalStream ? 'text-emerald-500 animate-pulse' : 'text-navy-400'
            }`}
          />
          <span className="font-mono text-[11px] font-medium">
            {isSimulatingGlobalStream ? 'Live Stream: Active' : 'Live Stream: Paused'}
          </span>
        </button>

        {/* Zero Secrets & PII Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-navy-500 font-medium text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-PII Demo</span>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-md hover:bg-surface-subtle text-navy-600 transition-colors focus:outline-none"
            title="Real-Time Alerts Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl border border-border shadow-dropdown p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-navy-900">Real-Time Threat Alerts</span>
                  <span className="text-[10px] font-mono font-semibold text-coral-700 bg-coral-50 px-1.5 py-0.2 rounded border border-coral-200">
                    {alerts.length} Total
                  </span>
                </div>
                {alerts.length > 0 && (
                  <button
                    onClick={markAllAlertsAsRead}
                    className="text-[11px] text-navy-500 hover:text-navy-900 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Read All
                  </button>
                )}
              </div>

              <div className="divide-y divide-border-subtle mt-2 space-y-1 max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-navy-400 text-xs">
                    No active threat alerts in stream
                  </div>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleAlertClick(a)}
                      className="py-2.5 px-1 rounded-md hover:bg-canvas transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-navy-900 flex items-center gap-1.5 group-hover:text-coral-600 transition-colors">
                          {a.severity === 'critical' ? (
                            <Flame className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]">{a.title}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-navy-400 font-mono">{a.time}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissAlert(a.id);
                            }}
                            className="text-navy-400 hover:text-navy-700 p-0.5"
                            title="Dismiss alert"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-navy-500 mt-0.5 pl-5 truncate">
                        {a.vpa}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-border mt-3 flex items-center justify-between text-[11px]">
                <span className="text-navy-400">Click alert to inspect dossier</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="font-medium text-coral-600 hover:text-coral-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile & Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-navy-900 text-coral-400 font-semibold text-xs flex items-center justify-center border border-navy-700">
              {activeOfficer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-navy-900 leading-tight flex items-center gap-1">
                <span>{activeOfficer.name}</span>
                <ChevronDown className="w-3 h-3 text-navy-400" />
              </div>
              <div className="text-[10px] text-navy-400 font-mono">{activeOfficer.title}</div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-surface rounded-xl border border-border shadow-dropdown p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
              <div className="pb-2 border-b border-border">
                <span className="text-[10px] uppercase font-mono text-navy-400 block">
                  Logged Investigator
                </span>
                <div className="font-bold text-navy-900 text-sm">{activeOfficer.name}</div>
                <div className="text-xs text-navy-600">{activeOfficer.title}</div>
                <div className="text-[10px] text-navy-400 font-mono mt-0.5">
                  Badge: {activeOfficer.badgeNumber} • {activeOfficer.cell}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-navy-400 block mb-1.5">
                  Switch Active Role (Demo)
                </span>
                <div className="space-y-1">
                  {officerProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchOfficer(p.id);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeOfficer.id === p.id
                          ? 'bg-navy-900 text-white font-semibold'
                          : 'bg-canvas hover:bg-surface-subtle text-navy-800'
                      }`}
                    >
                      <div>
                        <div>{p.name}</div>
                        <div className={`text-[10px] ${activeOfficer.id === p.id ? 'text-navy-300' : 'text-navy-400'}`}>
                          {p.title}
                        </div>
                      </div>
                      {activeOfficer.id === p.id && (
                        <UserCheck className="w-3.5 h-3.5 text-coral-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => {
                    resetDemoState();
                    setShowProfileMenu(false);
                  }}
                  className="w-full py-1.5 px-3 rounded-md bg-canvas hover:bg-surface-subtle border border-border text-navy-700 hover:text-navy-950 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-coral-500" />
                  Reset Session Demo State
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
