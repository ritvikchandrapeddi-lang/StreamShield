import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  Decision,
  FraudCase,
  CaseStatus,
  AnalystNote,
  ToastMessage,
  AlertItem,
  OfficerProfile,
  RiskLevel,
} from '../types';
import { mockTransactions, mockCases } from '../data/mockData';
import { apiService } from '../services/api';

export const officerProfiles: OfficerProfile[] = [
  {
    id: 'off-1',
    name: 'Inspector S. Roy',
    title: 'Lead Cyber Investigator',
    badgeNumber: 'CY-8910',
    cell: 'Cyber Crime Investigation Cell',
    department: 'State Crime Branch, Bengaluru',
  },
  {
    id: 'off-2',
    name: 'P. Sengupta',
    title: 'Senior AML Forensics Officer',
    badgeNumber: 'AML-4402',
    cell: 'Financial Intelligence Unit',
    department: 'Nodal Cyber Enforcement, Mumbai',
  },
  {
    id: 'off-3',
    name: 'A. Kulkarni',
    title: 'Risk Operations Specialist',
    badgeNumber: 'RSK-1092',
    cell: 'Fraud Risk Operations',
    department: 'Real-Time Defense Center, Pune',
  },
];

const initialAlerts: AlertItem[] = [
  {
    id: 'alt-1',
    title: 'High Fan-In Triggered',
    vpa: 'fastpay_drop88@paytm',
    time: '2m ago',
    severity: 'critical',
    txId: 'TXN-902418-UPI',
    caseId: 'CASE-2026-0841',
    read: false,
  },
  {
    id: 'alt-2',
    title: 'Structuring Flag ₹49,999',
    vpa: 'crypto_vault_quick@kotak',
    time: '8m ago',
    severity: 'high',
    txId: 'TXN-902416-UPI',
    read: false,
  },
  {
    id: 'alt-3',
    title: 'Mule Ring Quarantined',
    vpa: 'Syndicate Falcon',
    time: '14m ago',
    severity: 'medium',
    caseId: 'CASE-2026-0841',
    read: false,
  },
];

interface StreamShieldContextType {
  // Transactions
  transactions: Transaction[];
  updateTransactionDecision: (id: string, decision: Decision) => void;
  selectedTxId: string | null;
  setSelectedTxId: (id: string | null) => void;

  // Cases
  cases: FraudCase[];
  updateCaseStatus: (id: string, status: CaseStatus) => void;
  addCaseNote: (caseId: string, note: { author: string; text: string; badge?: string }) => void;
  updateCaseNote: (caseId: string, noteId: string, newText: string) => void;
  deleteCaseNote: (caseId: string, noteId: string) => void;
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;

  // Money Trail Preset Navigation
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;

  // Alerts
  alerts: AlertItem[];
  dismissAlert: (id: string) => void;
  markAllAlertsAsRead: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Officer Profile
  activeOfficer: OfficerProfile;
  switchOfficer: (officerId: string) => void;

  // Simulated Global Stream Ticker
  isSimulatingGlobalStream: boolean;
  setIsSimulatingGlobalStream: (active: boolean) => void;

  // Backend Connection Status & Live Sync
  isBackendConnected: boolean;
  refreshBackendData: () => Promise<void>;

  // Authentication
  isAuthenticated: boolean;
  login: (email?: string, officerName?: string) => void;
  logout: () => void;

  // CSV Batch Import
  importTransactions: (newTransactions: Transaction[]) => void;

  // Reset
  resetDemoState: () => void;
}

const StreamShieldContext = createContext<StreamShieldContextType | undefined>(undefined);

export const StreamShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const [cases, setCases] = useState<FraudCase[]>(mockCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(mockCases[0].id);

  const [selectedPresetId, setSelectedPresetId] = useState<string>('syndicate-falcon');
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeOfficer, setActiveOfficer] = useState<OfficerProfile>(officerProfiles[0]);
  const [isSimulatingGlobalStream, setIsSimulatingGlobalStream] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('streamshield_auth') === 'true';
  });

  // Toast helper
  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, title, description, type };
      setToasts((prev) => [...prev.slice(-3), newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback(
    (_email?: string, officerName?: string) => {
      localStorage.setItem('streamshield_auth', 'true');
      setIsAuthenticated(true);
      addToast(
        'Session Authenticated',
        `Welcome, ${officerName || 'Inspector S. Roy'}. Triage console unlocked.`,
        'success'
      );
    },
    [addToast]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('streamshield_auth');
    setIsAuthenticated(false);
    addToast('Logged Out', 'Demo session terminated', 'info');
  }, [addToast]);

  const importTransactions = useCallback(
    (newItems: Transaction[]) => {
      setTransactions((prev) => [...newItems, ...prev]);
      addToast(
        'Transactions Imported',
        `Ingested ${newItems.length} transactions into monitoring stream`,
        'success'
      );
    },
    [addToast]
  );

  // Update transaction decision
  const updateTransactionDecision = useCallback(
    (id: string, decision: Decision) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, decision } : t))
      );

      // Asynchronously synchronize decision to backend API
      apiService.updateTransactionDecision(id, decision).catch(() => {});

      const decisionLabels: Record<Decision, { type: ToastMessage['type']; text: string }> = {
        approved: { type: 'success', text: 'APPROVED' },
        review: { type: 'warning', text: 'FLAGGED FOR REVIEW' },
        blocked: { type: 'error', text: 'BLOCKED & QUARANTINED' },
      };

      const info = decisionLabels[decision];
      addToast(`Transaction ${id}`, `Decision updated to ${info.text}`, info.type);
    },
    [addToast]
  );

  // Update case status
  const updateCaseStatus = useCallback(
    (id: string, status: CaseStatus) => {
      setCases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );

      // Asynchronously synchronize status to backend API
      apiService.updateInvestigationStatus(id, status).catch(() => {});

      addToast(
        `Case ${id} Updated`,
        `Investigation status shifted to ${status.toUpperCase()}`,
        'info'
      );
    },
    [addToast]
  );

  // Add case note
  const addCaseNote = useCallback(
    (caseId: string, note: { author: string; text: string; badge?: string }) => {
      const newNote: AnalystNote = {
        id: `note-${Date.now()}`,
        author: note.author,
        timestamp: new Date().toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        text: note.text,
        badge: note.badge || 'Analyst Entry',
      };

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, notes: [newNote, ...c.notes] } : c
        )
      );

      // Asynchronously synchronize note to backend API
      apiService.addCaseNote(caseId, note).catch(() => {});

      addToast('Case Note Recorded', `Added note to ${caseId}`, 'success');
    },
    [addToast]
  );

  // Update case note
  const updateCaseNote = useCallback(
    (caseId: string, noteId: string, newText: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            notes: c.notes.map((n) => (n.id === noteId ? { ...n, text: newText } : n)),
          };
        })
      );
      addToast('Note Updated', 'Analyst observation updated in session', 'info');
    },
    [addToast]
  );

  // Delete case note
  const deleteCaseNote = useCallback(
    (caseId: string, noteId: string) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            notes: c.notes.filter((n) => n.id !== noteId),
          };
        })
      );

      // Asynchronously synchronize note deletion to backend API
      apiService.deleteCaseNote(caseId, noteId).catch(() => {});

      addToast('Note Removed', 'Case note deleted', 'info');
    },
    [addToast]
  );

  // Dismiss alert
  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    apiService.markAllAlertsRead().catch(() => {});
    addToast('Alerts Cleared', 'All real-time stream alerts marked as read', 'info');
  }, [addToast]);

  // Switch officer profile
  const switchOfficer = useCallback(
    (officerId: string) => {
      const found = officerProfiles.find((o) => o.id === officerId);
      if (found) {
        setActiveOfficer(found);
        addToast('Officer Profile Switched', `Active investigator: ${found.name}`, 'info');
      }
    },
    [addToast]
  );

  // Refresh live backend dataset
  const refreshBackendData = useCallback(async () => {
    try {
      const [health, txRes, caseRes, alertRes] = await Promise.all([
        apiService.checkHealth().catch(() => null),
        apiService.getTransactions({ limit: 50 }).catch(() => null),
        apiService.getInvestigations().catch(() => null),
        apiService.getAlerts().catch(() => null),
      ]);

      if (health && health.status === 'healthy') {
        setIsBackendConnected(true);
      }

      if (txRes && txRes.items.length > 0) {
        setTransactions(txRes.items);
        setIsBackendConnected(true);
      }

      if (caseRes && caseRes.items.length > 0) {
        setCases(caseRes.items);
        setSelectedCaseId(caseRes.items[0].id);
        setIsBackendConnected(true);
      }

      if (alertRes && alertRes.items.length > 0) {
        setAlerts(alertRes.items);
        setIsBackendConnected(true);
      }
    } catch (err) {
      console.warn('Error refreshing live backend telemetry:', err);
    }
  }, []);

  // Reset entire state
  const resetDemoState = useCallback(() => {
    apiService
      .resetSeedData()
      .then(() => {
        refreshBackendData();
      })
      .catch(() => {
        setTransactions(mockTransactions);
        setCases(mockCases);
        setAlerts(initialAlerts);
      });
    setSelectedTxId(null);
    setSelectedPresetId('syndicate-falcon');
    addToast('State Restored', 'Reset all demo fixtures and cases to baseline', 'info');
  }, [addToast, refreshBackendData]);

  // Initial Probe to check if FastAPI backend is online and sync live data
  useEffect(() => {
    refreshBackendData().then(() => {
      apiService.checkHealth().then((health) => {
        if (health && health.status === 'healthy') {
          addToast(
            'Live Backend Connected',
            `FastAPI engine & ${health.services.database.dialect.toUpperCase()} database active (${health.version})`,
            'success'
          );
        }
      });
    });
  }, [refreshBackendData, addToast]);

  // Periodic Simulated Transaction Ingestion Stream
  useEffect(() => {
    if (!isSimulatingGlobalStream) return;

    const interval = setInterval(async () => {
      // 30% chance of a high-risk transaction arriving
      const isHighRisk = Math.random() < 0.3;
      const amount = Math.floor(Math.random() * (isHighRisk ? 95000 : 8000)) + 500;
      const randomNum = Math.floor(Math.random() * 900) + 100;
      const senderVpa = `user.sim_${randomNum}@${isHighRisk ? 'airtel' : 'oksbi'}`;
      const receiverVpa = isHighRisk ? `mule_drop_${randomNum % 10}@paytm` : `merchant_${randomNum % 20}@hdfcbank`;

      let scoredTx: Transaction | null = null;
      try {
        const scoreRes = await apiService.scoreTransaction({
          amount,
          sender_vpa: senderVpa,
          sender_name: isHighRisk ? `Simulated Node ${randomNum}` : `User ${randomNum}`,
          sender_bank: isHighRisk ? 'Airtel Payments Bank' : 'State Bank of India',
          sender_city: 'Bengaluru, KA',
          sender_device_id: `DEV-${randomNum}-AUTO`,
          sender_account_age_days: isHighRisk ? 4 : 420,
          receiver_vpa: receiverVpa,
          receiver_name: isHighRisk ? 'Suspicious Transit Hub' : 'Verified Merchant Scan',
          receiver_bank: isHighRisk ? 'Paytm Payments Bank' : 'HDFC Bank',
          channel: isHighRisk ? 'COLLECT' : 'P2M',
          mule_probability: isHighRisk ? 0.88 : 0.02,
        });

        if (scoreRes && scoreRes.risk_score !== undefined) {
          scoredTx = {
            id: `TXN-${Math.floor(Date.now() / 1000).toString().slice(-6)}-UPI`,
            senderVpa,
            senderName: isHighRisk ? `Simulated Node ${randomNum}` : `User ${randomNum}`,
            senderBank: isHighRisk ? 'Airtel Payments Bank' : 'State Bank of India',
            senderCity: 'Bengaluru, KA',
            senderDeviceId: `DEV-${randomNum}-AUTO`,
            senderIp: `103.24.${randomNum % 250}.${randomNum % 200}`,
            senderAccountAgeDays: isHighRisk ? 4 : 420,
            receiverVpa,
            receiverName: isHighRisk ? 'Suspicious Transit Hub' : 'Verified Merchant Scan',
            receiverBank: isHighRisk ? 'Paytm Payments Bank' : 'HDFC Bank',
            amount,
            timestamp: new Date().toISOString(),
            riskScore: scoreRes.risk_score,
            riskLevel: scoreRes.risk_level as RiskLevel,
            decision: scoreRes.decision as Decision,
            riskFactors: scoreRes.risk_factors || [],
            latencyMs: Number(scoreRes.latency_ms ?? 3.5),
            channel: isHighRisk ? 'COLLECT' : 'P2M',
            muleProbability: Number(scoreRes.mule_probability ?? (isHighRisk ? 0.88 : 0.02)),
          };
        }
      } catch {}

      if (!scoredTx) {
        const fallbackRisk = isHighRisk
          ? Math.floor(Math.random() * 25) + 75
          : Math.floor(Math.random() * 20) + 2;
        scoredTx = {
          id: `TXN-${Math.floor(Date.now() / 1000).toString().slice(-6)}-UPI`,
          senderVpa,
          senderName: isHighRisk ? `Simulated Node ${randomNum}` : `User ${randomNum}`,
          senderBank: isHighRisk ? 'Airtel Payments Bank' : 'State Bank of India',
          senderCity: 'Bengaluru, KA',
          senderDeviceId: `DEV-${randomNum}-AUTO`,
          senderIp: `103.24.${randomNum % 250}.${randomNum % 200}`,
          senderAccountAgeDays: isHighRisk ? 4 : 420,
          receiverVpa,
          receiverName: isHighRisk ? 'Suspicious Transit Hub' : 'Verified Merchant Scan',
          receiverBank: isHighRisk ? 'Paytm Payments Bank' : 'HDFC Bank',
          amount,
          timestamp: new Date().toISOString(),
          riskScore: fallbackRisk,
          riskLevel: fallbackRisk >= 90 ? 'critical' : fallbackRisk >= 70 ? 'high' : fallbackRisk >= 40 ? 'medium' : 'low',
          decision: fallbackRisk >= 85 ? 'blocked' : fallbackRisk >= 70 ? 'review' : 'approved',
          riskFactors: isHighRisk
            ? ['Automated stream heuristic: Rapid fan-in velocity detected', 'Synthetic pattern match']
            : ['Legitimate consumer flow baseline verified'],
          latencyMs: Number((Math.random() * 8 + 3).toFixed(1)),
          channel: isHighRisk ? 'COLLECT' : 'P2M',
          muleProbability: isHighRisk ? 0.88 : 0.02,
        };
      }

      setTransactions((prev) => [scoredTx!, ...prev.slice(0, 49)]);

      if (scoredTx.riskScore >= 70) {
        const newAlert: AlertItem = {
          id: `alt-auto-${Date.now()}`,
          title: `Stream Alert: Risk Score ${scoredTx.riskScore}`,
          vpa: scoredTx.senderVpa,
          time: 'Just now',
          severity: scoredTx.riskLevel,
          txId: scoredTx.id,
          read: false,
        };
        setAlerts((prev) => [newAlert, ...prev.slice(0, 7)]);
      }
    }, 12000); // Trigger every 12 seconds

    return () => clearInterval(interval);
  }, [isSimulatingGlobalStream]);

  return (
    <StreamShieldContext.Provider
      value={{
        transactions,
        updateTransactionDecision,
        selectedTxId,
        setSelectedTxId,
        cases,
        updateCaseStatus,
        addCaseNote,
        updateCaseNote,
        deleteCaseNote,
        selectedCaseId,
        setSelectedCaseId,
        selectedPresetId,
        setSelectedPresetId,
        alerts,
        dismissAlert,
        markAllAlertsAsRead,
        toasts,
        addToast,
        removeToast,
        activeOfficer,
        switchOfficer,
        isSimulatingGlobalStream,
        setIsSimulatingGlobalStream,
        isBackendConnected,
        refreshBackendData,
        isAuthenticated,
        login,
        logout,
        importTransactions,
        resetDemoState,
      }}
    >
      {children}
    </StreamShieldContext.Provider>
  );
};

export const useStreamShield = (): StreamShieldContextType => {
  const context = useContext(StreamShieldContext);
  if (!context) {
    throw new Error('useStreamShield must be used within a StreamShieldProvider');
  }
  return context;
};
