import React from 'react';
import { Search, FolderGit2, AlertCircle } from 'lucide-react';

export const InvestigationsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              Case Investigations
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Case management docket, evidentiary bundles, and analyst decision logs.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search VPA, account, case ID..."
              disabled
              className="pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-surface text-navy-400 placeholder:text-navy-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border p-8 shadow-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-navy-50 rounded-lg text-navy-700">
            <FolderGit2 className="w-5 h-5 text-coral-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-navy-900">Investigation Workspace Standing By</h3>
            <p className="text-xs text-navy-600 max-w-xl leading-relaxed">
              Analyst case management allows freezing suspect VPAs, generating audit trails for financial regulatory reporting, and logging manual intervention decisions.
            </p>
            <div className="pt-3 flex items-center gap-2 text-xs text-navy-500">
              <AlertCircle className="w-3.5 h-3.5 text-navy-400" />
              <span>Full case docket and disposition actions scheduled for Phase 5.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

