import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Network,
  FlaskConical,
  Briefcase,
  LineChart,
  Shield,
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Overview Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Transaction Monitor', to: '/transactions', icon: Radio },
  { name: 'Money Trail Explorer', to: '/money-trail', icon: Network },
  { name: 'Fraud Intelligence Lab', to: '/fraud-lab', icon: FlaskConical },
  { name: 'Investigations', to: '/investigations', icon: Briefcase },
  { name: 'Model Performance', to: '/model-performance', icon: LineChart },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-navy-950 text-white flex flex-col border-r border-navy-900 shrink-0 select-none">
      {/* Brand logo & title */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-navy-900/80">
        <div className="w-8 h-8 rounded-md bg-coral-500 text-white flex items-center justify-center shadow-sm">
          <Shield className="w-4 h-4 fill-white/20 stroke-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            StreamShield
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-coral-500/20 text-coral-400 border border-coral-500/30">
              P1
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
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-navy-900 text-white font-semibold shadow-sm border-l-2 border-coral-500 pl-[10px]'
                    : 'text-navy-300 hover:text-white hover:bg-navy-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-navy-400" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom status badge */}
      <div className="p-4 border-t border-navy-900/80">
        <div className="bg-navy-900/60 rounded-md p-3 border border-navy-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-navy-200">System Ready</span>
          </div>
          <p className="text-[11px] text-navy-400 mt-1">
            FastAPI + Vite scaffold active
          </p>
        </div>
      </div>
    </aside>
  );
};

