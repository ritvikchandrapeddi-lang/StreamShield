import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useStreamShield } from '../context/StreamShieldContext';
import { Transaction, RiskLevel, Decision } from '../types';
import { formatINR } from '../data/mockData';
import { SyntheticBanner } from '../components/ui/SyntheticBanner';

interface ParsedRow {
  index: number;
  senderVpa: string;
  senderName?: string;
  receiverVpa: string;
  receiverName?: string;
  amount: number;
  channel?: string;
  timestamp?: string;
  isValid: boolean;
  error?: string;
}

const SAMPLE_CSV_CONTENT = `sender_vpa,sender_name,receiver_vpa,receiver_name,amount,channel
vikas.retail@okaxis,Vikas Retail Traders,drop_wallet_91@paytm,Apex Transit Hub,95000,COLLECT
karan.sharma@oksbi,Karan Sharma,quick_recharge@airtel,Merchant Recharge,450,P2M
crypto_trader@kotak,Instant Crypto Gateway,offshore_vault_01@indus,Global Cashout,49999,P2P
priya.patel@okhdfcbank,Priya Patel,zomato.food@hdfcbank,Zomato Online,850,P2M
smurf_source_04@fbl,Federal Kirana Store,mule_wash_alpha@yesbank,Kuber Agency,48500,P2P
rahul.verma@oksbi,Rahul Verma,fastpay_drop88@paytm,Apex Mobile Express,82000,COLLECT
sunita.devi@okhdfcbank,Sunita Devi,swiggy.instamart@icici,Swiggy Groceries,1200,QR_INTENT
shell_corp_node@axisbank,Bravo Textiles Corp,wash_node_gamma@kotak,Vikas Prints,75000,P2P
anand.kumar@barodampay,Anand Kumar,electricity.bill@sbi,State Electricity,2350,P2M
mule_collector@paytm,Paytm Quick Wallet,offshore_settle_node@indus,Commodity Vault,150000,P2P`;

export const TransactionImportView: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importTransactions, addToast } = useStreamShield();

  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ingestedCount, setIngestedCount] = useState<number | null>(null);

  // Parse and validate CSV data
  const processCsvData = (rawText: string, sourceName: string) => {
    setGeneralError(null);
    setIngestedCount(null);
    setFileName(sourceName);

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setGeneralError('CSV must include a header row and at least 1 transaction record.');
      setParsedRows([]);
      return;
    }

    // Extract and normalize headers
    const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Check for required headers (flexible matching)
    const hasSender = rawHeaders.some((h) => ['sender_vpa', 'sendervpa', 'sender'].includes(h));
    const hasReceiver = rawHeaders.some((h) => ['receiver_vpa', 'receivervpa', 'receiver'].includes(h));
    const hasAmount = rawHeaders.some((h) => ['amount', 'txn_amount', 'txnamount'].includes(h));

    if (!hasSender || !hasReceiver || !hasAmount) {
      setGeneralError(
        `Missing required columns. Header must include: sender_vpa, receiver_vpa, and amount. Found: [${rawHeaders.join(', ')}]`
      );
      setParsedRows([]);
      return;
    }

    const senderIdx = rawHeaders.findIndex((h) => ['sender_vpa', 'sendervpa', 'sender'].includes(h));
    const receiverIdx = rawHeaders.findIndex((h) => ['receiver_vpa', 'receivervpa', 'receiver'].includes(h));
    const amountIdx = rawHeaders.findIndex((h) => ['amount', 'txn_amount', 'txnamount'].includes(h));
    const senderNameIdx = rawHeaders.findIndex((h) => ['sender_name', 'sendername'].includes(h));
    const receiverNameIdx = rawHeaders.findIndex((h) => ['receiver_name', 'receivername'].includes(h));
    const channelIdx = rawHeaders.findIndex((h) => ['channel'].includes(h));

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      const senderVpa = cols[senderIdx] || '';
      const receiverVpa = cols[receiverIdx] || '';
      const rawAmount = cols[amountIdx] || '';
      const amount = parseFloat(rawAmount);

      let isValid = true;
      let error = '';

      if (!senderVpa) {
        isValid = false;
        error = 'Missing sender VPA';
      } else if (!receiverVpa) {
        isValid = false;
        error = 'Missing receiver VPA';
      } else if (isNaN(amount) || amount <= 0) {
        isValid = false;
        error = `Invalid amount '${rawAmount}'`;
      }

      rows.push({
        index: i,
        senderVpa,
        senderName: senderNameIdx >= 0 ? cols[senderNameIdx] : undefined,
        receiverVpa,
        receiverName: receiverNameIdx >= 0 ? cols[receiverNameIdx] : undefined,
        amount: isNaN(amount) ? 0 : amount,
        channel: channelIdx >= 0 ? cols[channelIdx] : 'P2P',
        isValid,
        error,
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setGeneralError('Invalid file format. Please upload a standard comma-separated .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCsvData(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    processCsvData(SAMPLE_CSV_CONTENT, 'sample_upi_crime_stream.csv');
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'streamshield_transaction_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Template Downloaded', 'Sample CSV template ready for testing', 'info');
  };

  const handleIngest = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      const newTransactions: Transaction[] = validRows.map((r) => {
        // Evaluate simulated risk characteristics based on amount and handle patterns
        const isHighRisk =
          r.amount >= 75000 ||
          r.amount === 49999 ||
          r.receiverVpa.includes('drop') ||
          r.receiverVpa.includes('mule') ||
          r.receiverVpa.includes('offshore');

        const riskScore = isHighRisk
          ? Math.floor(Math.random() * 20) + 78
          : Math.floor(Math.random() * 20) + 4;

        const riskLevel: RiskLevel =
          riskScore >= 90 ? 'critical' : riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
        const decision: Decision =
          riskScore >= 85 ? 'blocked' : riskScore >= 70 ? 'review' : 'approved';

        const riskFactors: string[] = [];
        if (r.amount === 49999 || (r.amount >= 48000 && r.amount < 50000)) {
          riskFactors.push('Structuring anomaly: Transaction just below ₹50,000 threshold');
        }
        if (r.receiverVpa.includes('drop') || r.receiverVpa.includes('mule')) {
          riskFactors.push('Receiver flagged in suspicious mule cluster');
        }
        if (r.amount >= 100000) {
          riskFactors.push('High-value rapid disbursement anomaly');
        }
        if (riskFactors.length === 0) {
          riskFactors.push('Standard commercial peer transfer baseline');
        }

        return {
          id: `CSV-${Math.floor(Date.now() / 1000).toString().slice(-5)}-${r.index}`,
          senderVpa: r.senderVpa,
          senderName: r.senderName || r.senderVpa.split('@')[0],
          senderBank: 'HDFC Bank',
          senderCity: 'Bengaluru, KA',
          senderDeviceId: `DEV-CSV-${r.index}`,
          senderIp: `103.45.${r.index % 250}.12`,
          senderAccountAgeDays: isHighRisk ? 8 : 340,
          receiverVpa: r.receiverVpa,
          receiverName: r.receiverName || r.receiverVpa.split('@')[0],
          receiverBank: 'Paytm Payments Bank',
          amount: r.amount,
          timestamp: new Date().toISOString(),
          riskScore,
          riskLevel,
          decision,
          riskFactors,
          latencyMs: Number((Math.random() * 5 + 3.2).toFixed(1)),
          channel: (['P2P', 'P2M', 'COLLECT', 'QR_INTENT'].includes(r.channel || '')
            ? r.channel
            : 'P2P') as Transaction['channel'],
          muleProbability: isHighRisk ? 0.84 : 0.04,
        };
      });

      importTransactions(newTransactions);
      setIngestedCount(newTransactions.length);
      setIsProcessing(false);
    }, 400);
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName('');
    setGeneralError(null);
    setIngestedCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Synthetic Banner */}
      <SyntheticBanner label="TRANSACTION INGESTION PIPELINE — Upload or paste batch UPI events for automated SHAP heuristic scoring and mule graph placement." />

      {/* Header Bar */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-coral-600 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Batch Triage Engine</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-navy-900">
            CSV Transaction Batch Import
          </h1>
          <p className="text-xs text-navy-600 mt-1 max-w-2xl leading-relaxed">
            Ingest external transactional feeds into the StreamShield real-time scoring engine. Validates headers, formats records, and surfaces downstream fraud flags.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-lg border border-border bg-canvas hover:bg-surface-subtle text-navy-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download Sample CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-navy-500" />
            <span>Download Template</span>
          </button>
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-coral-400" />
            <span>Try Sample Demo CSV</span>
          </button>
        </div>
      </div>

      {/* Upload Drop Zone & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Zone Card (2 Cols) */}
        <div className="md:col-span-2 bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-navy-400 rounded-xl p-8 text-center bg-canvas hover:bg-surface-subtle transition-all cursor-pointer space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-navy-600 shadow-sm">
              <UploadCloud className="w-6 h-6 text-coral-500" />
            </div>
            <div>
              <span className="text-xs font-semibold text-navy-900 block">
                Click to browse or drop your CSV file here
              </span>
              <span className="text-[11px] text-navy-500 font-mono mt-0.5 block">
                Standard format: sender_vpa, receiver_vpa, amount (INR)
              </span>
            </div>
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Validation Error</span>
                <p className="text-[11px] text-red-700 mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          {/* Success Banner if Ingested */}
          {ingestedCount !== null && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    Successfully Ingested {ingestedCount} Transactions!
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Events added to monitoring stream with computed risk scores.
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>View In Transaction Monitor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Requirements & Quick Actions (1 Col) */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-900 border-b border-border pb-3">
            <Info className="w-4 h-4 text-navy-500" />
            <span>Format Guidelines</span>
          </div>

          <div className="space-y-2 text-xs text-navy-600">
            <span className="font-semibold text-navy-800 block text-[11px] uppercase font-mono">
              Required Columns:
            </span>
            <ul className="space-y-1 font-mono text-[11px] text-navy-700">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
                <code>sender_vpa</code> (e.g. user@oksbi)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
                <code>receiver_vpa</code> (e.g. drop@paytm)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
                <code>amount</code> (Numeric INR)
              </li>
            </ul>

            <span className="font-semibold text-navy-800 block text-[11px] uppercase font-mono pt-2">
              Optional Columns:
            </span>
            <p className="text-[11px] text-navy-500">
              <code>sender_name</code>, <code>receiver_name</code>, <code>channel</code> (P2P/P2M/COLLECT)
            </p>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <button
              onClick={handleLoadSample}
              className="w-full py-2 px-3 rounded-lg border border-border bg-canvas hover:bg-surface-subtle text-navy-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-coral-500" />
              <span>Load 10 Sample Rows</span>
            </button>
            {parsedRows.length > 0 && (
              <button
                onClick={handleReset}
                className="w-full py-2 px-3 rounded-lg border border-border-subtle text-navy-500 hover:text-navy-800 text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Selection</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Table of First 10 Rows */}
      {parsedRows.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 flex items-center gap-2">
                <span>CSV Records Preview</span>
                <span className="text-[11px] font-mono text-navy-500 font-normal">
                  ({fileName || 'batch_import.csv'})
                </span>
              </h2>
              <p className="text-xs text-navy-500 mt-0.5">
                Showing top 10 preview rows. {validCount} valid, {invalidCount} invalid out of {parsedRows.length} total records.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleIngest}
                disabled={isProcessing || validCount === 0}
                className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {isProcessing
                    ? 'Scoring & Ingesting...'
                    : `Ingest ${validCount} Valid Records`}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-navy-500 uppercase tracking-wider">
                  <th className="pb-2.5 pl-1">Row</th>
                  <th className="pb-2.5">Sender VPA</th>
                  <th className="pb-2.5">Receiver VPA</th>
                  <th className="pb-2.5 text-right">Amount (₹)</th>
                  <th className="pb-2.5 text-center">Channel</th>
                  <th className="pb-2.5 text-right pr-1">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {parsedRows.slice(0, 10).map((row) => (
                  <tr key={row.index} className="hover:bg-canvas transition-colors">
                    <td className="py-2.5 pl-1 font-mono text-navy-400 text-[11px]">
                      #{row.index}
                    </td>
                    <td className="py-2.5 font-mono text-navy-800">
                      <div className="truncate max-w-[180px]" title={row.senderVpa}>
                        {row.senderVpa || <span className="text-red-500 italic">Missing</span>}
                      </div>
                      {row.senderName && (
                        <span className="text-[10px] text-navy-400 block truncate font-sans">
                          {row.senderName}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 font-mono text-navy-800">
                      <div className="truncate max-w-[180px]" title={row.receiverVpa}>
                        {row.receiverVpa || <span className="text-red-500 italic">Missing</span>}
                      </div>
                      {row.receiverName && (
                        <span className="text-[10px] text-navy-400 block truncate font-sans">
                          {row.receiverName}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-navy-900">
                      {row.amount > 0 ? formatINR(row.amount) : <span className="text-red-500">₹0</span>}
                    </td>
                    <td className="py-2.5 text-center font-mono text-[11px] text-navy-500">
                      {row.channel || 'P2P'}
                    </td>
                    <td className="py-2.5 text-right pr-1 font-mono">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Valid
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200"
                          title={row.error}
                        >
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          {row.error || 'Invalid'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsedRows.length > 10 && (
            <div className="text-center pt-2 text-[11px] font-mono text-navy-400 border-t border-border-subtle">
              + {parsedRows.length - 10} additional rows in CSV buffer
            </div>
          )}
        </div>
      )}
    </div>
  );
};
