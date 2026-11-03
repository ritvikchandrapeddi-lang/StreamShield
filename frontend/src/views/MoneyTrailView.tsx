import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Tag,
  Flame,
  Shield,
  Info,
  Building,
  MapPin,
  Clock,
  Layers,
  X,
} from 'lucide-react';
import { moneyTrailPresets, formatINR } from '../data/mockData';
import { AccountNode, MoneyTrailPreset } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

export const MoneyTrailView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [activePreset, setActivePreset] = useState<MoneyTrailPreset>(moneyTrailPresets[0]);
  const [selectedNode, setSelectedNode] = useState<AccountNode | null>(null);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [colorByRisk, setColorByRisk] = useState(false);
  const [graphLayout, setGraphLayout] = useState<'breadthfirst' | 'cose'>('breadthfirst');

  // Node color helper
  const getNodeColor = useCallback(
    (role: string, riskScore: number) => {
      if (colorByRisk) {
        if (riskScore >= 90) return '#DC2626'; // Red
        if (riskScore >= 75) return '#EA580C'; // Orange
        if (riskScore >= 50) return '#D97706'; // Amber
        return '#10B981'; // Green
      }

      switch (role) {
        case 'source':
          return '#DC2626'; // Deep Red
        case 'first_mule':
          return '#EA580C'; // Burnt Orange
        case 'intermediate':
          return '#1E293B'; // Deep Navy Slate
        case 'downstream':
          return '#64748B'; // Muted Slate
        case 'consolidation':
          return '#7C3AED'; // Indigo / Terminal Vault
        default:
          return '#475569';
      }
    },
    [colorByRisk]
  );

  // Initialize and update Cytoscape graph
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Build elements array for Cytoscape
    const elements: cytoscape.ElementDefinition[] = [
      ...activePreset.nodes.map((n) => ({
        group: 'nodes' as const,
        data: {
          id: n.id,
          label: n.ownerName.split(' ')[0] + '\n' + formatINR(n.totalIncoming),
          fullData: n,
          role: n.role,
          riskScore: n.riskScore,
          bgColor: getNodeColor(n.role, n.riskScore),
        },
      })),
      ...activePreset.edges.map((e) => ({
        group: 'edges' as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: showEdgeLabels ? formatINR(e.amount) : '',
          fullData: e,
        },
      })),
    ];

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(bgColor)',
            label: 'data(label)',
            color: '#0F172A',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 600,
            'text-wrap': 'wrap',
            width: 44,
            height: 44,
            'border-width': 2,
            'border-color': '#FFFFFF',
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'node[role = "source"]',
          style: {
            shape: 'ellipse',
            width: 52,
            height: 52,
            'border-width': 4,
            'border-color': '#FCA5A5',
          },
        },
        {
          selector: 'node[role = "consolidation"]',
          style: {
            shape: 'diamond',
            width: 54,
            height: 54,
            'border-width': 4,
            'border-color': '#DDD6FE',
          },
        },
        {
          selector: 'node[role = "first_mule"]',
          style: {
            shape: 'round-rectangle',
            width: 48,
            height: 44,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2.5,
            'line-color': '#CBD5E1',
            'target-arrow-color': '#94A3B8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2,
            label: 'data(label)',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 600,
            color: '#475569',
            'text-background-opacity': 0.95,
            'text-background-color': '#FFFFFF',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': '#E2E6EE',
            'text-border-width': 1,
            'text-border-opacity': 0.8,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'border-color': '#F05333',
            'border-width': 4,
            'line-color': '#F05333',
            'target-arrow-color': '#F05333',
            'z-index': 999,
          },
        },
        {
          selector: '.dimmed',
          style: {
            opacity: 0.25,
          },
        },
      ],
      layout: {
        name: graphLayout,
        directed: true,
        padding: 40,
        animate: true,
        animationDuration: 400,
        ...(graphLayout === 'breadthfirst'
          ? {
              roots: [activePreset.nodes.find((n) => n.role === 'source')?.id || ''],
              spacingFactor: 1.4,
            }
          : {}),
      },
      minZoom: 0.4,
      maxZoom: 2.5,
    });

    // Node click handler
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      const data: AccountNode = node.data('fullData');
      setSelectedNode(data);

      // Multi-hop path highlighting
      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.closedNeighborhood();
      cy.elements().not(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
    });

    // Background click resets selection
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [activePreset, showEdgeLabels, getNodeColor, graphLayout]);

  // Graph control buttons
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit();
  const handleResetLayout = () => {
    cyRef.current?.elements().removeClass('highlighted dimmed');
    setSelectedNode(null);
    cyRef.current
      ?.layout({
        name: graphLayout,
        directed: true,
        padding: 40,
        animate: true,
      })
      .run();
  };

  const focusNode = (nodeId: string) => {
    if (!cyRef.current) return;
    const target = cyRef.current.$id(nodeId);
    if (target.nonempty()) {
      cyRef.current.animate({
        center: { eles: target },
        zoom: 1.4,
        duration: 350,
      });
      const data: AccountNode = target.data('fullData');
      setSelectedNode(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Synthetic Demo Disclaimer Banner */}
      <SyntheticBanner label="SIGNATURE ENGINE: Synthetic demo trails visualize structural money laundering topologies. They do not establish real-world identity, ownership, or guilt." />

      {/* Header & Preset Selector Bar */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-coral-600 uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Signature Feature: Multi-Hop Money Trail Engine</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-navy-900">
              Downstream Money Trail Intelligence
            </h1>
            <p className="text-xs text-navy-600 mt-1 max-w-2xl leading-relaxed">
              Trace illicit fund dispersion downstream in real time. Isolate initial victim sources, high-churn intermediary layering nodes, and final consolidation vaults.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs text-navy-500 font-medium">Scenario Preset:</span>
            <div className="inline-flex rounded-lg border border-border bg-surface-subtle p-0.5">
              {moneyTrailPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setActivePreset(preset);
                    setSelectedNode(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activePreset.id === preset.id
                      ? 'bg-surface text-navy-900 shadow-sm font-semibold'
                      : 'text-navy-600 hover:text-navy-900'
                  }`}
                >
                  {preset.title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trail Description & Metrics Bar */}
        <div className="p-3.5 rounded-lg bg-canvas border border-border-subtle flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-navy-700">
            <Info className="w-4 h-4 text-navy-500 shrink-0" />
            <span>{activePreset.description}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
            <span className="bg-surface px-2.5 py-1 rounded border border-border text-navy-800">
              Disputed: <strong className="text-coral-600">{formatINR(activePreset.totalDisputed)}</strong>
            </span>
            <span className="bg-surface px-2.5 py-1 rounded border border-border text-navy-800">
              Hops: <strong>{activePreset.hopCount}</strong>
            </span>
            <span className="bg-surface px-2.5 py-1 rounded border border-border text-navy-800">
              Nodes: <strong>{activePreset.compromisedCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Canvas & Controls Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Graph Visualization Area (3 Cols) */}
        <div className="lg:col-span-3 bg-surface rounded-xl border border-border shadow-card flex flex-col overflow-hidden relative">
          {/* Top Control Bar */}
          <div className="px-5 py-3 border-b border-border bg-canvas/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Visual Legend */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block ring-2 ring-red-200" />
                Source
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-600 inline-block" />
                Tier-1 Mule
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-navy-800 inline-block" />
                Intermediary
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
                Downstream
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rotate-45 bg-purple-600 inline-block ring-2 ring-purple-200" />
                Consolidation
              </span>
            </div>

            {/* Interactive Control Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowEdgeLabels(!showEdgeLabels)}
                className={`p-1.5 px-2 rounded border text-xs font-mono flex items-center gap-1 transition-colors ${
                  showEdgeLabels
                    ? 'bg-surface text-navy-900 border-navy-400 font-semibold'
                    : 'bg-canvas text-navy-500 border-border'
                }`}
                title="Toggle Amount Badges on Edges"
              >
                <Tag className="w-3.5 h-3.5" />
                Amounts
              </button>
              <button
                onClick={() => setColorByRisk(!colorByRisk)}
                className={`p-1.5 px-2 rounded border text-xs font-mono flex items-center gap-1 transition-colors ${
                  colorByRisk
                    ? 'bg-surface text-coral-600 border-coral-400 font-semibold'
                    : 'bg-canvas text-navy-500 border-border'
                }`}
                title="Colorize Nodes by Risk Score Gradient"
              >
                <Flame className="w-3.5 h-3.5" />
                Risk Mode
              </button>
              <button
                onClick={() =>
                  setGraphLayout(graphLayout === 'breadthfirst' ? 'cose' : 'breadthfirst')
                }
                className="p-1.5 px-2 rounded border text-xs font-mono bg-canvas border-border text-navy-700 hover:bg-surface flex items-center gap-1"
                title="Switch Topology Algorithm"
              >
                <Layers className="w-3.5 h-3.5" />
                {graphLayout === 'breadthfirst' ? 'Hierarchical' : 'Force'}
              </button>

              <div className="h-4 w-[1px] bg-border mx-1" />

              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-navy-700"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-navy-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFit}
                className="p-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-navy-700"
                title="Fit to Canvas"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetLayout}
                className="p-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-navy-700"
                title="Reset View"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cytoscape Canvas */}
          <div
            ref={containerRef}
            className="w-full h-[540px] bg-[#FAFBFD] relative cursor-grab active:cursor-grabbing"
            style={{
              backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Canvas Bottom Helper Hint */}
          <div className="px-5 py-2.5 bg-surface border-t border-border flex items-center justify-between text-[11px] text-navy-500">
            <span>Tip: Click any node to open its dossier and highlight its multi-hop flow path.</span>
            <span className="font-mono">Engine: Cytoscape.js v3.30</span>
          </div>
        </div>

        {/* Right Column: Account Details Inspector (1 Col) */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-card flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-5 animate-in fade-in">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-navy-400">
                    Inspecting Entity
                  </span>
                  <h3 className="text-sm font-bold text-navy-900 mt-0.5 leading-snug">
                    {selectedNode.ownerName}
                  </h3>
                  <div className="font-mono text-xs text-coral-600 mt-0.5">
                    {selectedNode.vpa}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-canvas text-navy-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role & Risk Score Bar */}
              <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-navy-500">Network Role</span>
                  <span className="text-xs font-semibold capitalize text-navy-900">
                    {selectedNode.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-navy-500">Risk Assessment</span>
                  <RiskBadge score={selectedNode.riskScore} level={selectedNode.riskScore >= 90 ? 'critical' : selectedNode.riskScore >= 75 ? 'high' : 'medium'} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-navy-400 pt-1 border-t border-border-subtle">
                  <span>Status:</span>
                  <span className="capitalize text-coral-700 font-semibold">{selectedNode.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Inflow vs Outflow Metrics */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">
                  Fund Flow Telemetry
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-surface-subtle border border-border">
                    <span className="text-[10px] text-navy-400 block">Total Inflow</span>
                    <span className="font-mono font-bold text-navy-900">
                      {formatINR(selectedNode.totalIncoming)}
                    </span>
                    <span className="text-[10px] text-navy-500 block mt-0.5">
                      ({selectedNode.incomingCount} transactions)
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-border">
                    <span className="text-[10px] text-navy-400 block">Total Outflow</span>
                    <span className="font-mono font-bold text-coral-600">
                      {formatINR(selectedNode.totalOutgoing)}
                    </span>
                    <span className="text-[10px] text-navy-500 block mt-0.5">
                      ({selectedNode.outgoingCount} transactions)
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Profile Metadata */}
              <div className="space-y-2 text-xs text-navy-700">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-navy-400" />
                  <span>{selectedNode.bankName} ({selectedNode.ifsc})</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-navy-400" />
                  <span>{selectedNode.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-navy-400" />
                  <span>Account Age: {selectedNode.accountAgeDays} days</span>
                </div>
              </div>

              {/* Network Connections */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-navy-500 mb-2">
                  Trail Neighbors
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activePreset.edges
                    .filter(
                      (e) => e.source === selectedNode.id || e.target === selectedNode.id
                    )
                    .map((edge) => {
                      const isOutgoing = edge.source === selectedNode.id;
                      const neighborId = isOutgoing ? edge.target : edge.source;
                      const neighbor = activePreset.nodes.find((n) => n.id === neighborId);
                      return (
                        <div
                          key={edge.id}
                          onClick={() => focusNode(neighborId)}
                          className="p-2 rounded bg-canvas hover:bg-surface-subtle border border-border-subtle cursor-pointer text-xs flex items-center justify-between transition-colors"
                        >
                          <div className="truncate max-w-[140px]">
                            <span className="text-[10px] font-mono text-navy-400 block">
                              {isOutgoing ? '→ Out to' : '← In from'}
                            </span>
                            <span className="font-medium text-navy-900 truncate">
                              {neighbor?.ownerName.split(' ')[0]}
                            </span>
                          </div>
                          <span className="font-mono text-coral-600 font-semibold text-[11px]">
                            {formatINR(edge.amount)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-navy-400 space-y-3">
              <Shield className="w-10 h-10 mx-auto opacity-30 text-navy-600" />
              <div>
                <h4 className="text-xs font-semibold text-navy-800">No Account Selected</h4>
                <p className="text-[11px] text-navy-500 max-w-[200px] mx-auto mt-1">
                  Click on any node in the directed money trail to view its KYC, risk score, and inflow/outflow metrics.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Security Assurance */}
          <div className="pt-4 border-t border-border-subtle text-[11px] text-navy-400">
            Automated freeze recommendation triggered for nodes scoring &gt; 85.
          </div>
        </div>
      </div>
    </div>
  );
};
