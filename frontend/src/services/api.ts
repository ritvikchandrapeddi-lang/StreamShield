/**
 * StreamShield API Client Service
 *
 * Connects the React + Vite frontend to the FastAPI backend.
 * Falls back gracefully if backend is unreachable during offline/demo mode.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const ROOT_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

import { Transaction, FraudCase, AlertItem, RiskLevel, Decision } from '../types';

export function mapBackendTx(raw: any): Transaction {
  return {
    id: raw.id,
    senderVpa: raw.sender_vpa || raw.senderVpa || '',
    senderName: raw.sender_name || raw.senderName || '',
    senderBank: raw.sender_bank || raw.senderBank || '',
    senderCity: raw.sender_city || raw.senderCity || 'Bengaluru, KA',
    senderDeviceId: raw.sender_device_id || raw.senderDeviceId || 'DEV-UNK',
    senderIp: raw.sender_ip || raw.senderIp || '127.0.0.1',
    senderAccountAgeDays: raw.sender_account_age_days ?? raw.senderAccountAgeDays ?? 30,
    receiverVpa: raw.receiver_vpa || raw.receiverVpa || '',
    receiverName: raw.receiver_name || raw.receiverName || '',
    receiverBank: raw.receiver_bank || raw.receiverBank || '',
    amount: Number(raw.amount || 0),
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
    riskScore: Number(raw.risk_score ?? raw.riskScore ?? 0),
    riskLevel: (raw.risk_level || raw.riskLevel || 'low') as RiskLevel,
    decision: (raw.decision || 'approved') as Decision,
    riskFactors: raw.risk_factors || raw.riskFactors || [],
    latencyMs: Number(raw.latency_ms ?? raw.latencyMs ?? 5.0),
    channel: raw.channel || 'P2P',
    muleProbability: Number(raw.mule_probability ?? raw.muleProbability ?? 0.0),
  };
}

export function mapBackendCase(raw: any): FraudCase {
  return {
    id: raw.id,
    title: raw.title,
    severity: raw.severity,
    status: raw.status,
    dateCreated: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : raw.dateCreated || '',
    primaryAccount: raw.primary_account || raw.primaryAccount || '',
    primaryEntityName: raw.primary_entity_name || raw.primaryEntityName || '',
    transactionCount: raw.transaction_count ?? raw.transactionCount ?? 0,
    totalDisputedAmount: raw.total_disputed_amount ?? raw.totalDisputedAmount ?? 0,
    description: raw.description || '',
    assignedAnalyst: raw.assigned_analyst || raw.assignedAnalyst || '',
    riskIndicators: raw.risk_indicators || raw.riskIndicators || [],
    evidenceTimeline: (raw.evidence || raw.evidenceTimeline || []).map((e: any) => ({
      id: e.id,
      time: e.time || (e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''),
      title: e.title,
      description: e.description,
      category: e.category,
      severity: e.severity,
    })),
    associatedTxIds: raw.associated_tx_ids || raw.associatedTxIds || [],
    notes: (raw.notes || []).map((n: any) => ({
      id: n.id,
      author: n.author,
      timestamp: n.created_at ? new Date(n.created_at).toLocaleString() : n.timestamp || '',
      text: n.text,
      badge: n.badge || 'Analyst Entry',
    })),
  };
}

export function mapBackendAlert(raw: any): AlertItem {
  return {
    id: raw.id,
    title: raw.title,
    vpa: raw.vpa,
    time: raw.created_at ? new Date(raw.created_at).toLocaleTimeString() : raw.time || '',
    severity: raw.severity,
    txId: raw.tx_id || raw.txId,
    caseId: raw.case_id || raw.caseId,
    read: raw.read ?? false,
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  environment: string;
  version: string;
  services: {
    api_server: string;
    fastapi_core: string;
    database: {
      status: string;
      dialect: string;
    };
  };
}

export const apiService = {
  /**
   * Health Check Probe
   */
  async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      const res = await fetch(`${ROOT_URL}/health`, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Dashboard Telemetry & Stats
   */
  async getDashboardStats(window: string = '24h') {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats?window=${window}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Transactions API
   */
  async getTransactions(params?: {
    q?: string;
    risk_level?: string;
    decision?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ total: number; items: Transaction[] } | null> {
    try {
      const query = new URLSearchParams();
      if (params?.q) query.append('q', params.q);
      if (params?.risk_level && params.risk_level !== 'all') query.append('risk_level', params.risk_level);
      if (params?.decision && params.decision !== 'all') query.append('decision', params.decision);
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.skip) query.append('skip', params.skip.toString());

      const res = await fetch(`${API_BASE_URL}/transactions?${query.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      const rawList = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      return {
        total: data.total ?? rawList.length,
        items: rawList.map(mapBackendTx),
      };
    } catch {
      return null;
    }
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return mapBackendTx(data);
    } catch {
      return null;
    }
  },

  async updateTransactionDecision(id: string, decision: string, reason?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/${id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Alerts API
   */
  async getAlerts(unreadOnly: boolean = false): Promise<{ total: number; unread_count: number; items: AlertItem[] } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts?unread_only=${unreadOnly}`);
      if (!res.ok) return null;
      const data = await res.json();
      const rawList = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      return {
        total: data.total ?? rawList.length,
        unread_count: data.unread_count ?? rawList.filter((a: any) => !a.read).length,
        items: rawList.map(mapBackendAlert),
      };
    } catch {
      return null;
    }
  },

  async markAlertRead(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${id}/read`, {
        method: 'PATCH',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async markAllAlertsRead() {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/mark-all-read`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Investigations Dossier API
   */
  async getInvestigations(params?: { q?: string; severity?: string; status?: string }): Promise<{ total: number; items: FraudCase[] } | null> {
    try {
      const query = new URLSearchParams();
      if (params?.q) query.append('q', params.q);
      if (params?.severity && params.severity !== 'all') query.append('severity', params.severity);
      if (params?.status && params.status !== 'all') query.append('status', params.status);

      const res = await fetch(`${API_BASE_URL}/investigations?${query.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      const rawList = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      return {
        total: data.total ?? rawList.length,
        items: rawList.map(mapBackendCase),
      };
    } catch {
      return null;
    }
  },

  async getInvestigationById(id: string): Promise<FraudCase | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return mapBackendCase(data);
    } catch {
      return null;
    }
  },

  async updateInvestigationStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async addCaseNote(caseId: string, note: { author: string; text: string; badge?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteCaseNote(caseId: string, noteId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/${caseId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  },

  async exportLeaBundle(caseId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/${caseId}/export`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Reset Demo Seed Fixtures
   */
  async resetSeedData() {
    try {
      const res = await fetch(`${API_BASE_URL}/seed/reset`, { method: 'POST' });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Real-Time ML Fraud Scoring Engine
   */
  async scoreTransaction(payload: {
    amount: number;
    sender_vpa: string;
    sender_name?: string;
    sender_bank?: string;
    sender_city?: string;
    sender_device_id?: string;
    sender_account_age_days?: number;
    receiver_vpa: string;
    receiver_name?: string;
    receiver_bank?: string;
    channel?: string;
    mule_probability?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/fraud/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getModelInfo() {
    try {
      const res = await fetch(`${API_BASE_URL}/fraud/model-info`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getFraudEvaluation() {
    try {
      const res = await fetch(`${API_BASE_URL}/fraud/evaluate`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async retrainModel(nSamples: number = 5000) {
    try {
      const res = await fetch(`${API_BASE_URL}/fraud/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n_samples: nSamples }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async generateSyntheticBatch(n: number = 20, fraudRatio: number = 0.3) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/fraud/synthetic-batch?n=${n}&fraud_ratio=${fraudRatio}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Graph Intelligence & Mule-Ring Detection API
   */
  async getGraphOverview() {
    try {
      const res = await fetch(`${API_BASE_URL}/graph/overview`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async exploreAccountNetwork(vpa: string, depth: number = 2) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/graph/account/${encodeURIComponent(vpa)}?depth=${depth}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getMuleAccounts(minScore: number = 60) {
    try {
      const res = await fetch(`${API_BASE_URL}/graph/mules?min_score=${minScore}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getFraudRings() {
    try {
      const res = await fetch(`${API_BASE_URL}/graph/rings`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async traceMoneyTrail(payload: {
    source_vpa: string;
    max_hops?: number;
    min_amount?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/graph/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async syncGraph() {
    try {
      const res = await fetch(`${API_BASE_URL}/graph/sync`, { method: 'POST' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Fraud DNA Pattern Recognition API
   */
  async getDNAArchetypes() {
    try {
      const res = await fetch(`${API_BASE_URL}/dna/archetypes`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAccountDNA(vpa: string, depth: number = 2) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/dna/signature/${encodeURIComponent(vpa)}?depth=${depth}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Fraud Attack Simulator API
   */
  async getSimulationScenarios() {
    try {
      const res = await fetch(`${API_BASE_URL}/simulator/scenarios`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getSimulationScenario(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/simulator/scenarios/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async runSimulation(payload: {
    scenario_id: string;
    volume?: number;
    intermediaries?: number;
    amount_min?: number;
    amount_max?: number;
    complexity?: string;
    noise_ratio?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/simulator/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};

