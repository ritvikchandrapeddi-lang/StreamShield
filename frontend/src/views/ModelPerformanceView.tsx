import React, { useState, useMemo } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { mockModelMetrics, formatINR } from '../data/mockData';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

type EvaluationWindow = '24h' | '7d' | '30d';
type BenchmarkSplit = 'validation' | 'holdout';

export const ModelPerformanceView: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(75);
  const [evalWindow, setEvalWindow] = useState<EvaluationWindow>('24h');
  const [benchmarkSplit, setBenchmarkSplit] = useState<BenchmarkSplit>('validation');
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<'TP' | 'FP' | 'FN' | 'TN' | null>(null);
  const [selectedArch, setSelectedArch] = useState<number>(0);

  // Dynamic calculations based on threshold, window, and benchmark split
  const metrics = useMemo(() => {
    // Evaluation volume scale
    const windowMultiplier = evalWindow === '24h' ? 1 : evalWindow === '7d' ? 5.2 : 18.5;
    const baseSplitTotal = benchmarkSplit === 'validation' ? 50000 : 150000;
    const totalEvaluated = Math.round(baseSplitTotal * windowMultiplier);

    // Fraud prevalence ~ 2.4%
    const fraudPrevalence = benchmarkSplit === 'validation' ? 0.024 : 0.031;
    const actualFraud = Math.round(totalEvaluated * fraudPrevalence);
    const actualGenuine = totalEvaluated - actualFraud;

    // Recall & FPR as function of decision threshold (T in [50, 95])
    let recallRate: number;
    let fprRate: number;

    if (benchmarkSplit === 'validation') {
      recallRate = Math.max(0.74, Math.min(0.995, 0.962 + (75 - threshold) * 0.0034));
      fprRate = Math.max(0.00002, Math.min(0.0048, 0.00008 + (75 - threshold) * 0.000082));
    } else {
      // Adversarial holdout dataset
      recallRate = Math.max(0.68, Math.min(0.985, 0.938 + (75 - threshold) * 0.0039));
      fprRate = Math.max(0.00004, Math.min(0.0065, 0.00015 + (75 - threshold) * 0.00011));
    }

    const truePositive = Math.round(actualFraud * recallRate);
    const falseNegative = actualFraud - truePositive;
    const falsePositive = Math.round(actualGenuine * fprRate);
    const trueNegative = actualGenuine - falsePositive;

    const precision = truePositive / (truePositive + falsePositive || 1);
    const f1Score = (2 * precision * recallRate) / (precision + recallRate || 1);

    // Financial impact estimation
    const avgFraudTicketINR = 48500;
    const fraudLossPreventedINR = truePositive * avgFraudTicketINR;
    const frictionPct = ((falsePositive / actualGenuine) * 100).toFixed(3);

    // Latency SLAs
    const p50 = benchmarkSplit === 'validation' ? 4.2 : 5.6;
    const p95 = benchmarkSplit === 'validation' ? 9.8 : 12.1;
    const p99 = benchmarkSplit === 'validation' ? 14.1 : 16.8;
    const peakTps = benchmarkSplit === 'validation' ? 4850 : 4210;

    return {
      totalEvaluated,
      actualFraud,
      actualGenuine,
      truePositive,
      falseNegative,
      falsePositive,
      trueNegative,
      recallPct: (recallRate * 100).toFixed(1),
      precisionPct: (precision * 100).toFixed(1),
      f1Score: f1Score.toFixed(3),
      fprPct: (fprRate * 100).toFixed(3),
      fraudLossPreventedINR,
      frictionPct,
      p50,
      p95,
      p99,
      peakTps,
    };
  }, [threshold, evalWindow, benchmarkSplit]);

  // Scaled latency distribution
  const scaledLatencyData = useMemo(() => {
    const scale = evalWindow === '24h' ? 1 : evalWindow === '7d' ? 4.8 : 16.2;
    return mockModelMetrics.latencyDistribution.map((item) => ({
      ...item,
      count: Math.round(item.count * scale),
    }));
  }, [evalWindow]);

  // Dynamic ROC curve with active threshold marker
  const rocPoints = useMemo(() => {
    return [
      { fpr: 0.0, tpr: 0.0, threshold: 100 },
      { fpr: 0.00002, tpr: 0.88, threshold: 95 },
      { fpr: 0.00004, tpr: 0.92, threshold: 90 },
      { fpr: 0.00006, tpr: 0.945, threshold: 85 },
      { fpr: 0.00007, tpr: 0.955, threshold: 80 },
      { fpr: 0.00008, tpr: 0.962, threshold: 75 },
      { fpr: 0.00015, tpr: 0.974, threshold: 70 },
      { fpr: 0.00032, tpr: 0.981, threshold: 65 },
      { fpr: 0.00075, tpr: 0.988, threshold: 60 },
      { fpr: 0.0018, tpr: 0.993, threshold: 55 },
      { fpr: 0.0035, tpr: 0.997, threshold: 50 },
      { fpr: 0.01, tpr: 0.999, threshold: 40 },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Synthetic Demo Banner */}
      <SyntheticBanner label="ILLUSTRATIVE BENCHMARK VALUES — All evaluation curves, confusion matrices, and throughput metrics are synthetic demonstration values for hackathon architecture defense." />

      {/* Header with Benchmark Controls */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 uppercase tracking-wider mb-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hybrid Scoring Engine Telemetry</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-navy-900">
            Model Performance & Decision Tradeoffs
          </h1>
          <p className="text-xs text-navy-600 mt-1 max-w-2xl leading-relaxed">
            Evaluation metrics combining streaming feature attribution (SHAP), graph community motifs, and sliding-window velocity counters.
          </p>
        </div>

        {/* Evaluation Selectors */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Time Window */}
          <div className="flex items-center bg-canvas border border-border rounded-lg p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-navy-400 mx-1.5" />
            {(['24h', '7d', '30d'] as EvaluationWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setEvalWindow(w)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  evalWindow === w
                    ? 'bg-navy-900 text-white font-bold'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                {w.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Benchmark Split */}
          <div className="flex items-center bg-canvas border border-border rounded-lg p-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-navy-400 mx-1.5" />
            <button
              onClick={() => setBenchmarkSplit('validation')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                benchmarkSplit === 'validation'
                  ? 'bg-navy-900 text-white font-semibold'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Validation Split (50k)
            </button>
            <button
              onClick={() => setBenchmarkSplit('holdout')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                benchmarkSplit === 'holdout'
                  ? 'bg-navy-900 text-white font-semibold'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Adversarial Stress (150k)
            </button>
          </div>
        </div>
      </div>

      {/* Top Core Metrics Grid (Dynamically updated) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            Precision
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
            {metrics.precisionPct}%
          </div>
          <div className="text-[10px] text-navy-400 mt-1">TP / (TP + FP)</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            Recall
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
            {metrics.recallPct}%
          </div>
          <div className="text-[10px] text-navy-400 mt-1">TP / (TP + FN)</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            F1-Score
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {metrics.f1Score}
          </div>
          <div className="text-[10px] text-navy-400 mt-1">Harmonic mean</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            False Positive Rate
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
            {metrics.fprPct}%
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">Suppressed user friction</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            ROC-AUC
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
            {benchmarkSplit === 'validation' ? '0.991' : '0.978'}
          </div>
          <div className="text-[10px] text-navy-400 mt-1">Separation capacity</div>
        </div>
      </div>

      {/* Latency & Throughput SLA Bar */}
      <div className="bg-navy-950 text-white rounded-xl p-5 shadow-card grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">p50 Latency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{metrics.p50} ms</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">Median transaction turnaround</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">p95 Latency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{metrics.p95} ms</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">95% under SLA threshold</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">p99 Latency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{metrics.p99} ms</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">Strict sub-20ms compliance</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">Peak Ingestion</span>
          <span className="text-xl font-bold font-mono text-coral-400">{metrics.peakTps} TPS</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">FastAPI Async Pipeline</span>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve Chart */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Receiver Operating Characteristic (ROC Curve)
              </h3>
              <p className="text-[11px] text-navy-500 mt-0.5">
                True Positive Rate vs False Positive Rate across probability thresholds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Current T={threshold}
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocPoints} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis
                  dataKey="fpr"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94A3B8' }}
                />
                <YAxis
                  dataKey="tpr"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 1]}
                  label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    name === 'tpr' ? `${(val * 100).toFixed(1)}%` : val,
                    name === 'tpr' ? 'Recall (TPR)' : 'FPR',
                  ]}
                  labelFormatter={(lbl) => `FPR: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E6EE',
                    fontSize: '11px',
                  }}
                />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: 0.01, y: 1 }]}
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  name="StreamShield Hybrid GNN"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#7C3AED' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-navy-500 text-center font-mono pt-1">
            Achieves {metrics.recallPct}% TPR at {metrics.fprPct}% FPR on {evalWindow.toUpperCase()} sample.
          </div>
        </div>

        {/* Confusion Matrix (Interactive Visual Grid with Tooltip Info) */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Dynamic Confusion Matrix
              </h3>
              <p className="text-[11px] text-navy-500 mt-0.5">
                Evaluation across {metrics.totalEvaluated.toLocaleString()} synthetic benchmark transactions
              </p>
            </div>
            <span className="text-xs font-mono text-navy-500 bg-canvas px-2 py-0.5 rounded border border-border">
              Click cell to inspect
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* True Positive */}
            <div
              onClick={() => setSelectedMatrixCell(selectedMatrixCell === 'TP' ? null : 'TP')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedMatrixCell === 'TP'
                  ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>True Positive (TP)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
                {metrics.truePositive.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                Illicit fraud attempts successfully caught and blocked.
              </p>
            </div>

            {/* False Positive */}
            <div
              onClick={() => setSelectedMatrixCell(selectedMatrixCell === 'FP' ? null : 'FP')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedMatrixCell === 'FP'
                  ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-amber-50 border-amber-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                <span>False Positive (FP)</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {metrics.falsePositive.toLocaleString()}
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                Genuine payments flagged ({metrics.frictionPct}% customer friction).
              </p>
            </div>

            {/* False Negative */}
            <div
              onClick={() => setSelectedMatrixCell(selectedMatrixCell === 'FN' ? null : 'FN')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedMatrixCell === 'FN'
                  ? 'bg-red-100/70 border-red-500 ring-2 ring-red-500/20'
                  : 'bg-red-50 border-red-200 hover:border-red-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-red-800">
                <span>False Negative (FN)</span>
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-red-900 mt-1">
                {metrics.falseNegative.toLocaleString()}
              </div>
              <p className="text-[11px] text-red-700 mt-1">
                Evasive fraud passed through to post-settlement audits.
              </p>
            </div>

            {/* True Negative */}
            <div
              onClick={() => setSelectedMatrixCell(selectedMatrixCell === 'TN' ? null : 'TN')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedMatrixCell === 'TN'
                  ? 'bg-surface-subtle border-navy-500 ring-2 ring-navy-500/20'
                  : 'bg-canvas border border-border hover:border-navy-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-navy-800">
                <span>True Negative (TN)</span>
                <CheckCircle2 className="w-4 h-4 text-navy-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
                {metrics.trueNegative.toLocaleString()}
              </div>
              <p className="text-[11px] text-navy-500 mt-1">
                Legitimate UPI transactions cleared with sub-5ms latency.
              </p>
            </div>
          </div>

          {/* Interactive Cell Breakdown Note */}
          {selectedMatrixCell && (
            <div className="p-3 bg-canvas rounded-lg border border-border text-xs text-navy-700 flex items-start gap-2 animate-fadeIn">
              <Info className="w-4 h-4 text-navy-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-navy-900">
                  {selectedMatrixCell === 'TP' && 'True Positive Analysis:'}
                  {selectedMatrixCell === 'FP' && 'False Positive Cost Factor:'}
                  {selectedMatrixCell === 'FN' && 'False Negative Regulatory Exposure:'}
                  {selectedMatrixCell === 'TN' && 'True Negative Clearing Efficiency:'}
                </strong>{' '}
                {selectedMatrixCell === 'TP' &&
                  `Saved an estimated ${formatINR(metrics.fraudLossPreventedINR)} across ${metrics.truePositive.toLocaleString()} detected attacks.`}
                {selectedMatrixCell === 'FP' &&
                  `Represents ${metrics.falsePositive} legitimate buyers requested for OTP step-up authentication. Industry standard permits up to 0.05%.`}
                {selectedMatrixCell === 'FN' &&
                  `Represents ${metrics.falseNegative} evasive transactions requiring post-settlement graph reconstruction or LEA escalation.`}
                {selectedMatrixCell === 'TN' &&
                  `Cleared ${metrics.trueNegative.toLocaleString()} everyday user transactions with zero manual friction or checkout drop-off.`}
              </div>
            </div>
          )}
        </div>

        {/* Latency Distribution Histogram */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Turnaround Latency Distribution
              </h3>
              <p className="text-[11px] text-navy-500 mt-0.5">
                Evaluation duration from event ingress to decision emission
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              96.7% &lt; 10ms
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scaledLatencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString()} events`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E6EE',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Evaluated Events" fill="#0F172A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost-Aware Decision Analysis & Tradeoff Controls */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Cost-Aware Decision Tradeoff
              </h3>
              <p className="text-[11px] text-navy-500 mt-0.5">
                Balance fraud prevention against genuine user checkout friction
              </p>
            </div>
            <span className="text-xs font-mono text-navy-400">Risk vs Friction</span>
          </div>

          {/* Interactive Threshold Slider */}
          <div className="p-4 rounded-xl bg-canvas border border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-navy-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-coral-500" />
                Decision Threshold Sensitivity:
              </span>
              <span className="font-mono font-bold text-coral-600">{threshold} / 100</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full accent-coral-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-navy-400 font-mono">
              <span>Higher Recall (More Blocks)</span>
              <span>Lower Friction (Fewer Blocks)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-surface">
              <span className="text-[10px] text-navy-400 uppercase font-semibold block">
                Estimated Fraud Prevented
              </span>
              <span className="font-mono text-lg font-bold text-coral-600 block mt-0.5">
                {formatINR(metrics.fraudLossPreventedINR)}
              </span>
              <span className="text-[10px] text-navy-500">Based on {metrics.truePositive.toLocaleString()} caught attacks</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface">
              <span className="text-[10px] text-navy-400 uppercase font-semibold block">
                Customer Friction Rate
              </span>
              <span className="font-mono text-lg font-bold text-emerald-600 block mt-0.5">
                {metrics.frictionPct}%
              </span>
              <span className="text-[10px] text-navy-500">Only {metrics.falsePositive} false flags</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Architecture Comparison Table (Selectable Row) */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Model Typology Comparison (Benchmark Defense)
            </h3>
            <p className="text-[11px] text-navy-500 mt-0.5">
              Empirical justification for StreamShield hybrid graph architecture
            </p>
          </div>
          <span className="text-xs font-mono text-navy-400">Baseline Comparative</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-navy-500 uppercase tracking-wider">
                <th className="py-2.5">Architecture</th>
                <th className="py-2.5 text-center">F1-Score</th>
                <th className="py-2.5 text-center">Precision</th>
                <th className="py-2.5 text-center">Recall</th>
                <th className="py-2.5 text-center">False Positive</th>
                <th className="py-2.5 text-right">Inference Latency</th>
                <th className="py-2.5 text-right">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {mockModelMetrics.modelComparison.map((m, idx) => {
                const isSelected = selectedArch === idx;
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedArch(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-coral-50/40 font-semibold'
                        : 'hover:bg-canvas text-navy-800'
                    }`}
                  >
                    <td className="py-3 font-medium text-navy-900 flex items-center gap-2">
                      {idx === 0 && <span className="w-2 h-2 rounded-full bg-coral-500 shrink-0" />}
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3 text-center font-mono text-emerald-700">{m.f1Score}</td>
                    <td className="py-3 text-center font-mono text-navy-800">{m.precision}%</td>
                    <td className="py-3 text-center font-mono text-navy-800">{m.recall}%</td>
                    <td className="py-3 text-center font-mono text-navy-800">{m.fpr}</td>
                    <td className="py-3 text-right font-mono text-navy-900">{m.latency}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          idx === 0
                            ? 'bg-coral-100 text-coral-800 border-coral-200'
                            : 'bg-surface-subtle text-navy-600 border-border'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
