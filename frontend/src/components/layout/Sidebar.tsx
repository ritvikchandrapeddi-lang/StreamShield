import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Network,
  FlaskConical,
  Briefcase,
  LineChart,
  Shield,
  Zap,
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaction Monitor', to: '/transactions', icon: Radio, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Money Trail Explorer', to: '/money-trail', icon: Network, badge: 'Key Feature', badgeColor: 'bg-coral-500/20 text-coral-400 border-coral-500/30' },
  { name: 'Fraud Intelligence Lab', to: '/fraud-lab', icon: FlaskConical, badge: 'Sim', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'Investigations', to: '/investigations', icon: Briefcase, badge: '4 Cases', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { name: 'Model Performance', to: '/model-performance', icon: LineChart },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-navy-950 text-white flex flex-col border-r border-navy-900 shrink-0 select-none">
      {/* Brand logo & title */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-navy-900/80">
        <div className="w-9 h-9 rounded-lg bg-coral-500 text-white flex items-center justify-center shadow-md">
          <Shield className="w-5 h-5 fill-white/20 stroke-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            StreamShield
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-coral-500/20 text-coral-400 border border-coral-500/30">
              PRO
            </span>
          </div>
          <div className="text-[11px] text-navy-400 font-medium">UPI Crime Intelligence</div>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
          Intelligence Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDashboardActive = (item.to === '/dashboard') && (location.pathname === '/' || location.pathname === '/dashboard');
          const isCurrentActive = isDashboardActive || location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all ${
                isCurrentActive
                  ? 'bg-navy-900 text-white font-semibold shadow-sm border-l-2 border-coral-500 pl-[10px]'
                  : 'text-navy-300 hover:text-white hover:bg-navy-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isCurrentActive ? 'text-coral-400' : 'text-navy-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-navy-800 text-navy-300 border-navy-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Stream Engine Telemetry Status */}
      <div className="p-4 border-t border-navy-900/80">
        <div className="bg-navy-900/70 rounded-lg p-3 border border-navy-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-navy-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-coral-400" />
              Stream Pipeline
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <div className="text-[11px] text-navy-400">
            <div className="flex justify-between">
              <span>Sim Ingestion:</span>
              <span className="font-mono text-navy-200">2,410 TPS</span>
            </div>
            <div className="flex justify-between mt-0.5">
              <span>Latency p99:</span>
              <span className="font-mono text-emerald-400">14.6 ms</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
