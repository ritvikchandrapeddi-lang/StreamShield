import React from 'react';
import { Radio, Filter, Download } from 'lucide-react';

export const TransactionMonitorView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              Transaction Monitor
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Live feed of incoming UPI payments, instant risk scoring, and rule evaluations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-border text-navy-400 cursor-not-allowed"
            >
              <Filter className="w-3.5 h-3.5" /> Filter Feed
            </button>
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-border text-navy-400 cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> Export Log
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border p-12 text-center shadow-card">
        <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-4 text-navy-700">
          <Radio className="w-6 h-6 animate-pulse text-coral-500" />
        </div>
        <h3 className="text-base font-semibold text-navy-900">Live Ingestion Stream Awaiting Source</h3>
        <p className="text-sm text-navy-600 max-w-md mx-auto mt-2">
          The transaction listener will connect to the real-time event pipeline in Phase 2. Data contracts and schemas will ingest UPI transaction events with millisecond latency.
        </p>
        <div className="mt-6 inline-block text-xs font-mono bg-canvas border border-border px-3 py-1.5 rounded-md text-navy-700">
          Schema: UPI_V2_TRANSACTION_PAYLOAD (Phase 2 Target)
        </div>
      </div>
    </div>
  );
};

