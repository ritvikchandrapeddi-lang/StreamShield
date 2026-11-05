import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Key, ArrowRight, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStreamShield, officerProfiles } from '../context/StreamShieldContext';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login, switchOfficer, activeOfficer } = useStreamShield();

  const [email, setEmail] = useState('inspector.roy@cybercell.gov.in');
  const [accessKey, setAccessKey] = useState('Shield2026!');
  const [selectedRole, setSelectedRole] = useState(activeOfficer.id);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const officer = officerProfiles.find((o) => o.id === selectedRole) || officerProfiles[0];
    switchOfficer(officer.id);
    login(email, officer.name);
    navigate('/dashboard');
  };

  const handleInstantDemo = () => {
    switchOfficer(officerProfiles[0].id);
    login(officerProfiles[0].name);
    navigate('/dashboard');
  };

  const handleRoleSelect = (officerId: string) => {
    setSelectedRole(officerId);
    const officer = officerProfiles.find((o) => o.id === officerId);
    if (officer) {
      setEmail(`${officer.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@streamshield.gov.in`);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-canvas flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Background Subtle Grid Accent */}
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-950 text-coral-500 shadow-md border border-navy-800">
            <Shield className="w-6 h-6 fill-coral-500/20 stroke-coral-500" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              StreamShield
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-coral-50 text-coral-700 border border-coral-200">
              DEMO GATEWAY
            </span>
          </div>
          <p className="text-xs text-navy-600 max-w-sm mx-auto">
            High-Throughput Financial Crime Intelligence & Mule-Ring Detection Console
          </p>
        </div>

        {/* Demo Notice Banner */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Hackathon Demo Mode</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Authentication is simulated for reviewer evaluation. Use the 1-click option below or sign in with the prefilled credentials.
            </p>
          </div>
        </div>

        {/* Primary Login Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-5">
          {/* 1-Click Try Sample Demo Flow Button */}
          <button
            type="button"
            onClick={handleInstantDemo}
            className="w-full py-3 px-4 rounded-xl bg-navy-900 hover:bg-navy-850 text-white font-semibold text-xs flex items-center justify-between shadow-md transition-all group border border-navy-800"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-7 h-7 rounded-lg bg-coral-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-white text-xs">
                  ⚡ Try Sample Demo (Instant Access)
                </span>
                <span className="block text-[10px] text-navy-300">
                  Preloads synthetic UPI transactions, mule rings & ML telemetry
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-coral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-surface px-3 text-[10px] uppercase font-mono text-navy-400 absolute">
              or select triage officer
            </span>
          </div>

          {/* Officer Profile Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-navy-500 block">
              Active Investigator Role
            </label>
            <div className="grid grid-cols-1 gap-2">
              {officerProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleRoleSelect(p.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedRole === p.id
                      ? 'border-navy-900 bg-canvas text-navy-900 font-semibold ring-1 ring-navy-900'
                      : 'border-border bg-surface hover:bg-surface-subtle text-navy-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs">{p.name}</div>
                    <div className="text-[10px] text-navy-500 truncate">
                      {p.title} • {p.badgeNumber}
                    </div>
                  </div>
                  {selectedRole === p.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleManualLogin} className="space-y-3 pt-1">
            <div>
              <label className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block mb-1">
                Official Government / Analyst Email
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-canvas font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block mb-1">
                Session Passcode
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-canvas font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-surface hover:bg-surface-subtle border border-border font-semibold text-xs text-navy-800 hover:text-navy-950 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-3.5 h-3.5 text-navy-500" />
              <span>Authenticate Triage Docket</span>
            </button>
          </form>

          {/* Clearly Displayed Demo Credentials Card */}
          <div className="p-3 rounded-lg bg-canvas border border-border-subtle text-[11px] font-mono text-navy-600 space-y-1">
            <div className="font-semibold text-navy-800 text-[10px] uppercase tracking-wider">
              Sample Demo Credentials:
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="text-navy-900 font-semibold">{email}</span>
            </div>
            <div className="flex justify-between">
              <span>Passcode:</span>
              <span className="text-navy-900 font-semibold">Shield2026!</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] font-mono text-navy-400 space-y-1">
          <div>StreamShield Architecture v0.2.0 • Zero PII Demo</div>
          <div>All transaction feeds and entities are synthetic demonstrations.</div>
        </div>
      </div>
    </div>
  );
};

