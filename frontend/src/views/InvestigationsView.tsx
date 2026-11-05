import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Clock,
  Send,
  ShieldAlert,
  FileText,
  User,
  ArrowRight,
  Share2,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  Download,
  Filter,
} from 'lucide-react';
import { useStreamShield } from '../context/StreamShieldContext';
import { CaseStatus } from '../types';
import { formatINR, mockTransactions } from '../data/mockData';
import { apiService } from '../services/api';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

export const InvestigationsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    updateCaseStatus,
    addCaseNote,
    updateCaseNote,
    deleteCaseNote,
    setSelectedTxId,
    setSelectedPresetId,
    activeOfficer,
    addToast,
  } = useStreamShield();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [evidenceCategoryFilter, setEvidenceCategoryFilter] = useState<string>('all');

  // New Note form state
  const [newNoteText, setNewNoteText] = useState('');
  const [noteBadge, setNoteBadge] = useState('Analyst Entry');

  // Editing existing note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Active case
  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Map case to preset graph ID
  const getNetworkPresetId = (caseId: string): string => {
    switch (caseId) {
      case 'CASE-2026-0841':
        return 'syndicate-falcon';
      case 'CASE-2026-0839':
        return 'smurfing-cascade';
      case 'CASE-2026-0832':
        return 'circular-ring';
      default:
        return 'syndicate-falcon';
    }
  };

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.primaryAccount.toLowerCase().includes(q) ||
      c.primaryEntityName.toLowerCase().includes(q) ||
      c.assignedAnalyst.toLowerCase().includes(q);

    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesQuery && matchesSeverity && matchesStatus;
  });

  // Handle case status update
  const handleStatusChange = (newStatus: CaseStatus) => {
    updateCaseStatus(currentCase.id, newStatus);
  };

  // Handle add note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    addCaseNote(currentCase.id, {
      author: `${activeOfficer.name} (${activeOfficer.title})`,
      text: newNoteText.trim(),
      badge: noteBadge,
    });

    setNewNoteText('');
  };

  // Begin editing note
  const startEditingNote = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId);
    setEditingNoteText(currentText);
  };

  // Save edited note
  const saveEditedNote = (noteId: string) => {
    if (!editingNoteText.trim()) return;
    updateCaseNote(currentCase.id, noteId, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  // Cancel edit
  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  // Navigate to transaction
  const handleInspectTransaction = (txId: string) => {
    setSelectedTxId(txId);
    addToast('Opening Transaction Dossier', `Navigating to ${txId}`, 'info');
    navigate('/transactions');
  };

  // Navigate to Money Trail
  const handleExploreMoneyTrail = () => {
    const preset = getNetworkPresetId(currentCase.id);
    setSelectedPresetId(preset);
    addToast(
      'Loading Money Trail Topology',
      `Visualizing network pattern for ${currentCase.id}`,
      'info'
    );
    navigate('/money-trail');
  };

  // Export LEA Bundle
  const handleExportBundle = async () => {
    let exportData: any = null;
    try {
      const backendBundle = await apiService.exportLeaBundle(currentCase.id);
      if (backendBundle) {
        exportData = {
          ...backendBundle,
          exportedBy: activeOfficer.name,
          exportTimestamp: new Date().toISOString(),
        };
      }
    } catch {}

    if (!exportData) {
      exportData = {
        caseId: currentCase.id,
        title: currentCase.title,
        severity: currentCase.severity,
        totalDisputedAmount: currentCase.totalDisputedAmount,
        primaryAccount: currentCase.primaryAccount,
        evidenceTimeline: currentCase.evidenceTimeline,
        associatedTxIds: currentCase.associatedTxIds,
        docketNotes: currentCase.notes,
        exportedBy: activeOfficer.name,
        exportTimestamp: new Date().toISOString(),
        statutoryReference: 'Section 91 CrPC / CERT-In Rule 12',
      };
    }

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STREAMSHIELD-LEA-BUNDLE-${currentCase.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast(
      'LEA Forensic Bundle Exported',
      `Audit dossier for ${currentCase.id} downloaded successfully`,
      'success'
    );
  };

  // Filtered evidence timeline
  const filteredEvidence = currentCase.evidenceTimeline.filter((ev) => {
    if (evidenceCategoryFilter === 'all') return true;
    return ev.category === evidenceCategoryFilter;
  });

  return (
    <div className="space-y-6">
      <SyntheticBanner label="FINANCIAL CRIME INVESTIGATIONS — Demonstration case files and evidence timelines. All suspect entities and banking identifiers are synthetic fixtures." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-navy-900">
            Case Investigations Docket
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Manage active financial fraud dossiers, compile statutory audit evidence, and record analyst disposition notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-navy-500 bg-surface px-3 py-1.5 rounded-lg border border-border">
            Active Docket: <strong className="text-navy-900">{cases.length} Open Cases</strong>
          </div>
          <button
            onClick={handleExportBundle}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 hover:bg-navy-800 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export LEA Bundle</span>
          </button>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & Case List (4 Cols) */}
        <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-4 shadow-card space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case ID, VPA, entity, officer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-900 placeholder:text-navy-400 outline-none focus:border-navy-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase text-navy-400 block mb-1">
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase text-navy-400 block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredCases.length === 0 ? (
              <div className="text-center py-10 bg-canvas rounded-lg border border-dashed border-border p-4">
                <ShieldAlert className="w-6 h-6 text-navy-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-navy-700">No cases match filter criteria</div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-3 px-3 py-1 text-xs text-coral-600 font-semibold bg-coral-50 hover:bg-coral-100 rounded border border-coral-200 transition-colors"
                >
                  Reset Case Filters
                </button>
              </div>
            ) : (
              filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    currentCase.id === c.id
                      ? 'border-coral-500 bg-coral-50/40 shadow-sm ring-1 ring-coral-500/20'
                      : 'border-border bg-canvas hover:bg-surface-subtle text-navy-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-navy-900">{c.id}</span>
                    <RiskBadge level={c.severity} showIcon={false} />
                  </div>
                  <div className="font-semibold text-navy-900 mt-1 line-clamp-1">{c.title}</div>
                  <div className="font-mono text-[11px] text-navy-500 mt-0.5 truncate">{c.primaryAccount}</div>

                  <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
                    <StatusBadge status={c.status} />
                    <span className="font-mono font-bold text-coral-600">
                      {formatINR(c.totalDisputedAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Case Investigation Detail View (8 Cols) */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border p-6 shadow-card space-y-6">
          {/* Case Header */}
          <div className="pb-5 border-b border-border flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono font-bold text-sm text-navy-900">{currentCase.id}</span>
                <span className="text-navy-300">•</span>
                <RiskBadge level={currentCase.severity} />
                <span className="text-navy-300">•</span>
                <span className="text-xs text-navy-500 font-mono">Created: {currentCase.dateCreated}</span>
              </div>
              <h2 className="text-lg font-bold text-navy-900">{currentCase.title}</h2>
              <p className="text-xs text-navy-600 mt-1 leading-relaxed">{currentCase.description}</p>
            </div>

            {/* Interactive Status Selector & Money Trail Link */}
            <div className="shrink-0 flex flex-col gap-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-navy-400 tracking-wider block">
                  Update Case Status
                </span>
                <select
                  value={currentCase.status}
                  onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-canvas text-navy-900 outline-none cursor-pointer hover:border-navy-400 transition-colors"
                >
                  <option value="open">Status: Open</option>
                  <option value="investigating">Status: Investigating</option>
                  <option value="escalated">Status: Escalated</option>
                  <option value="resolved">Status: Resolved</option>
                </select>
              </div>

              <button
                onClick={handleExploreMoneyTrail}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-md border border-coral-200 bg-coral-50 hover:bg-coral-100 text-coral-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Open interactive money flow topology in Money Trail Explorer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Explore Money Trail</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-canvas border border-border">
              <span className="text-[10px] uppercase text-navy-400 font-semibold block">Total Disputed</span>
              <span className="font-mono text-base font-bold text-coral-600">
                {formatINR(currentCase.totalDisputedAmount)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-canvas border border-border">
              <span className="text-[10px] uppercase text-navy-400 font-semibold block">Tx Count</span>
              <span className="font-mono text-base font-bold text-navy-900">
                {currentCase.transactionCount} Events
              </span>
            </div>
            <div className="p-3 rounded-lg bg-canvas border border-border">
              <span className="text-[10px] uppercase text-navy-400 font-semibold block">Assigned Officer</span>
              <span className="text-xs font-semibold text-navy-900 truncate block mt-0.5">
                {currentCase.assignedAnalyst}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-canvas border border-border">
              <span className="text-[10px] uppercase text-navy-400 font-semibold block">Primary Target</span>
              <span className="font-mono text-xs text-navy-800 truncate block mt-0.5">
                {currentCase.primaryAccount}
              </span>
            </div>
          </div>

          {/* Associated Suspicious Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-navy-500" />
                Direct Associated Transactions ({currentCase.associatedTxIds.length})
              </h3>
              <span className="text-[11px] text-navy-500">Click transaction ID to open in Monitor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCase.associatedTxIds.map((txId) => {
                const txDetail = mockTransactions.find((t) => t.id === txId);
                return (
                  <div
                    key={txId}
                    onClick={() => handleInspectTransaction(txId)}
                    className="p-3 rounded-lg border border-border bg-canvas hover:border-coral-400 hover:bg-coral-50/20 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-navy-900 group-hover:text-coral-600 transition-colors flex items-center gap-1.5">
                        <span>{txId}</span>
                        <ArrowRight className="w-3 h-3 text-navy-400 group-hover:text-coral-500 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <div className="text-[11px] text-navy-500 mt-0.5 font-mono">
                        {txDetail ? `${txDetail.senderVpa} → ${txDetail.receiverVpa}` : 'Suspicious payment flow'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-coral-600">
                        {txDetail ? formatINR(txDetail.amount) : 'Flagged'}
                      </div>
                      {txDetail && (
                        <div className="text-[10px] text-navy-400 mt-0.5">
                          Score: <strong className="text-coral-600">{txDetail.riskScore}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Risk Indicators */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-coral-500" />
              Intelligence Risk Indicators & Pattern Hits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCase.riskIndicators.map((ind, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded border border-border bg-canvas text-xs text-navy-700 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 shrink-0 mt-1.5" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-navy-500" />
                Audit Evidence Timeline ({filteredEvidence.length})
              </h3>

              {/* Evidence Category Filter */}
              <div className="flex items-center gap-1 text-[11px]">
                <Filter className="w-3 h-3 text-navy-400 mr-1" />
                {(['all', 'telco', 'banking', 'device', 'network', 'rule'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEvidenceCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      evidenceCategoryFilter === cat
                        ? 'bg-navy-900 text-white font-bold'
                        : 'bg-canvas text-navy-600 hover:bg-surface-subtle border border-border'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border-subtle pl-2">
              {filteredEvidence.map((ev) => (
                <div key={ev.id} className="relative pl-6 text-xs space-y-0.5">
                  <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-surface border-2 border-coral-500" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy-900">{ev.time}</span>
                    <span className="text-navy-300">•</span>
                    <span className="font-semibold text-navy-800">{ev.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border text-navy-600 uppercase">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-navy-600 leading-relaxed">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Notes Section (Fully Stateful) */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-navy-500" />
                Analyst Case Notes & Audit Log ({currentCase.notes.length})
              </h3>
              <span className="text-[11px] font-mono text-navy-500">
                Active Session: <strong>{activeOfficer.name}</strong>
              </span>
            </div>

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} className="space-y-2 bg-canvas p-4 rounded-lg border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-navy-700 font-semibold">Record Disposition Entry:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-navy-500">Category Tag:</span>
                  <select
                    value={noteBadge}
                    onChange={(e) => setNoteBadge(e.target.value)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface text-navy-800 outline-none"
                  >
                    <option value="Analyst Entry">Analyst Entry</option>
                    <option value="Freezing Action Taken">Freezing Action Taken</option>
                    <option value="Forensic Linkage">Forensic Linkage</option>
                    <option value="STR Drafted">STR Drafted</option>
                    <option value="LEAs Notice Issued">LEAs Notice Issued</option>
                    <option value="KYC Escalation">KYC Escalation</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Enter investigation observations, FIR references, or nodal bank freeze notices..."
                className="w-full p-2.5 text-xs rounded border border-border bg-surface text-navy-900 placeholder:text-navy-400 outline-none focus:border-navy-400"
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-navy-400 font-mono">
                  Signatory: {activeOfficer.name} ({activeOfficer.badgeNumber})
                </span>
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-navy-900 hover:bg-navy-800 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-3 h-3" /> Save Note
                </button>
              </div>
            </form>

            {/* Existing Notes Feed */}
            <div className="space-y-3">
              {currentCase.notes.length === 0 ? (
                <div className="text-center py-6 text-xs text-navy-400 italic bg-canvas rounded-lg border border-border">
                  No analyst notes on record yet. Add the first case entry above.
                </div>
              ) : (
                currentCase.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-lg border border-border bg-canvas text-xs space-y-2 hover:border-navy-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-navy-400" />
                        {note.author}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-navy-400">{note.timestamp}</span>
                        {/* Note Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditingNote(note.id, note.text)}
                            className="p-1 text-navy-400 hover:text-navy-700 rounded hover:bg-surface transition-colors"
                            title="Edit note"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteCaseNote(currentCase.id, note.id)}
                            className="p-1 text-coral-400 hover:text-coral-600 rounded hover:bg-coral-50 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Edit View vs Display */}
                    {editingNoteId === note.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full p-2 text-xs rounded border border-navy-400 bg-surface text-navy-900 outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditingNote}
                            className="px-2 py-1 text-xs rounded border border-border bg-canvas text-navy-600 hover:bg-surface flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                          <button
                            onClick={() => saveEditedNote(note.id)}
                            className="px-2.5 py-1 text-xs rounded bg-navy-900 text-white font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Update Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-navy-700 leading-relaxed">{note.text}</p>
                    )}

                    {note.badge && (
                      <div className="pt-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border-strong text-navy-600">
                          {note.badge}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
