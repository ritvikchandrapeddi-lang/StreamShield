import React from 'react';
import { Network, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export const MoneyTrailView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              Money Trail Explorer
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Multi-hop graph visualization tracing downstream fund dissipation across mule networks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="p-1.5 rounded-md bg-surface border border-border text-navy-400 cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              disabled
              className="p-1.5 rounded-md bg-surface border border-border text-navy-400 cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              disabled
              className="p-1.5 rounded-md bg-surface border border-border text-navy-400 cursor-not-allowed"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border h-96 flex flex-col items-center justify-center p-8 text-center shadow-card relative overflow-hidden">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-lg bg-navy-950 text-coral-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Network className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-navy-900">Graph Engine Framework Initialized</h3>
          <p className="text-sm text-navy-600 max-w-lg mx-auto mt-2">
            Cytoscape.js core canvas is linked to the frontend dependencies. Interactive entity nodes, multi-hop edges, and mule account clusters will be rendered in Phase 3.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 text-xs text-navy-500 font-mono">
            <span className="px-2 py-1 bg-canvas border border-border rounded">Engine: Cytoscape.js</span>
            <span className="px-2 py-1 bg-canvas border border-border rounded">Layout: CoSE / Concentric</span>
          </div>
        </div>
      </div>
    </div>
  );
};

