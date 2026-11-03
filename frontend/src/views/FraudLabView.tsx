import React from 'react';
import { FlaskConical, Play, Sparkles } from 'lucide-react';

export const FraudLabView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              Fraud Intelligence Lab
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Interactive attack vector simulator, synthetic threat generation, and Fraud DNA typology catalog.
            </p>
          </div>
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-navy-900 text-white opacity-50 cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
          <div className="flex items-center gap-2.5 mb-3 text-navy-900 font-semibold text-sm">
            <FlaskConical className="w-4 h-4 text-coral-500" />
            <span>Attack Simulator Sandbox</span>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed">
            Configure simulated attack scenarios such as SIM-swap rapid drains, collect request flooding, and multi-tier mule distribution chains to benchmark system resilience.
          </p>
          <div className="mt-4 pt-4 border-t border-border-subtle text-xs text-navy-500">
            Scheduled for integration in Phase 4.
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
          <div className="flex items-center gap-2.5 mb-3 text-navy-900 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-coral-500" />
            <span>Fraud DNA Signatures</span>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed">
            Structural motif matching engine cataloging verified criminal syndicates into topological fingerprints for instant cross-institution threat matching.
          </p>
          <div className="mt-4 pt-4 border-t border-border-subtle text-xs text-navy-500">
            Typology library definitions in Phase 4.
          </div>
        </div>
      </div>
    </div>
  );
};

