import React, { useState, useEffect, useRef, useCallback } from 'react';
import cytoscape, { Core } from 'cytoscape';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  Activity,
  Sliders,
  Cpu,
  GitFork,
  Radio,
} from 'lucide-react';
import { mockSimulationScenarios, formatINR } from '../data/mockData';
import { SimulationScenario } from '../types';
import { apiService } from '../services/api';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

interface SimulatedEvent {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  riskScore: number;
  flagged: boolean;
  time: string;
  ruleFired?: string;
}

export const FraudLabView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(
    mockSimulationScenarios[0]
  );

  // Simulation parameters
  const [volume, setVolume] = useState<number>(selectedScenario.defaultVolume);
  const [intermediaries, setIntermediaries] = useState<number>(
    selectedScenario.defaultIntermediaries
  );
  const [amountMin, setAmountMin] = useState<number>(selectedScenario.defaultAmountMin);
  const [amountMax, setAmountMax] = useState<number>(selectedScenario.defaultAmountMax);
  const [complexity, setComplexity] = useState<string>(selectedScenario.complexity);

  // Execution state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [phaseMessage, setPhaseMessage] = useState<string>('Ready for simulation');
  const [simulatedStream, setSimulatedStream] = useState<SimulatedEvent[]>([]);
  const [resultsReady, setResultsReady] = useState<boolean>(false);
  const [backendSimResult, setBackendSimResult] = useState<any>(null);

  // Mini Cytoscape Canvas for scenario topology preview
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Helper to build scenario-specific topology elements
  const generateScenarioGraphElements = useCallback((scenarioId: string, nodeCount: number) => {
    const nodes: cytoscape.ElementDefinition[] = [];
    const edges: cytoscape.ElementDefinition[] = [];

    if (scenarioId === 'funnel-attack') {
      // Multiple victims funneling to one collector, then to exit
      nodes.push({ data: { id: 'collector', label: 'Aggregator\n(Collector)', role: 'mule', flagged: true } });
      nodes.push({ data: { id: 'exit', label: 'Cashout\nTerminal', role: 'terminal', flagged: true } });
      edges.push({ data: { id: 'e-col-exit', source: 'collector', target: 'exit', label: '₹4,50,000' } });

      const victims = Math.min(nodeCount, 8);
      for (let i = 1; i <= victims; i++) {
        const id = `victim-${i}`;
        nodes.push({ data: { id, label: `Victim ${i}`, role: 'victim', flagged: false } });
        edges.push({ data: { id: `e-v-${i}`, source: id, target: 'collector', label: '₹60,000' } });
      }
    } else if (scenarioId === 'smurfing-split') {
      // 1 origin splitting into multiple small mules
      nodes.push({ data: { id: 'origin', label: 'Compromised\nSource', role: 'source', flagged: true } });
      const mules = Math.min(nodeCount, 8);
      for (let i = 1; i <= mules; i++) {
        const id = `smurf-${i}`;
        nodes.push({ data: { id, label: `Smurf ${i}\n₹49k`, role: 'mule', flagged: true } });
        edges.push({ data: { id: `e-s-${i}`, source: 'origin', target: id, label: '₹49,500' } });
      }
    } else if (scenarioId === 'circular-transfers') {
      // Loop cycle A -> B -> C -> D -> A
      const count = Math.min(Math.max(nodeCount, 3), 6);
      for (let i = 1; i <= count; i++) {
        const id = `ring-${i}`;
        nodes.push({ data: { id, label: `Shell ${String.fromCharCode(64 + i)}`, role: 'mule', flagged: true } });
      }
      for (let i = 1; i <= count; i++) {
        const next = i === count ? 1 : i + 1;
        edges.push({ data: { id: `e-r-${i}`, source: `ring-${i}`, target: `ring-${next}`, label: '₹75,000' } });
      }
    } else if (scenarioId === 'layering-intermediates') {
      // 3-tier cascade
      nodes.push({ data: { id: 'l-src', label: 'Origin', role: 'source', flagged: true } });
      nodes.push({ data: { id: 'l-m1', label: 'Tier-1 A', role: 'mule', flagged: true } });
      nodes.push({ data: { id: 'l-m2', label: 'Tier-1 B', role: 'mule', flagged: true } });
      nodes.push({ data: { id: 'l-i1', label: 'Wash A', role: 'inter', flagged: true } });
      nodes.push({ data: { id: 'l-i2', label: 'Wash B', role: 'inter', flagged: true } });
      nodes.push({ data: { id: 'l-dest', label: 'Offshore', role: 'terminal', flagged: true } });

      edges.push({ data: { id: 'e-l1', source: 'l-src', target: 'l-m1', label: '₹1.8L' } });
      edges.push({ data: { id: 'e-l2', source: 'l-src', target: 'l-m2', label: '₹1.5L' } });
      edges.push({ data: { id: 'e-l3', source: 'l-m1', target: 'l-i1', label: '₹1.7L' } });
      edges.push({ data: { id: 'e-l4', source: 'l-m2', target: 'l-i2', label: '₹1.4L' } });
      edges.push({ data: { id: 'e-l5', source: 'l-i1', target: 'l-dest', label: '₹1.65L' } });
      edges.push({ data: { id: 'e-l6', source: 'l-i2', target: 'l-dest', label: '₹1.38L' } });
    } else {
      // Coordinated mule cluster or adaptive pattern
      const count = Math.min(nodeCount, 8);
      for (let i = 1; i <= count; i++) {
        const id = `coord-${i}`;
        nodes.push({ data: { id, label: `Bot Node ${i}`, role: i <= 2 ? 'source' : 'mule', flagged: true } });
      }
      for (let i = 1; i < count; i++) {
        edges.push({ data: { id: `e-c-${i}`, source: `coord-${i}`, target: `coord-${i + 1}`, label: '₹40k' } });
      }
      if (count > 3) {
        edges.push({ data: { id: 'e-cross-1', source: 'coord-1', target: `coord-${count}`, label: '₹85k' } });
      }
    }

    return [...nodes, ...edges];
  }, []);

  // Initialize/Update Scenario Topology Cytoscape instance
  useEffect(() => {
    if (!graphContainerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements = generateScenarioGraphElements(selectedScenario.id, intermediaries);

    const cy = cytoscape({
      container: graphContainerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1E293B',
            label: 'data(label)',
            color: '#0F172A',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-wrap': 'wrap',
            width: 38,
            height: 38,
            'border-width': 2,
            'border-color': '#FFFFFF',
          },
        },
        {
          selector: 'node[role = "victim"]',
          style: { 'background-color': '#0284C7', shape: 'ellipse' },
        },
        {
          selector: 'node[role = "source"]',
          style: { 'background-color': '#DC2626', shape: 'ellipse', 'border-width': 3, 'border-color': '#FCA5A5' },
        },
        {
          selector: 'node[role = "mule"]',
          style: { 'background-color': '#EA580C', shape: 'round-rectangle' },
        },
        {
          selector: 'node[role = "inter"]',
          style: { 'background-color': '#334155', shape: 'ellipse' },
        },
        {
          selector: 'node[role = "terminal"]',
          style: { 'background-color': '#7C3AED', shape: 'diamond', width: 44, height: 44, 'border-width': 3, 'border-color': '#DDD6FE' },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#CBD5E1',
            'target-arrow-color': '#94A3B8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '9px',
            'font-family': 'JetBrains Mono, monospace',
            color: '#475569',
            'text-background-opacity': 0.9,
            'text-background-color': '#FFFFFF',
            'text-background-padding': '2px',
          },
        },
        {
          selector: '.sim-flagged',
          style: {
            'border-color': '#DC2626',
            'border-width': 4,
            'line-color': '#DC2626',
            'target-arrow-color': '#DC2626',
          },
        },
      ],
      layout: {
        name: selectedScenario.id === 'circular-transfers' ? 'circle' : 'breadthfirst',
        directed: true,
        padding: 30,
        animate: true,
      },
      userZoomingEnabled: false,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [selectedScenario, intermediaries, generateScenarioGraphElements]);

  // Update parameters when scenario changes
  const handleSelectScenario = (sc: SimulationScenario) => {
    setSelectedScenario(sc);
    setVolume(sc.defaultVolume);
    setIntermediaries(sc.defaultIntermediaries);
    setAmountMin(sc.defaultAmountMin);
    setAmountMax(sc.defaultAmountMax);
    setComplexity(sc.complexity);
    setResultsReady(false);
    setSimulatedStream([]);
    setProgress(0);
  };

  // Run simulation effect
  useEffect(() => {
    if (!isSimulating) return;

    setProgress(0);
    setResultsReady(false);
    setSimulatedStream([]);

    const phases = [
      { at: 15, msg: 'Injecting synthetic UPI transactions into stream...' },
      { at: 35, msg: 'Evaluating high-velocity sliding counters & in-degree ratio...' },
      { at: 65, msg: 'Matching structural graph motif against known fraud typologies...' },
      { at: 85, msg: 'Executing anomaly score thresholding & automated quarantine...' },
      { at: 100, msg: 'Simulation run complete. Threat vector isolated.' },
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      const currentPhase = phases.find((p) => p.at >= currentProgress);
      if (currentPhase) {
        setPhaseMessage(currentPhase.msg);
      }

      // Add scenario-specific simulated transaction to stream
      if (currentProgress % 15 === 0) {
        const isFlagged = currentProgress >= 45;
        const firedRule = isFlagged
          ? selectedScenario.keyRuleTriggers[
              Math.floor(Math.random() * selectedScenario.keyRuleTriggers.length)
            ]
          : undefined;

        const newEvent: SimulatedEvent = {
          id: `SIM-TXN-${1000 + currentProgress}`,
          sender: `sim_sender_${Math.floor(Math.random() * 80) + 10}@okaxis`,
          receiver: isFlagged
            ? `quarantine_drop${Math.floor(Math.random() * 5) + 1}@paytm`
            : `merchant_retail${Math.floor(Math.random() * 20) + 1}@hdfcbank`,
          amount: Math.floor(Math.random() * (amountMax - amountMin)) + amountMin,
          riskScore: isFlagged ? Math.floor(Math.random() * 20) + 78 : Math.floor(Math.random() * 20) + 5,
          flagged: isFlagged,
          time: new Date().toLocaleTimeString(),
          ruleFired: firedRule,
        };
        setSimulatedStream((prev) => [newEvent, ...prev.slice(0, 6)]);

        // Flash graph elements
        if (isFlagged && cyRef.current) {
          cyRef.current.nodes('[role != "victim"]').addClass('sim-flagged');
          cyRef.current.edges().addClass('sim-flagged');
        }
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
        setResultsReady(true);
      }
    }, 110);

    return () => clearInterval(interval);
  }, [isSimulating, amountMin, amountMax, selectedScenario]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    // Trigger real backend simulation engine asynchronously
    apiService.runSimulation({
      scenario_id: selectedScenario.id,
      volume,
      intermediaries,
      amount_min: amountMin,
      amount_max: amountMax,
      complexity,
    }).then((res) => {
      if (res && res.simulated_stream) {
        setBackendSimResult(res);
        // Map backend scored stream to UI stream
        const mappedStream: SimulatedEvent[] = res.simulated_stream.slice(0, 10).map((evt: any) => ({
          id: evt.id,
          sender: evt.sender,
          receiver: evt.receiver,
          amount: evt.amount,
          riskScore: evt.risk_score,
          flagged: evt.flagged,
          time: evt.time,
          ruleFired: evt.rule_fired,
        }));
        setSimulatedStream(mappedStream);
      }
    }).catch(() => {});
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setProgress(0);
    setPhaseMessage('Ready for simulation');
    setSimulatedStream([]);
    setResultsReady(false);
    setBackendSimResult(null);
    if (cyRef.current) {
      cyRef.current.elements().removeClass('sim-flagged');
    }
  };

  // Derived calculation metrics (using live backend results if available)
  const estimatedTheft = backendSimResult?.metrics?.total_simulated_volume ?? ((volume * (amountMin + amountMax)) / 4);
  const interceptedAmount = backendSimResult?.metrics?.mitigated_loss_amount ?? (estimatedTheft * 0.968);
  const detectionRate = backendSimResult?.metrics?.detection_rate_percent ?? 96.8;
  const scoringLatency = backendSimResult?.metrics?.mean_pipeline_latency_ms ? `${backendSimResult.metrics.mean_pipeline_latency_ms} ms` : '11.4 ms';
  const quarantinedNodesCount = backendSimResult?.metrics?.quarantined_accounts_count ? `${backendSimResult.metrics.quarantined_accounts_count} VPAs` : `${intermediaries} VPAs`;

  return (
    <div className="space-y-6">
      {/* Synthetic Demo Banner */}
      <SyntheticBanner label="FRAUD INTELLIGENCE LAB — Interactive stress-testbed. All outcomes, feeds, and interception figures are synthetic simulation demonstrations for hackathon benchmarking." />

      {/* Header */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-600 uppercase tracking-wider mb-1">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Adversarial Attack Vector Laboratory</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-navy-900">
              Interactive Fraud Attack Simulator
            </h1>
            <p className="text-xs text-navy-600 mt-1 max-w-2xl leading-relaxed">
              Stress-test StreamShield real-time detection rules against synthetic fraud attack typologies. Inject coordinated mule rings, smurfing structures, and circular wash loops to benchmark detection latency.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSimulation}
              disabled={isSimulating}
              className="px-3 py-2 rounded-lg border border-border bg-canvas hover:bg-surface-subtle text-navy-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleStartSimulation}
              disabled={isSimulating}
              className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* 6 Scenario Tabs */}
        <div className="mt-6 pt-5 border-t border-border">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-navy-500 block mb-2">
            Select Adversarial Scenario Typology:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {mockSimulationScenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                disabled={isSimulating}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                  selectedScenario.id === sc.id
                    ? 'border-coral-500 bg-coral-50/50 shadow-sm'
                    : 'border-border bg-canvas hover:bg-surface-subtle text-navy-700'
                }`}
              >
                <div className="font-semibold text-navy-900 truncate">
                  {sc.name.split('.')[1] || sc.name}
                </div>
                <div className="text-[10px] text-navy-500 mt-1 flex items-center gap-1">
                  <span>Complexity:</span>
                  <span
                    className={`font-semibold ${
                      sc.complexity === 'Extreme'
                        ? 'text-red-600'
                        : sc.complexity === 'High'
                        ? 'text-orange-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {sc.complexity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls (1 col) + Right Simulation Engine (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls (1 Col) */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-navy-500" />
              Attack Vector Parameters
            </h3>
            <span className="text-[10px] font-mono text-navy-400">Tunable Inputs</span>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-navy-600 font-medium">Target Ingestion Volume</span>
              <span className="font-mono font-bold text-navy-900">{volume} tx/sec</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={volume}
              disabled={isSimulating}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full accent-coral-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-navy-400 font-mono">
              <span>50 TPS</span>
              <span>1,000 TPS</span>
            </div>
          </div>

          {/* Intermediary Accounts */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-navy-600 font-medium">Layering / Mule Accounts</span>
              <span className="font-mono font-bold text-navy-900">{intermediaries} nodes</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={intermediaries}
              disabled={isSimulating}
              onChange={(e) => setIntermediaries(parseInt(e.target.value))}
              className="w-full accent-coral-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-navy-400 font-mono">
              <span>3 Nodes</span>
              <span>20 Nodes</span>
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-navy-600 font-medium">Transfer Amount Range</span>
              <span className="font-mono font-bold text-navy-900">
                {formatINR(amountMin)} - {formatINR(amountMax)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-navy-400 block mb-0.5">Min Amount (₹)</label>
                <input
                  type="number"
                  value={amountMin}
                  disabled={isSimulating}
                  onChange={(e) => setAmountMin(Number(e.target.value))}
                  className="w-full p-1.5 rounded border border-border bg-canvas font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-navy-400 block mb-0.5">Max Amount (₹)</label>
                <input
                  type="number"
                  value={amountMax}
                  disabled={isSimulating}
                  onChange={(e) => setAmountMax(Number(e.target.value))}
                  className="w-full p-1.5 rounded border border-border bg-canvas font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Complexity selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-navy-600 font-medium block">
              Adversarial Evasion Complexity
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(['Low', 'Medium', 'High', 'Extreme'] as const).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  disabled={isSimulating}
                  onClick={() => setComplexity(comp)}
                  className={`py-1 text-[11px] font-medium rounded border transition-colors ${
                    complexity === comp
                      ? 'bg-navy-900 text-white border-navy-900 font-semibold'
                      : 'bg-canvas text-navy-600 border-border hover:bg-surface-subtle'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Typology Overview summary */}
          <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs text-navy-600 space-y-1">
            <span className="font-semibold text-navy-900 block">Scenario Objective:</span>
            <p className="leading-relaxed">{selectedScenario.typologySummary}</p>
          </div>
        </div>

        {/* Live Simulation Engine & Results Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress & Live Execution Status */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity
                  className={`w-4 h-4 ${
                    isSimulating ? 'text-coral-500 animate-spin' : 'text-emerald-500'
                  }`}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Simulation Execution State
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold text-navy-700">
                {progress}% Complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-canvas rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-coral-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-navy-800">{phaseMessage}</span>
              <span className="font-mono text-navy-400 text-[11px]">
                {isSimulating ? 'Streaming Active' : resultsReady ? 'Completed' : 'Standby'}
              </span>
            </div>

            {/* Scenario Topology Graph Canvas & Live Feed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Cytoscape Simulation Preview Canvas */}
              <div className="p-3 rounded-xl border border-border bg-[#FAFBFD] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-navy-900">
                  <span className="flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-coral-500" />
                    Attack Graph Motif Topology
                  </span>
                  <span className="text-[10px] font-mono text-navy-500">Live Graph</span>
                </div>
                <div
                  ref={graphContainerRef}
                  className="w-full h-48 rounded-lg bg-white border border-border-subtle relative overflow-hidden"
                />
                <div className="flex justify-between text-[10px] font-mono text-navy-400 pt-1">
                  <span>Motif: {selectedScenario.id}</span>
                  <span>Interactive Preview</span>
                </div>
              </div>

              {/* Live Simulated Ingestion Feed */}
              <div className="p-3 rounded-xl border border-border bg-canvas space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-navy-900">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    Simulated Ingestion Stream
                  </span>
                  <span className="text-[10px] font-mono text-navy-500">
                    {simulatedStream.length} Events
                  </span>
                </div>

                <div className="space-y-1.5 h-48 overflow-y-auto">
                  {simulatedStream.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-navy-400 text-center p-4">
                      Click "Run Simulation" above to inject transaction events into the pipeline.
                    </div>
                  ) : (
                    simulatedStream.map((evt) => (
                      <div
                        key={evt.id}
                        className={`p-2 rounded border text-xs flex items-center justify-between transition-colors ${
                          evt.flagged
                            ? 'bg-red-50/70 border-red-200 text-red-900'
                            : 'bg-surface border-border text-navy-800'
                        }`}
                      >
                        <div className="truncate max-w-[140px]">
                          <span className="font-mono text-[10px] text-navy-400 block">{evt.time}</span>
                          <span className="font-mono text-[11px] truncate block">{evt.sender}</span>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <span className="font-bold text-xs">{formatINR(evt.amount)}</span>
                          <span
                            className={`block text-[10px] font-semibold ${
                              evt.flagged ? 'text-red-700' : 'text-emerald-700'
                            }`}
                          >
                            {evt.flagged ? `FLAGGED (${evt.riskScore})` : `CLEARED (${evt.riskScore})`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-[10px] text-navy-400 font-mono pt-1 text-right">
                  Sub-15ms Heuristic Evaluation
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Summary (Results Area) */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-coral-500" />
                Scenario Outcome & Detection Telemetry
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Synthetic Benchmark
              </span>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-canvas border border-border">
                <span className="text-[10px] uppercase text-navy-500 font-semibold block">
                  Interception Rate
                </span>
                <span className="text-xl font-bold font-mono text-emerald-600">{detectionRate}%</span>
                <span className="text-[10px] text-navy-400 block mt-0.5">High precision</span>
              </div>
              <div className="p-3.5 rounded-lg bg-canvas border border-border">
                <span className="text-[10px] uppercase text-navy-500 font-semibold block">
                  Prevented Loss
                </span>
                <span className="text-xl font-bold font-mono text-coral-600">
                  {formatINR(interceptedAmount)}
                </span>
                <span className="text-[10px] text-navy-400 block mt-0.5">Quarantined flow</span>
              </div>
              <div className="p-3.5 rounded-lg bg-canvas border border-border">
                <span className="text-[10px] uppercase text-navy-500 font-semibold block">
                  Quarantine Nodes
                </span>
                <span className="text-xl font-bold font-mono text-navy-900">
                  {quarantinedNodesCount}
                </span>
                <span className="text-[10px] text-navy-400 block mt-0.5">Mule cluster isolated</span>
              </div>
              <div className="p-3.5 rounded-lg bg-canvas border border-border">
                <span className="text-[10px] uppercase text-navy-500 font-semibold block">
                  Scoring Latency
                </span>
                <span className="text-xl font-bold font-mono text-navy-900">{scoringLatency}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Within UPI SLA</span>
              </div>
            </div>

            {/* Fraud DNA Match Badge if Available */}
            {backendSimResult?.fraud_dna_match && (
              <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-semibold block">
                      Fraud DNA Match: {backendSimResult.fraud_dna_match.archetype_name}
                    </span>
                    <span className="text-[11px] text-purple-700">
                      {backendSimResult.fraud_dna_match.narrative}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-purple-700 shrink-0">
                  {backendSimResult.fraud_dna_match.similarity_percentage}% Match
                </span>
              </div>
            )}

            {/* Detection Explanation Panel */}
            <div className="p-4 rounded-lg bg-canvas border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                <Cpu className="w-3.5 h-3.5 text-coral-500" />
                <span>Detection Explanation & Algorithm Rationalization:</span>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                {selectedScenario.detectionExplanation}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-navy-500 mr-1">Fired Rules:</span>
                {selectedScenario.keyRuleTriggers.map((rule, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-navy-700"
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
