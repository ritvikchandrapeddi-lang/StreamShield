import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
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

export const ModelPerformanceView: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(75);

  const {
    summary,
    confusionMatrix,
    rocData,
    latencyDistribution,
    modelComparison,
    costAnalysis,
  } = mockModelMetrics;

  return (
    <div className="space-y-6">
      {/* Synthetic Demo Banner */}
      <SyntheticBanner label="ILLUSTRATIVE BENCHMARK VALUES — All evaluation curves, confusion matrices, and throughput metrics are synthetic demonstration values for hackathon architecture defense." />

      {/* Header */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-canvas border border-border text-navy-700">
            Model: <strong className="text-navy-900">GNN-Hybrid-v2.1</strong>
          </span>
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
            Status: Active
          </span>
        </div>
      </div>

      {/* Top Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            Precision
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
            {summary.precision}%
          </div>
          <div className="text-[10px] text-navy-400 mt-1">TP / (TP + FP)</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            Recall
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
            {summary.recall}%
          </div>
          <div className="text-[10px] text-navy-400 mt-1">TP / (TP + FN)</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            F1-Score
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {summary.f1Score}
          </div>
          <div className="text-[10px] text-navy-400 mt-1">Harmonic mean</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            False Positive Rate
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
            {summary.falsePositiveRate}%
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">Low customer friction</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-card col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase text-navy-500 tracking-wider">
            ROC-AUC
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
            {summary.rocAuc}
          </div>
          <div className="text-[10px] text-navy-400 mt-1">Separation capacity</div>
        </div>
      </div>

      {/* Latency & Throughput SLA Bar */}
      <div className="bg-navy-950 text-white rounded-xl p-5 shadow-card grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">p50 Latency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{summary.p50LatencyMs} ms</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">Median transaction turnaround</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">p95 Latency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{summary.p95LatencyMs} ms</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">95% under 12ms</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">p99 Latency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{summary.p99LatencyMs} ms</span>
          <span className="text-[10px] text-navy-400 block mt-0.5">Strict sub-15ms compliance</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-navy-400 block">Peak Ingestion</span>
          <span className="text-xl font-bold font-mono text-coral-400">{summary.peakTps} TPS</span>
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
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              AUC: 0.991
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
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
                  formatter={(val: number) => [val, 'Rate']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E6EE',
                    fontSize: '11px',
                  }}
                />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  name="StreamShield ROC"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#7C3AED' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-navy-500 text-center font-mono pt-1">
            Model achieves 96.2% True Positive Rate at &lt; 1% False Positive Rate boundary.
          </div>
        </div>

        {/* Confusion Matrix (Interactive Visual Grid) */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Confusion Matrix Evaluation
              </h3>
              <p className="text-[11px] text-navy-500 mt-0.5">
                Evaluation across {confusionMatrix.totalEvaluated.toLocaleString()} synthetic benchmark transactions
              </p>
            </div>
            <span className="text-xs font-mono text-navy-500">Benchmark Split</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* True Positive */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>True Positive (TP)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
                {confusionMatrix.truePositive.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                Illicit fraud attempts successfully caught and blocked.
              </p>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                <span>False Positive (FP)</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {confusionMatrix.falsePositive}
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                Genuine payments erroneously flagged (0.008% friction).
              </p>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center justify-between text-xs font-semibold text-red-800">
                <span>False Negative (FN)</span>
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-red-900 mt-1">
                {confusionMatrix.falseNegative}
              </div>
              <p className="text-[11px] text-red-700 mt-1">
                Evasive fraud passed through to post-settlement audits.
              </p>
            </div>

            {/* True Negative */}
            <div className="p-4 rounded-xl bg-canvas border border-border">
              <div className="flex items-center justify-between text-xs font-semibold text-navy-800">
                <span>True Negative (TN)</span>
                <CheckCircle2 className="w-4 h-4 text-navy-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-navy-900 mt-1">
                {confusionMatrix.trueNegative.toLocaleString()}
              </div>
              <p className="text-[11px] text-navy-500 mt-1">
                Legitimate UPI transactions cleared with sub-5ms latency.
              </p>
            </div>
          </div>
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
              <BarChart data={latencyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <span className="font-semibold text-navy-800">
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
                {formatINR(costAnalysis.fraudLossPreventedINR)}
              </span>
              <span className="text-[10px] text-navy-500">Based on active quarantine</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface">
              <span className="text-[10px] text-navy-400 uppercase font-semibold block">
                Customer Friction Rate
              </span>
              <span className="font-mono text-lg font-bold text-emerald-600 block mt-0.5">
                {costAnalysis.genuineTxFrictionRate}
              </span>
              <span className="text-[10px] text-navy-500">Industry baseline &lt; 0.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Architecture Comparison Table */}
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
              {modelComparison.map((m, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-coral-50/30 font-semibold' : ''}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
