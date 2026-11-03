import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  Activity,
  Sliders,
  Cpu,
} from 'lucide-react';
import { mockSimulationScenarios, formatINR } from '../data/mockData';
import { SimulationScenario } from '../types';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

interface SimulatedEvent {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  riskScore: number;
  flagged: boolean;
  time: string;
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
      { at: 15, msg: 'Generating synthetic UPI transaction burst...' },
      { at: 40, msg: 'Executing stream ingestion & sliding-window velocity counters...' },
      { at: 70, msg: 'Matching structural graph motifs & Tarjan cycle checks...' },
      { at: 90, msg: 'Evaluating GNN anomaly embeddings & heuristic thresholds...' },
      { at: 100, msg: 'Simulation run complete. Generating intelligence docket.' },
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      const currentPhase = phases.find((p) => p.at >= currentProgress);
      if (currentPhase) {
        setPhaseMessage(currentPhase.msg);
      }

      // Add a simulated transaction to the stream every 15%
      if (currentProgress % 15 === 0) {
        const isSuspicious = currentProgress > 45;
        const newEvent: SimulatedEvent = {
          id: `SIM-TXN-${1000 + currentProgress}`,
          sender: `user.sim_${Math.floor(Math.random() * 80) + 10}@okaxis`,
          receiver: isSuspicious
            ? `quarantine_drop${Math.floor(Math.random() * 5) + 1}@paytm`
            : `retail.kirana${Math.floor(Math.random() * 20) + 1}@hdfcbank`,
          amount: Math.floor(Math.random() * (amountMax - amountMin)) + amountMin,
          riskScore: isSuspicious ? Math.floor(Math.random() * 25) + 75 : Math.floor(Math.random() * 20) + 5,
          flagged: isSuspicious,
          time: new Date().toLocaleTimeString(),
        };
        setSimulatedStream((prev) => [newEvent, ...prev.slice(0, 7)]);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
        setResultsReady(true);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isSimulating, amountMin, amountMax]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setProgress(0);
    setPhaseMessage('Ready for simulation');
    setSimulatedStream([]);
    setResultsReady(false);
  };

  // Derived calculation metrics
  const estimatedTheft = (volume * (amountMin + amountMax)) / 4;
  const interceptedAmount = estimatedTheft * 0.962;

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
                <div className="font-semibold text-navy-900 truncate">{sc.name.split('.')[1] || sc.name}</div>
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

      {/* Main Grid: Left Controls (1 col) + Right Live Execution & Results (2 cols) */}
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
            <label className="text-xs text-navy-600 font-medium block">Adversarial Evasion Complexity</label>
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
                <Activity className={`w-4 h-4 ${isSimulating ? 'text-coral-500 animate-spin' : 'text-emerald-500'}`} />
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

            {/* Live streaming feed of synthetic transactions */}
            {simulatedStream.length > 0 && (
              <div className="pt-3 border-t border-border-subtle space-y-2">
                <span className="text-[10px] uppercase font-semibold text-navy-400 tracking-wider block">
                  Simulated Transaction Ingestion Ticker
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {simulatedStream.map((evt) => (
                    <div
                      key={evt.id}
                      className={`p-2 rounded border text-xs flex items-center justify-between transition-colors ${
                        evt.flagged
                          ? 'bg-red-50/70 border-red-200 text-red-900'
                          : 'bg-canvas border-border text-navy-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-navy-400">{evt.time}</span>
                        <span className="font-mono font-medium truncate max-w-[140px]">{evt.sender}</span>
                        <span>→</span>
                        <span className="font-mono font-medium truncate max-w-[140px]">{evt.receiver}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        <span className="font-bold">{formatINR(evt.amount)}</span>
                        {evt.flagged ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                            BLOCKED ({evt.riskScore})
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            OK ({evt.riskScore})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Simulation Outcome Summary (Shows after run or during results) */}
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
                <span className="text-xl font-bold font-mono text-emerald-600">96.8%</span>
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
                  {intermediaries} VPAs
                </span>
                <span className="text-[10px] text-navy-400 block mt-0.5">Mule cluster isolated</span>
              </div>
              <div className="p-3.5 rounded-lg bg-canvas border border-border">
                <span className="text-[10px] uppercase text-navy-500 font-semibold block">
                  Scoring Latency
                </span>
                <span className="text-xl font-bold font-mono text-navy-900">11.4 ms</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Within UPI SLA</span>
              </div>
            </div>

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
