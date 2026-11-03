import React, { useState } from 'react';
import {
  Search,
  Clock,
  Send,
  ShieldAlert,
  FileText,
  User,
} from 'lucide-react';
import { mockCases, formatINR } from '../data/mockData';
import { FraudCase, CaseStatus, AnalystNote } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

export const InvestigationsView: React.FC = () => {
  const [cases, setCases] = useState<FraudCase[]>(mockCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(mockCases[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Note form state
  const [newNoteText, setNewNoteText] = useState('');
  const newNoteAuthor = 'Inspector S. Roy';

  // Currently active case
  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.primaryAccount.toLowerCase().includes(q) ||
      c.primaryEntityName.toLowerCase().includes(q);

    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesQuery && matchesSeverity && matchesStatus;
  });

  // Update status handler
  const handleStatusChange = (newStatus: CaseStatus) => {
    setCases((prev) =>
      prev.map((c) => (c.id === currentCase.id ? { ...c, status: newStatus } : c))
    );
  };

  // Add analyst note handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: AnalystNote = {
      id: `note-${Date.now()}`,
      author: newNoteAuthor,
      timestamp: new Date().toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      text: newNoteText.trim(),
      badge: 'Analyst Entry',
    };

    setCases((prev) =>
      prev.map((c) =>
        c.id === currentCase.id ? { ...c, notes: [newNote, ...c.notes] } : c
      )
    );

    setNewNoteText('');
  };

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
        <div className="text-xs font-mono text-navy-500 bg-surface px-3 py-1.5 rounded-lg border border-border">
          Active Docket: <strong className="text-navy-900">{cases.length} Open Cases</strong>
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
              placeholder="Search case ID, VPA, entity..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-900 placeholder:text-navy-400 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-canvas text-navy-800 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Cases List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedCaseId === c.id
                    ? 'border-coral-500 bg-coral-50/40 shadow-sm'
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
            ))}
          </div>
        </div>

        {/* Right Column: Case Investigation Detail View (8 Cols) */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border p-6 shadow-card space-y-6">
          {/* Case Header */}
          <div className="pb-5 border-b border-border flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-sm text-navy-900">{currentCase.id}</span>
                <span className="text-navy-300">•</span>
                <RiskBadge level={currentCase.severity} />
                <span className="text-navy-300">•</span>
                <span className="text-xs text-navy-500 font-mono">Created: {currentCase.dateCreated}</span>
              </div>
              <h2 className="text-lg font-bold text-navy-900">{currentCase.title}</h2>
              <p className="text-xs text-navy-600 mt-1">{currentCase.description}</p>
            </div>

            {/* Interactive Status Selector */}
            <div className="shrink-0 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-navy-400 tracking-wider block">
                Update Case Status
              </span>
              <select
                value={currentCase.status}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-canvas text-navy-900 outline-none cursor-pointer hover:border-navy-400 transition-colors"
              >
                <option value="open">Status: Open</option>
                <option value="investigating">Status: Investigating</option>
                <option value="escalated">Status: Escalated</option>
                <option value="resolved">Status: Resolved</option>
              </select>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-navy-500" />
              Audit Evidence Timeline
            </h3>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border-subtle pl-2">
              {currentCase.evidenceTimeline.map((ev) => (
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

          {/* Analyst Notes Section (Interactive) */}
          <div className="pt-4 border-t border-border space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-navy-500" />
              Analyst Case Notes & Audit Log ({currentCase.notes.length})
            </h3>

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} className="space-y-2 bg-canvas p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-600 font-medium">Add Case Disposition Note:</span>
                <span className="text-[11px] font-mono text-navy-400">Author: {newNoteAuthor}</span>
              </div>
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Enter investigation observations, FIR references, or nodal bank freeze notices..."
                className="w-full p-2.5 text-xs rounded border border-border bg-surface text-navy-900 placeholder:text-navy-400 outline-none focus:border-navy-400"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-navy-900 hover:bg-navy-800 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3 h-3" /> Save Note
                </button>
              </div>
            </form>

            {/* Existing Notes Feed */}
            <div className="space-y-3">
              {currentCase.notes.map((note) => (
                <div key={note.id} className="p-3.5 rounded-lg border border-border bg-canvas text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy-900 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-navy-400" />
                      {note.author}
                    </span>
                    <span className="text-[11px] font-mono text-navy-400">{note.timestamp}</span>
                  </div>
                  <p className="text-navy-700 leading-relaxed mt-1">{note.text}</p>
                  {note.badge && (
                    <div className="pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border-strong text-navy-600">
                        {note.badge}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
