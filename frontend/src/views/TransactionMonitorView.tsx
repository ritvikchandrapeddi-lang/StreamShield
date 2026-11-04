import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldX,
  X,
  Smartphone,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatINR } from '../data/mockData';
import { Transaction, RiskLevel, Decision } from '../types';
import { useStreamShield } from '../context/StreamShieldContext';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

type SortField = 'timestamp' | 'amount' | 'riskScore';
type SortOrder = 'asc' | 'desc';
type TimeFilterOption = 'all' | '1h' | '24h' | '7d';

export const TransactionMonitorView: React.FC = () => {
  const { transactions, updateTransactionDecision, selectedTxId, setSelectedTxId } =
    useStreamShield();

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected transaction for the detail drawer
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Sync selectedTx with selectedTxId from context if arrived via navigation/alert
  useEffect(() => {
    if (selectedTxId) {
      const match = transactions.find((t) => t.id === selectedTxId);
      if (match) {
        setSelectedTx(match);
      }
    }
  }, [selectedTxId, transactions]);

  // Keep selectedTx state fresh when transaction decision updates in transactions array
  useEffect(() => {
    if (selectedTx) {
      const updated = transactions.find((t) => t.id === selectedTx.id);
      if (updated && updated.decision !== selectedTx.decision) {
        setSelectedTx(updated);
      }
    }
  }, [transactions, selectedTx]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const now = Date.now();

    return transactions
      .filter((tx) => {
        // Search text matching across id, sender, receiver, names
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          !q ||
          tx.id.toLowerCase().includes(q) ||
          tx.senderVpa.toLowerCase().includes(q) ||
          tx.receiverVpa.toLowerCase().includes(q) ||
          tx.senderName.toLowerCase().includes(q) ||
          tx.receiverName.toLowerCase().includes(q);

        // Risk level filter
        const matchesRisk =
          riskFilter === 'all' || tx.riskLevel === (riskFilter as RiskLevel);

        // Decision filter
        const matchesDecision =
          decisionFilter === 'all' || tx.decision === (decisionFilter as Decision);

        // Amount min/max
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Infinity;
        const matchesAmount = tx.amount >= min && tx.amount <= max;

        // Time range filter
        let matchesTime = true;
        if (timeFilter !== 'all') {
          const txTime = new Date(tx.timestamp).getTime();
          const diffHours = (now - txTime) / (1000 * 60 * 60);
          if (timeFilter === '1h') matchesTime = diffHours <= 1;
          else if (timeFilter === '24h') matchesTime = diffHours <= 24;
          else if (timeFilter === '7d') matchesTime = diffHours <= 168;
        }

        return matchesQuery && matchesRisk && matchesDecision && matchesAmount && matchesTime;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = new Date(valA).getTime();
          valB = new Date(b[sortField] as string).getTime();
        }
        if (sortOrder === 'asc') {
          return (valA as number) > (valB as number) ? 1 : -1;
        } else {
          return (valA as number) < (valB as number) ? 1 : -1;
        }
      });
  }, [
    transactions,
    searchQuery,
    riskFilter,
    decisionFilter,
    timeFilter,
    minAmount,
    maxAmount,
    sortField,
    sortOrder,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Action handlers
  const handleUpdateDecision = (newDecision: Decision) => {
    if (!selectedTx) return;
    updateTransactionDecision(selectedTx.id, newDecision);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRiskFilter('all');
    setDecisionFilter('all');
    setTimeFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTx(null);
    setSelectedTxId(null);
  };

  return (
    <div className="space-y-6 relative">
      <SyntheticBanner label="TRANSACTION MONITORING WORKSPACE — Real-time event feed with sub-15ms fraud risk scores, contextual risk factors, and operator triage controls." />

      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-border gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-navy-900">
            UPI Transaction Monitoring
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Searchable and sortable real-time event log with multi-hop heuristic risk factors and instant containment actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-surface px-3 py-1.5 rounded-lg border border-border text-navy-700">
            Total Monitored: <strong className="text-navy-900">{transactions.length} Transactions</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Query */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search VPA, account, name, or TxID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-canvas focus:bg-surface focus:border-navy-400 text-navy-900 placeholder:text-navy-400 outline-none transition-all"
            />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical (90+)</option>
              <option value="high">High (70 - 89)</option>
              <option value="medium">Medium (40 - 69)</option>
              <option value="low">Low (0 - 39)</option>
            </select>
          </div>

          {/* Decision Filter */}
          <div>
            <select
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none"
            >
              <option value="all">All Decisions</option>
              <option value="approved">Approved</option>
              <option value="review">Under Review</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as TimeFilterOption);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none"
            >
              <option value="all">All Time</option>
              <option value="1h">Last 1 Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          {/* Amount range filters */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Min ₹"
              className="w-1/2 px-2 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-900 placeholder:text-navy-400 outline-none"
            />
            <span className="text-navy-400">-</span>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Max ₹"
              className="w-1/2 px-2 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-900 placeholder:text-navy-400 outline-none"
            />
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border-subtle text-navy-500">
          <div>
            Showing <span className="font-semibold text-navy-900">{filteredTransactions.length}</span> matching transactions
          </div>
          {(searchQuery ||
            riskFilter !== 'all' ||
            decisionFilter !== 'all' ||
            timeFilter !== 'all' ||
            minAmount ||
            maxAmount) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-coral-600 hover:text-coral-700 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-canvas border-b border-border text-[11px] font-semibold text-navy-600 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Sender Profile</th>
                <th className="py-3 px-4">Receiver Profile</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-navy-900 select-none"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-navy-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-navy-900 select-none"
                  onClick={() => toggleSort('riskScore')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3 text-navy-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Decision</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-navy-900 select-none"
                  onClick={() => toggleSort('timestamp')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3 text-navy-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-navy-400">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm text-navy-700">No matching transactions found</p>
                    <p className="text-xs text-navy-500 mt-1">Try relaxing your search terms or filter criteria.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 text-xs rounded bg-canvas border border-border text-navy-800 hover:bg-surface font-medium"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`hover:bg-canvas transition-colors cursor-pointer ${
                      selectedTx?.id === tx.id ? 'bg-coral-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900">
                      {tx.id}
                      <span className="block text-[10px] text-navy-400 font-sans font-normal">
                        Channel: {tx.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-navy-800">
                      <div className="font-sans font-semibold text-navy-900 text-[12px]">{tx.senderName}</div>
                      <div className="text-[11px] text-navy-500 truncate max-w-[160px]">{tx.senderVpa}</div>
                      <div className="text-[10px] text-navy-400 font-sans">{tx.senderBank}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-navy-800">
                      <div className="font-sans font-semibold text-navy-900 text-[12px]">{tx.receiverName}</div>
                      <div className="text-[11px] text-navy-500 truncate max-w-[160px]">{tx.receiverVpa}</div>
                      <div className="text-[10px] text-navy-400 font-sans">{tx.receiverBank}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-navy-900 text-[13px]">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <RiskBadge score={tx.riskScore} level={tx.riskLevel} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={tx.decision} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-navy-500 text-[11px]">
                      {tx.timestamp.replace('T', ' ').replace('Z', '').slice(0, 19)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-coral-600 hover:text-coral-700 bg-coral-50 hover:bg-coral-100 px-2 py-1 rounded border border-coral-200"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-canvas border-t border-border flex items-center justify-between text-xs">
          <span className="text-navy-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-subtle"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-subtle"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Slide-Over Drawer */}
      {selectedTx && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface shadow-2xl border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-canvas">
            <div>
              <div className="text-[10px] font-mono text-navy-400 uppercase tracking-wider">
                Transaction Dossier
              </div>
              <h2 className="text-base font-bold font-mono text-navy-900">{selectedTx.id}</h2>
            </div>
            <button
              onClick={handleCloseDrawer}
              className="p-1.5 rounded-lg hover:bg-surface text-navy-500 hover:text-navy-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Risk Score & Decision Header Card */}
            <div className="bg-canvas rounded-xl p-5 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-navy-500">Evaluated Amount</span>
                  <div className="text-2xl font-bold font-mono text-navy-900">
                    {formatINR(selectedTx.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-navy-500 block mb-1">Current Decision</span>
                  <StatusBadge status={selectedTx.decision} />
                </div>
              </div>

              {/* Progress bar gauge */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-navy-600 font-semibold">Risk Score</span>
                  <span className="text-coral-600 font-bold">{selectedTx.riskScore} / 100</span>
                </div>
                <div className="w-full h-2 bg-navy-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedTx.riskScore >= 70
                        ? 'bg-red-500'
                        : selectedTx.riskScore >= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedTx.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons: Functional Decision Triage */}
              <div className="pt-3 border-t border-border-subtle flex items-center gap-2">
                <button
                  onClick={() => handleUpdateDecision('approved')}
                  className="flex-1 py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleUpdateDecision('review')}
                  className="flex-1 py-1.5 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" /> Review
                </button>
                <button
                  onClick={() => handleUpdateDecision('blocked')}
                  className="flex-1 py-1.5 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <ShieldX className="w-3.5 h-3.5" /> Block & Quarantine
                </button>
              </div>
            </div>

            {/* Triggered Risk Factors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-coral-500" />
                Detected Risk Factors & Heuristic Rules
              </h3>
              <div className="space-y-2">
                {selectedTx.riskFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-coral-200/60 bg-coral-50/40 text-xs text-navy-800 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-coral-500 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sender Profile Card */}
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Sender Dossier
                </span>
                <span className="text-[10px] font-mono text-navy-400">KYC Verified</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-navy-400 block">Name</span>
                  <span className="font-semibold text-navy-900">{selectedTx.senderName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">Bank</span>
                  <span className="font-medium text-navy-800">{selectedTx.senderBank}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-navy-400 block">VPA Handle</span>
                  <span className="font-mono text-navy-700">{selectedTx.senderVpa}</span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">Location</span>
                  <span className="text-navy-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-navy-400" /> {selectedTx.senderCity}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">Account Age</span>
                  <span className="text-navy-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-navy-400" /> {selectedTx.senderAccountAgeDays} days
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-navy-400 block">Device Fingerprint</span>
                  <span className="font-mono text-[11px] text-navy-600 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-navy-400" /> {selectedTx.senderDeviceId} ({selectedTx.senderIp})
                  </span>
                </div>
              </div>
            </div>

            {/* Receiver Profile Card */}
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Receiver Dossier
                </span>
                <span className="text-[10px] font-mono text-coral-600 bg-coral-50 px-1.5 py-0.5 rounded">
                  Mule Affinity: {(selectedTx.muleProbability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-navy-400 block">Receiver Entity</span>
                  <span className="font-semibold text-navy-900">{selectedTx.receiverName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-navy-400 block">Settlement Bank</span>
                  <span className="font-medium text-navy-800">{selectedTx.receiverBank}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-navy-400 block">Destination VPA</span>
                  <span className="font-mono text-navy-700">{selectedTx.receiverVpa}</span>
                </div>
              </div>
            </div>

            {/* System Latency and Execution Spec */}
            <div className="p-3 rounded-lg bg-surface-subtle border border-border flex items-center justify-between text-xs font-mono text-navy-500">
              <span>Scoring Latency: {selectedTx.latencyMs} ms</span>
              <span>NPCI Intent: {selectedTx.channel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
