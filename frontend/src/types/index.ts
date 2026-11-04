export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Decision = 'approved' | 'review' | 'blocked';
export type CaseStatus = 'open' | 'investigating' | 'escalated' | 'resolved';
export type CaseSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Transaction {
  id: string;
  senderVpa: string;
  senderName: string;
  senderBank: string;
  senderCity: string;
  senderDeviceId: string;
  senderIp: string;
  senderAccountAgeDays: number;
  receiverVpa: string;
  receiverName: string;
  receiverBank: string;
  amount: number;
  timestamp: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  decision: Decision;
  riskFactors: string[];
  latencyMs: number;
  channel: 'P2P' | 'P2M' | 'COLLECT' | 'QR_INTENT';
  muleProbability: number; // 0.0 - 1.0
}

export type AccountRole =
  | 'source'
  | 'first_mule'
  | 'intermediate'
  | 'downstream'
  | 'consolidation';

export interface AccountNode {
  id: string;
  vpa: string;
  ownerName: string;
  role: AccountRole;
  riskScore: number;
  bankName: string;
  ifsc: string;
  city: string;
  incomingCount: number;
  outgoingCount: number;
  totalIncoming: number;
  totalOutgoing: number;
  accountAgeDays: number;
  status: 'active' | 'frozen' | 'under_surveillance';
  deviceFingerprint: string;
}

export interface TransactionEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  latencyMin: number;
  status: 'completed' | 'flagged' | 'frozen';
  txRef: string;
}

export interface MoneyTrailPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalDisputed: number;
  hopCount: number;
  compromisedCount: number;
  nodes: AccountNode[];
  edges: TransactionEdge[];
}

export interface AnalystNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  badge?: string;
}

export interface EvidenceItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'telco' | 'banking' | 'device' | 'network' | 'rule';
  severity: RiskLevel;
}

export interface FraudCase {
  id: string;
  title: string;
  severity: CaseSeverity;
  status: CaseStatus;
  dateCreated: string;
  primaryAccount: string;
  primaryEntityName: string;
  transactionCount: number;
  totalDisputedAmount: number;
  description: string;
  assignedAnalyst: string;
  riskIndicators: string[];
  evidenceTimeline: EvidenceItem[];
  associatedTxIds: string[];
  notes: AnalystNote[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Extreme';
  defaultVolume: number;
  defaultIntermediaries: number;
  defaultAmountMin: number;
  defaultAmountMax: number;
  typologySummary: string;
  detectionExplanation: string;
  keyRuleTriggers: string[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface AlertItem {
  id: string;
  title: string;
  vpa: string;
  time: string;
  severity: RiskLevel;
  txId?: string;
  caseId?: string;
  read?: boolean;
}

export interface OfficerProfile {
  id: string;
  name: string;
  title: string;
  badgeNumber: string;
  cell: string;
  department: string;
}

