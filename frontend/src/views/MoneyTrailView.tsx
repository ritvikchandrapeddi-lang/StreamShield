import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  GitFork,
  Filter,
  Search,
} from 'lucide-react';
import { moneyTrailPresets, formatINR } from '../data/mockData';
import { AccountNode, MoneyTrailPreset, AccountRole } from '../types';
import { useStreamShield } from '../context/StreamShieldContext';
import { RiskBadge } from '../components/ui/RiskBadge';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';
import { apiService } from '../services/api';

type RoleFilterOption = 'all' | AccountRole;

export const MoneyTrailView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const { selectedPresetId, setSelectedPresetId } = useStreamShield();

  // Find initial preset based on context or default to first
  const initialPreset = useMemo(() => {
    return (
      moneyTrailPresets.find((p) => p.id === selectedPresetId) || moneyTrailPresets[0]
    );
  }, [selectedPresetId]);

  const [activePreset, setActivePreset] = useState<MoneyTrailPreset>(initialPreset);
  const [selectedNode, setSelectedNode] = useState<AccountNode | null>(null);
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(true);
  const [colorByRisk, setColorByRisk] = useState<boolean>(false);
  const [graphLayout, setGraphLayout] = useState<'breadthfirst' | 'cose'>('breadthfirst');
  const [roleFilter, setRoleFilter] = useState<RoleFilterOption>('all');

  // Multi-hop path statistics when a node is selected
  const [pathStats, setPathStats] = useState<{
    totalPathAmount: number;
    pathNodesCount: number;
    pathEdgesCount: number;
    hops: number;
  } | null>(null);

  const [customVpa, setCustomVpa] = useState<string>('');
  const [isLiveTracing, setIsLiveTracing] = useState<boolean>(false);
  const [liveTraceResult, setLiveTraceResult] = useState<any>(null);
  const [graphOverview, setGraphOverview] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    apiService.getGraphOverview().then((res) => {
      if (isMounted && res) {
        setGraphOverview(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLiveTrace = async (targetVpa?: string) => {
    const vpaToTrace = (targetVpa || customVpa).trim();
    if (!vpaToTrace) return;
    setIsLiveTracing(true);
    try {
      const traceData = await apiService.traceMoneyTrail({
        source_vpa: vpaToTrace,
        max_hops: 4,
        min_amount: 1000.0,
      });
      if (traceData && traceData.cytoscape_elements && traceData.cytoscape_elements.length > 0) {
        setLiveTraceResult(traceData);
        setSelectedNode(null);
        setPathStats(null);
        if (cyRef.current) {
          cyRef.current.elements().remove();
          cyRef.current.add(traceData.cytoscape_elements);
          cyRef.current.layout({
            name: 'breadthfirst',
            directed: true,
            padding: 40,
            spacingFactor: 1.6,
          }).run();
          cyRef.current.fit(undefined, 40);
        }
      }
    } catch (e) {
      console.warn('Live trace error:', e);
    } finally {
      setIsLiveTracing(false);
    }
  };

  const handleResetPresets = () => {
    setLiveTraceResult(null);
    setCustomVpa('');
    handlePresetChange(activePreset);
  };

  // Sync activePreset if selectedPresetId in context changes
  useEffect(() => {
    const match = moneyTrailPresets.find((p) => p.id === selectedPresetId);
    if (match && match.id !== activePreset.id) {
      setActivePreset(match);
      setSelectedNode(null);
      setPathStats(null);
    }
  }, [selectedPresetId, activePreset.id]);

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
          amount: e.amount,
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
            'transition-property': 'background-color, border-color, border-width, width, height, opacity',
            'transition-duration': 0.25,
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
            'control-point-step-size': 45,
            'arrow-scale': 1.25,
            label: 'data(label)',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 600,
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            color: '#475569',
            'text-background-opacity': 0.95,
            'text-background-color': '#FFFFFF',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': '#E2E6EE',
            'text-border-width': 1,
            'text-border-opacity': 0.9,
          },
        },
        {
          selector: '.highlighted-path',
          style: {
            'border-color': '#F05333',
            'border-width': 4,
            'line-color': '#F05333',
            'target-arrow-color': '#F05333',
            width: 3.5,
            'z-index': 999,
          },
        },
        {
          selector: '.dimmed',
          style: {
            opacity: 0.2,
          },
        },
      ],
      layout: {
        name: graphLayout,
        directed: true,
        padding: 50,
        animate: true,
        animationDuration: 400,
        ...(graphLayout === 'breadthfirst'
          ? {
              roots: [activePreset.nodes.find((n) => n.role === 'source')?.id || ''],
              spacingFactor: 1.6,
              grid: false,
            }
          : {
              nodeRepulsion: 12000,
              idealEdgeLength: 140,
            }),
      },
      minZoom: 0.4,
      maxZoom: 2.5,
    });

    // Multi-Hop Path Traversal on node click
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      const data: AccountNode = node.data('fullData');
      setSelectedNode(data);

      // Downstream and upstream traversal across multiple hops
      const downstream = node.successors();
      const upstream = node.predecessors();
      const fullPath = node.union(downstream).union(upstream);

      cy.elements().removeClass('highlighted-path dimmed');
      cy.elements().not(fullPath).addClass('dimmed');
      fullPath.addClass('highlighted-path');

      // Calculate path metrics
      let totalAmount = 0;
      fullPath.edges().forEach((edge: cytoscape.EdgeSingular) => {
        totalAmount += edge.data('amount') || 0;
      });

      setPathStats({
        totalPathAmount: totalAmount,
        pathNodesCount: fullPath.nodes().length,
        pathEdgesCount: fullPath.edges().length,
        hops: Math.max(fullPath.nodes().length - 1, 1),
      });
    });

    // Background click resets selection and highlights
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted-path dimmed');
        setSelectedNode(null);
        setPathStats(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [activePreset, showEdgeLabels, getNodeColor, graphLayout]);

  // Apply node-role filter dynamically
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    if (roleFilter === 'all') {
      cy.elements().removeClass('dimmed');
      if (selectedNode) {
        const node = cy.$id(selectedNode.id);
        const fullPath = node.union(node.successors()).union(node.predecessors());
        cy.elements().not(fullPath).addClass('dimmed');
        fullPath.addClass('highlighted-path');
      }
    } else {
      cy.elements().removeClass('highlighted-path dimmed');
      const matchingNodes = cy.nodes(`[role = "${roleFilter}"]`);
      cy.elements().not(matchingNodes).addClass('dimmed');
      matchingNodes.addClass('highlighted-path');
    }
  }, [roleFilter, selectedNode]);

  // Graph control buttons
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit();
  const handleResetLayout = () => {
    cyRef.current?.elements().removeClass('highlighted-path dimmed');
    setSelectedNode(null);
    setPathStats(null);
    setRoleFilter('all');
    cyRef.current
      ?.layout({
        name: graphLayout,
        directed: true,
        padding: 50,
        animate: true,
        ...(graphLayout === 'breadthfirst'
          ? {
              roots: [activePreset.nodes.find((n) => n.role === 'source')?.id || ''],
              spacingFactor: 1.6,
            }
          : {}),
      })
      .run();
  };

  const handlePresetChange = (preset: MoneyTrailPreset) => {
    setLiveTraceResult(null);
    setActivePreset(preset);
    setSelectedPresetId(preset.id);
    setSelectedNode(null);
    setPathStats(null);
    setRoleFilter('all');
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

      const downstream = target.successors();
      const upstream = target.predecessors();
      const fullPath = target.union(downstream).union(upstream);

      cyRef.current.elements().removeClass('highlighted-path dimmed');
      cyRef.current.elements().not(fullPath).addClass('dimmed');
      fullPath.addClass('highlighted-path');
    }
  };

  return (
    <div className="space-y-6">
      {/* Synthetic Demo Disclaimer Banner */}
      <SyntheticBanner label="SIGNATURE ENGINE: Synthetic graph relationships do not establish real-world identity, account ownership, or guilt." />

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
                  onClick={() => handlePresetChange(preset)}
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

        {/* Live NetworkX Dynamic Money Trail Input */}
        <div className="p-3 rounded-lg bg-canvas border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-navy-400 shrink-0" />
            <input
              type="text"
              value={customVpa}
              onChange={(e) => setCustomVpa(e.target.value)}
              placeholder="Enter arbitrary VPA to trace multi-hop flows (e.g. amit.verma91@okhdfcbank)..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-800"
              onKeyDown={(e) => e.key === 'Enter' && handleLiveTrace()}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleLiveTrace()}
              disabled={isLiveTracing || !customVpa.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveTracing ? 'animate-spin' : ''}`} />
              {isLiveTracing ? 'Tracing Graph...' : 'Trace Downstream Flow'}
            </button>
            {liveTraceResult && (
              <button
                onClick={handleResetPresets}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle text-navy-600 border border-border text-xs font-medium"
              >
                Reset Presets
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Pills from Backend Graph Overview */}
        {graphOverview?.top_mules && graphOverview.top_mules.length > 0 && !liveTraceResult && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-mono">
            <span className="text-navy-500 font-sans font-medium">Quick Trace:</span>
            {graphOverview.top_mules.slice(0, 4).map((m: any) => (
              <button
                key={m.vpa}
                type="button"
                onClick={() => {
                  setCustomVpa(m.vpa);
                  handleLiveTrace(m.vpa);
                }}
                className="px-2 py-0.5 rounded bg-surface hover:bg-coral-50 border border-border hover:border-coral-300 text-navy-700 hover:text-coral-700 transition-colors"
                title={`Mule Score: ${m.mule_score} (${m.role})`}
              >
                {m.vpa}
              </button>
            ))}
          </div>
        )}

        {/* Live Trace Active Alert */}
        {liveTraceResult && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
            <span className="font-mono">
              Live NetworkX Tracing Active: <strong>{liveTraceResult.source_vpa}</strong> &rarr; Traced {formatINR(liveTraceResult.total_volume_traced)} across {liveTraceResult.paths_found_count} paths to {liveTraceResult.terminal_sinks?.length || 0} terminal sinks.
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
              LIVE GRAPH
            </span>
          </div>
        )}
      </div>

      {/* Role Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 rounded-xl bg-surface border border-border text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-navy-500" />
          <span className="font-semibold text-navy-800">Filter By Role:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Nodes' },
              { id: 'source', label: 'Source Origin' },
              { id: 'first_mule', label: 'Tier-1 Mules' },
              { id: 'intermediate', label: 'Intermediaries' },
              { id: 'downstream', label: 'Downstream Smurfs' },
              { id: 'consolidation', label: 'Consolidation Vault' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRoleFilter(item.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                roleFilter === item.id
                  ? 'bg-navy-900 text-white font-semibold shadow-sm'
                  : 'bg-canvas hover:bg-surface-subtle text-navy-600 border border-border'
              }`}
            >
              {item.label}
            </button>
          ))}
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

          {/* Active Multi-Hop Path Highlight Strip */}
          {pathStats && selectedNode && (
            <div className="px-5 py-2 bg-coral-50/70 border-b border-coral-200/80 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-coral-900 font-medium">
                <GitFork className="w-4 h-4 text-coral-600" />
                <span>
                  Active Multi-Hop Money Trail for <strong className="font-mono">{selectedNode.vpa}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-coral-950 font-semibold">
                <span>Hops: {pathStats.hops}</span>
                <span>•</span>
                <span>Entities in Path: {pathStats.pathNodesCount}</span>
                <span>•</span>
                <span className="text-coral-700 font-bold">
                  Traced Path Flow: {formatINR(pathStats.totalPathAmount)}
                </span>
              </div>
            </div>
          )}

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
            <span>Tip: Click any node to traverse upstream sources & downstream wash destinations.</span>
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
                  onClick={() => {
                    setSelectedNode(null);
                    setPathStats(null);
                    cyRef.current?.elements().removeClass('highlighted-path dimmed');
                  }}
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
                  <RiskBadge
                    score={selectedNode.riskScore}
                    level={
                      selectedNode.riskScore >= 90
                        ? 'critical'
                        : selectedNode.riskScore >= 75
                        ? 'high'
                        : 'medium'
                    }
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-navy-400 pt-1 border-t border-border-subtle">
                  <span>Status:</span>
                  <span className="capitalize text-coral-700 font-semibold">
                    {selectedNode.status.replace('_', ' ')}
                  </span>
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
                  <span>
                    {selectedNode.bankName} ({selectedNode.ifsc})
                  </span>
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
