import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowUpRight,
  Radio,
  Zap,
  Network,
  Clock,
  Filter,
  ArrowRight,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatINR } from '../data/mockData';
import { useStreamShield } from '../context/StreamShieldContext';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

type TimeRange = '1H' | '24H' | '7D' | '30D';

const chartDataMap: Record<TimeRange, Array<{ time: string; volume: number; fraud: number }>> = {
  '1H': [
    { time: '16:00', volume: 1420, fraud: 12 },
    { time: '16:10', volume: 1850, fraud: 24 },
    { time: '16:20', volume: 2210, fraud: 18 },
    { time: '16:30', volume: 3100, fraud: 39 },
    { time: '16:40', volume: 2840, fraud: 45 },
    { time: '16:50', volume: 2410, fraud: 28 },
  ],
  '24H': [
    { time: '00:00', volume: 12000, fraud: 140 },
    { time: '04:00', volume: 6500, fraud: 80 },
    { time: '08:00', volume: 24000, fraud: 310 },
    { time: '12:00', volume: 48000, fraud: 620 },
    { time: '16:00', volume: 56000, fraud: 740 },
    { time: '20:00', volume: 41000, fraud: 490 },
    { time: '23:59', volume: 22000, fraud: 210 },
  ],
  '7D': [
    { time: 'Mon', volume: 280000, fraud: 3400 },
    { time: 'Tue', volume: 310000, fraud: 4100 },
    { time: 'Wed', volume: 295000, fraud: 3800 },
    { time: 'Thu', volume: 340000, fraud: 4600 },
    { time: 'Fri', volume: 410000, fraud: 5900 },
    { time: 'Sat', volume: 380000, fraud: 5100 },
    { time: 'Sun', volume: 320000, fraud: 3900 },
  ],
  '30D': [
    { time: 'W1', volume: 1200000, fraud: 16500 },
    { time: 'W2', volume: 1450000, fraud: 18200 },
    { time: 'W3', volume: 1620000, fraud: 21400 },
    { time: 'W4', volume: 1510000, fraud: 19800 },
  ],
};

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const {
    transactions,
    setSelectedTxId,
    setSelectedPresetId,
    isSimulatingGlobalStream,
    setIsSimulatingGlobalStream,
  } = useStreamShield();

  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [selectedTxFilter, setSelectedTxFilter] = useState<'all' | 'high_risk'>('high_risk');

  // Filter transactions for recent table
  const displayedTxns = selectedTxFilter === 'high_risk'
    ? transactions.filter((tx) => tx.riskScore >= 70).slice(0, 6)
    : transactions.slice(0, 6);

  // Dynamic metrics from current transaction state
  const totalMonitoredAmount = transactions.reduce((acc, t) => acc + t.amount, 148200000);
  const interceptedAmount = transactions
    .filter((t) => t.decision === 'blocked')
    .reduce((acc, t) => acc + t.amount, 8420000);

  const activeNetworks = [
    {
      id: 'syndicate-falcon',
      name: 'Syndicate Falcon',
      motif: '4-Hop Funnel Layering',
      nodes: 9,
      flow: 485000,
      severity: 'critical' as const,
      urgency: 'Immediate Action Required',
    },
    {
      id: 'smurfing-cascade',
      name: 'Smurfing Micro-Cascade',
      motif: 'Structuring (Sub-₹50k)',
      nodes: 7,
      flow: 240000,
      severity: 'high' as const,
      urgency: 'Quarantine Active',
    },
    {
      id: 'circular-wash',
      name: 'Circular Wash Typology',
      motif: 'Zero-Sum Merchant Ring',
      nodes: 4,
      flow: 180000,
      severity: 'medium' as const,
      urgency: 'Tax Intelligence Flag',
    },
  ];

  const systemFeed = [
    { time: '16:45', text: 'Section 91 CrPC notice auto-drafted for Case 0841', type: 'legal' },
    { time: '16:43', text: 'Rule RULE-UPI-MULE-CASCADE quarantined 3 downstream accounts', type: 'engine' },
    { time: '16:42', text: 'SIM-swap webhook correlate verified for amit.verma91@okhdfcbank', type: 'telco' },
    { time: '16:38', text: 'PAN structuring anomaly identified for crypto_vault_quick@kotak', type: 'alert' },
    { time: '16:30', text: 'Tarjan cycle algorithm detected closed loop in Gujarat corridor', type: 'graph' },
  ];

  const handleInspectTransaction = (txId: string) => {
    setSelectedTxId(txId);
    navigate('/transactions');
  };

  const handleInspectNetwork = (networkId: string) => {
    setSelectedPresetId(networkId);
    navigate('/money-trail');
  };

  return (
    <div className="space-y-6">
      {/* Synthetic Demonstration Notice Banner */}
      <SyntheticBanner label="DEMO SIMULATION: All UPI transaction trails, accounts, and risk vectors shown are synthetic fixtures for architecture verification." />

      {/* Header & Status Section */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-navy-500 uppercase tracking-wider mb-1">
            <span>National Payments Corporation of India (UPI Stream)</span>
            <span>•</span>
            <span>Simulated Baseline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            Real-Time Financial Crime Intelligence
          </h1>
          <p className="text-sm text-navy-600 mt-1 max-w-2xl">
            StreamShield millisecond-level heuristic engine and graph intelligence monitoring active UPI event vectors across interconnected bank handles.
          </p>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-canvas border border-border rounded-lg px-4 py-2.5 text-right">
            <div className="text-[10px] uppercase font-semibold text-navy-500 tracking-wider">
              24h Monitored Flow
            </div>
            <div className="text-lg font-bold font-mono text-navy-900">
              {formatINR(totalMonitoredAmount)}
            </div>
          </div>
          <div className="bg-coral-50 border border-coral-200/80 rounded-lg px-4 py-2.5 text-right">
            <div className="text-[10px] uppercase font-semibold text-coral-700 tracking-wider flex items-center justify-end gap-1">
              <ShieldAlert className="w-3 h-3 text-coral-500" />
              Intercepted Loss
            </div>
            <div className="text-lg font-bold font-mono text-coral-700">
              {formatINR(interceptedAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Layout: Left 2/3 Main Stream, Right 1/3 Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Volume & Fraud Trends Chart */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
              <div>
                <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-coral-500" />
                  Stream Volume & Intercepted Fraud Velocity
                </h2>
                <p className="text-xs text-navy-500 mt-0.5">
                  High-throughput event volume versus flagged illicit money movements
                </p>
              </div>

              {/* Time Range Filter Buttons */}
              <div className="inline-flex rounded-md border border-border bg-surface-subtle p-0.5 self-start">
                {(['1H', '24H', '7D', '30D'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
                      timeRange === range
                        ? 'bg-surface text-navy-900 shadow-sm font-semibold'
                        : 'text-navy-500 hover:text-navy-900'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartDataMap[timeRange]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F05333" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F05333" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E6EE' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E6EE' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E6EE',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="Transactions (TPS)"
                    stroke="#0F172A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#volumeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fraud"
                    name="Flagged Risk Events"
                    stroke="#F05333"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#fraudGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-navy-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-navy-900 inline-block" />
                  Total Throughput Volume
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-coral-500 inline-block" />
                  Flagged Threat Interceptions
                </span>
              </div>
              <span className="font-mono text-[11px] text-navy-400">
                Resolution: 10-second sliding buckets
              </span>
            </div>
          </div>

          {/* Active Suspicious Networks / Mule Rings Overview */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                  <Network className="w-4 h-4 text-coral-500" />
                  Active Mule Rings & Suspicious Topologies
                </h2>
                <p className="text-xs text-navy-500 mt-0.5">
                  Multi-hop transaction subgraphs currently under automated containment
                </p>
              </div>
              <button
                onClick={() => navigate('/money-trail')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-coral-600 hover:text-coral-700 transition-colors"
              >
                Launch Money Trail Explorer <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {activeNetworks.map((net) => (
                <div
                  key={net.id}
                  onClick={() => handleInspectNetwork(net.id)}
                  className="p-4 rounded-lg border border-border bg-canvas hover:bg-surface-subtle transition-all cursor-pointer group hover:border-coral-300 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-navy-900 group-hover:text-coral-600 transition-colors">
                      {net.name}
                    </span>
                    <RiskBadge level={net.severity} showIcon={false} />
                  </div>
                  <div className="text-[11px] text-navy-500 mt-1 font-mono">{net.motif}</div>

                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-navy-400 font-semibold">Nodes</div>
                      <div className="font-mono font-bold text-navy-800">{net.nodes} VPAs</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-navy-400 font-semibold">Flow</div>
                      <div className="font-mono font-bold text-coral-600">{formatINR(net.flow)}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] font-medium text-navy-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
                    <span>{net.urgency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent High-Risk Transactions Table */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-coral-500" />
                  Recent High-Risk Ingestion Events
                </h2>
                <p className="text-xs text-navy-500 mt-0.5">
                  Transactions scoring above the alert threshold in real-time scoring
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedTxFilter(selectedTxFilter === 'high_risk' ? 'all' : 'high_risk')
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-border bg-surface-subtle text-navy-700 hover:bg-surface font-medium"
                >
                  <Filter className="w-3 h-3 text-navy-500" />
                  {selectedTxFilter === 'high_risk' ? 'Filter: High Risk (70+)' : 'Show All'}
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900 transition-colors"
                >
                  Full Table <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-navy-500 uppercase tracking-wider">
                    <th className="pb-2.5 pl-1">Tx ID</th>
                    <th className="pb-2.5">Sender VPA</th>
                    <th className="pb-2.5">Receiver VPA</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-center">Risk Score</th>
                    <th className="pb-2.5 text-center">Decision</th>
                    <th className="pb-2.5 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {displayedTxns.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => handleInspectTransaction(tx.id)}
                      className="hover:bg-canvas transition-colors cursor-pointer"
                    >
                      <td className="py-3 pl-1 font-mono font-medium text-navy-900">{tx.id}</td>
                      <td className="py-3 font-mono text-navy-700">
                        <div className="truncate max-w-[140px]" title={tx.senderVpa}>
                          {tx.senderVpa}
                        </div>
                      </td>
                      <td className="py-3 font-mono text-navy-700">
                        <div className="truncate max-w-[140px]" title={tx.receiverVpa}>
                          {tx.receiverVpa}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-navy-900">
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 text-center">
                        <RiskBadge score={tx.riskScore} level={tx.riskLevel} />
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={tx.decision} />
                      </td>
                      <td className="py-3 text-right pr-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectTransaction(tx.id);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-coral-600 hover:text-coral-700"
                        >
                          Inspect <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Live Feeds & Telemetry */}
        <div className="space-y-6">
          {/* Live Ingestion Stream Card */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    isSimulatingGlobalStream ? 'text-emerald-500 animate-pulse' : 'text-amber-500'
                  }`}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Live Event Stream
                </h3>
              </div>
              <button
                onClick={() => setIsSimulatingGlobalStream(!isSimulatingGlobalStream)}
                className="text-[11px] font-mono text-navy-500 hover:text-navy-900 flex items-center gap-1"
                title="Pause or resume live simulated transactions"
              >
                {isSimulatingGlobalStream ? (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 text-navy-400" /> Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-600" /> Resume
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-navy-500 mt-2">
              Continuous synthetic UPI transaction arrival rate. Evaluated in sub-15ms.
            </p>

            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto">
              {transactions.slice(0, 5).map((tx, idx) => (
                <div
                  key={tx.id}
                  onClick={() => handleInspectTransaction(tx.id)}
                  className="p-3 rounded-lg border border-border-subtle bg-canvas text-xs space-y-1 hover:border-coral-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-navy-500 text-[11px]">
                      {idx === 0 ? 'Just now' : `${idx * 2 + 1}m ago`}
                    </span>
                    <span className="font-mono font-bold text-navy-900">{formatINR(tx.amount)}</span>
                  </div>
                  <div className="font-mono text-[11px] text-navy-700 truncate" title={tx.senderVpa}>
                    {tx.senderVpa}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle/80">
                    <span className="text-[10px] font-mono text-navy-400">Latency: {tx.latencyMs}ms</span>
                    <RiskBadge score={tx.riskScore} level={tx.riskLevel} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Audit & Action Feed */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-navy-500" />
                Audit & Analyst Activity
              </h3>
              <span className="text-[10px] font-mono text-navy-400">Today</span>
            </div>

            <div className="mt-4 space-y-3.5">
              {systemFeed.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="font-mono text-[10px] text-navy-400 shrink-0 mt-0.5">
                    {item.time}
                  </span>
                  <div className="flex-1">
                    <p className="text-navy-700 leading-snug">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-border-subtle">
              <button
                onClick={() => navigate('/investigations')}
                className="w-full py-2 text-center text-xs font-semibold text-navy-800 hover:text-navy-950 bg-canvas hover:bg-surface-subtle border border-border rounded-md transition-colors"
              >
                Open Investigation Docket
              </button>
            </div>
          </div>

          {/* System Resilience / Architecture Box */}
          <div className="bg-navy-950 text-white rounded-xl p-6 shadow-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-coral-400 font-semibold">
                Engine Telemetry
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-white">
              4,850 Peak TPS
            </div>
            <p className="text-xs text-navy-300 mt-2 leading-relaxed">
              FastAPI asynchronous scoring pipeline coupled with streaming graph motif matching.
            </p>
            <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-xs font-mono text-navy-400">
              <span>F1 Benchmark</span>
              <span className="text-emerald-400 font-bold">0.973 (Sim)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
