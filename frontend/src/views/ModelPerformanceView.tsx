import React from 'react';
import { Sliders, Cpu, Gauge, CheckCircle2 } from 'lucide-react';

export const ModelPerformanceView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              Model Performance & Explainability
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Precision/recall benchmarks, feature importance metrics, and decision tree telemetry.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-navy-100 text-navy-800">
            <Cpu className="w-3.5 h-3.5 text-navy-600" /> Scoring Engines
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-navy-900 font-semibold text-sm">
              <Gauge className="w-4 h-4 text-coral-500" />
              <span>Inference Latency Target</span>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-medium">&lt; 15ms</span>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed">
            Streaming pipeline architecture benchmarks target sub-15ms end-to-end evaluation per transaction event to prevent user-facing UPI friction.
          </p>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-2 text-xs text-navy-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>FastAPI async core verified for low overhead.</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-navy-900 font-semibold text-sm">
              <Sliders className="w-4 h-4 text-coral-500" />
              <span>Feature Attribution (SHAP)</span>
            </div>
            <span className="text-xs font-mono text-navy-500">Target Phase 5</span>
          </div>
          <p className="text-xs text-navy-600 leading-relaxed">
            Explainability engine providing human-readable explanations for every blocked or flagged transaction, identifying dominant risk factors and rule hits.
          </p>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-navy-500">
            Explainable AI module integration planned.
          </div>
        </div>
      </div>
    </div>
  );
};

