import React from 'react';
import { Activity, ShieldAlert, GitFork, ArrowUpRight } from 'lucide-react';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              Overview Dashboard
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              High-level telemetry, active incident vectors, and real-time UPI event volume.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-coral-50 text-coral-700 border border-coral-100">
            Phase 1 Foundation
          </span>
        </div>
      </div>

      {/* Grid of structural cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface rounded-lg border border-border p-5 shadow-card">
          <div className="flex items-center justify-between text-navy-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Stream Telemetry</span>
            <Activity className="w-4 h-4 text-navy-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-navy-900">Standby</div>
          <p className="text-xs text-navy-500 mt-2">
            Ingestion engine configured for Phase 2 Kafka pipeline integration.
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border p-5 shadow-card">
          <div className="flex items-center justify-between text-navy-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
            <ShieldAlert className="w-4 h-4 text-coral-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-navy-900">0 Active</div>
          <p className="text-xs text-navy-500 mt-2">
            Detection rules and threshold configurations ready for activation.
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border p-5 shadow-card">
          <div className="flex items-center justify-between text-navy-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Graph Topology</span>
            <GitFork className="w-4 h-4 text-navy-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-navy-900">Cytoscape Ready</div>
          <p className="text-xs text-navy-500 mt-2">
            Multi-hop money trail canvas and node clustering engine integrated.
          </p>
        </div>
      </div>

      {/* Architecture blueprint placeholder */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-700">
            System Status & Phase Scope
          </h2>
          <span className="text-xs font-mono text-navy-500">v0.1.0-alpha</span>
        </div>
        <p className="text-sm text-navy-600 leading-relaxed max-w-2xl">
          StreamShield full-stack foundation has established clean separation of concerns. 
          The backend runs an asynchronous FastAPI server with health observability, while the frontend provides 
          a modular React Router architecture designed for real-time UPI fraud scoring and deep graph tracing.
        </p>
        <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-4 text-xs font-medium text-navy-600">
          <span className="inline-flex items-center gap-1 text-coral-600 hover:text-coral-700 cursor-pointer">
            Review Phase 1 Specs <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
          <span>•</span>
          <span>FastAPI Endpoint: <code className="font-mono bg-surface-subtle px-1.5 py-0.5 rounded text-navy-800">/health</code></span>
        </div>
      </div>
    </div>
  );
};

