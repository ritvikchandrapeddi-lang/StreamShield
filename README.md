# StreamShield: Real-Time UPI Fraud Detection & Financial Crime Intelligence

> **Current Status**: **Phase 8 — End-to-End Hardening, Verification & Deployment Complete**  
> 🛡️ **All 8 Development Phases Fully Integrated & Validated (46/46 Automated Backend Tests Passing | Production Frontend Verified)**  
> ⚠️ **Notice**: All transaction fixtures, banking entities, network topologies, and simulator attack flows are synthetic demonstration data for hackathon defense and architectural evaluation. No real customer PII or proprietary banking credentials are stored.

---

## 📌 Problem Statement

The Unified Payments Interface (UPI) ecosystem processes billions of high-velocity, low-latency financial transactions daily. While UPI has revolutionized digital payments with instantaneous settlement, it has simultaneously introduced unprecedented opportunities for financial fraud, including:
- **Instantaneous mule account routing**: Stolen funds are rapidly layered and dissipated across synthetic or compromised accounts before traditional batch-detection systems can react.
- **Coordinated syndicate maneuvers**: Complex transaction rings and multi-hop laundering chains obscure the origin and destination of illicit capital.
- **Social engineering & fast-drain schemes**: Fraudsters exploit psychological manipulation, phishing, and fake collect requests, resulting in rapid fund outflow.
- **Opaque risk scoring**: Many legacy systems act as black boxes, making it difficult for compliance officers and fraud analysts to swiftly understand the root cause of an alert and take decisive action.

---

## 🛡️ Core Solution

**StreamShield** is an advanced real-time fraud detection and financial crime intelligence platform engineered specifically for modern instant-payment architectures such as UPI. 

By combining millisecond-level stream processing, graph-based network topology analytics, behavioral heuristic engines, and explainable AI risk scoring, StreamShield identifies, correlates, and halts suspicious transaction chains as they occur—transforming raw event streams into actionable financial crime intelligence.

---

## 🚀 Key Features

1. **Real-Time Fraud Detection**  
   High-throughput, sub-second event ingestion and scoring pipeline capable of evaluating UPI transactions on-the-fly against behavioral baselines, anomaly patterns, and velocity spikes.

2. **Mule Account & Suspicious Network Detection**  
   Graph intelligence and topology analysis to uncover mule rings, rapid churn accounts, synthetic identities, and clustered illicit networks attempting to layer transactions.

3. **Downstream Money Trail Intelligence**  
   Automated multi-hop fund flow tracing that illuminates money movement downstream, pinpointing intermediate wash accounts and terminal cash-out nodes.

4. **Interactive Fraud Attack Simulator**  
   A dynamic simulation sandbox enabling security engineers and risk analysts to inject simulated attack vectors (e.g., SIM-swap bursts, layering cascades, collect-request floods) to stress-test detection rules and model robustness.

5. **Fraud DNA Structural Pattern Matching**  
   Signature and graph-motif cataloging of known financial crime typologies ("Fraud DNA"), enabling instant recognition of recurring structural crime patterns across disjoint accounts.

6. **Explainable Risk Decisions**  
   Transparent, interpretable decision outputs featuring contextual risk factor breakdowns, anomaly scores, and evidentiary graphs to empower fraud operations teams to make fast, auditable decisions.

---

## 🛠️ Technology Stack

- **Frontend & Visualization**:
  - React 18 / TypeScript
  - Vite (high-performance build tooling)
  - Tailwind CSS (customized human-designed color system)
  - shadcn/ui design patterns
  - React Router v6
  - Recharts & Cytoscape.js
  - Lucide React Icons
- **Backend & APIs**:
  - Python 3.14+
  - FastAPI (asynchronous, high-performance API server)
  - Uvicorn (ASGI web server)
  - Pydantic v2 & Pydantic-Settings
- **Streaming & Data Infrastructure (Upcoming Phases)**:
  - Event Streaming: Apache Kafka / Redpanda
  - In-Memory Cache: Redis
  - Relational & Time-Series Storage: PostgreSQL / TimescaleDB
  - Graph Engine: Cytoscape.js + NetworkX / Neo4j

---

## 📁 Repository Structure

```
StreamShield/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py         # GET / and GET /health
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py         # Pydantic settings & CORS config
│   │   └── __init__.py
│   ├── .env.example
│   ├── main.py                   # FastAPI application entrypoint (main:app)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # AppLayout, Sidebar, Header
│   │   │   └── ui/               # Button, Card, Badge
│   │   ├── lib/
│   │   │   └── utils.ts          # clsx + twMerge utility
│   │   ├── routes/
│   │   │   └── index.tsx         # React Router route registry
│   │   ├── views/                # Modular view placeholders
│   │   │   ├── DashboardView.tsx
│   │   │   ├── TransactionMonitorView.tsx
│   │   │   ├── MoneyTrailView.tsx
│   │   │   ├── FraudLabView.tsx
│   │   │   ├── InvestigationsView.tsx
│   │   │   └── ModelPerformanceView.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example                  # Root environment template
├── .gitignore                    # Universal project ignore rules
└── README.md
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18+ (verified on Node v24.16.0, npm 11.13.0)
- **Python**: 3.10+ (verified on Python 3.14.5)
- **Git**

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn main:app --reload
```

- API Base URL: `http://localhost:8000`
- API Health Check: `http://localhost:8000/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- Web Console: `http://localhost:5173`

---

## 🗺️ Development Roadmap

- [x] **Phase 0: Project Setup & Repository Initialization**
  - Git repository setup, default branch configuration, remote integration.
  - Comprehensive `.gitignore`, placeholder `.env.example`, and baseline documentation.
- [x] **Phase 1: Full-Stack Project Foundation**
  - FastAPI asynchronous backend with `/` and `/health` endpoints and CORS middleware.
  - Vite + React + TypeScript + Tailwind CSS frontend with modular layout and React Router navigation.
- [x] **Phase 2: Complete Frontend UI Development**
  - Overview Dashboard with live simulated UPI stream, volume/risk charts, and active mule cluster widgets.
  - Transaction Monitoring workspace with multi-filter search, sorting, and interactive Approve/Review/Block drawer.
  - Signature Money Trail Explorer with Cytoscape.js directed graph visualization, multi-hop path highlighting, and entity dossier.
  - Interactive Fraud Intelligence Lab with 6 attack vector scenarios, parameter sliders, and detection explanation telemetry.
  - Case Investigations docket with stateful case updates, evidence audit timelines, and analyst notes.
  - Model Performance & Decision Tradeoffs evaluation with confusion matrix, ROC curves, latency distribution, and cost tradeoffs.
- [x] **Phase 3: Interactive Frontend Functionality**
  - Centralized typed state store (`StreamShieldContext`) managing transactions, cases, analyst notes, officer profiles, alerts, and toasts.
  - Automatic 10-second background transaction ticker with pause/resume and session reset capabilities.
  - Header alert notification center with direct deep-linking to transaction dossiers and case files.
  - Transaction Monitor with live status disposition updates (Approve, Review, Block), multi-field search, time filtering, and pagination.
  - Cytoscape.js Money Trail Explorer with dynamic multi-hop downstream/upstream path tracing, total flow metrics strip, and node role filters.
  - Fraud Intelligence Lab with animated transaction event streams and real-time Cytoscape topology rendering across 6 attack motifs.
  - Case Investigations docket with full analyst note CRUD, case status transitions, and Section 91 CrPC LEA JSON bundle export.
  - Model Performance workspace with dynamic decision threshold slider, interactive confusion matrix analysis, and multi-window evaluation splits.
- [x] **Phase 4: Backend + Database Foundation**
  - Modular FastAPI REST API architecture with Pydantic v2 schemas and validation.
  - SQLAlchemy ORM database integration supporting both PostgreSQL and zero-infrastructure local SQLite.
  - Database models and schemas for Accounts, Transactions, Real-Time Alerts, and Case Investigations.
  - Full endpoints for transactions, aggregated dashboard stats, alerts, case dossiers, analyst notes, and statutory LEA Section 91 CrPC export.
  - Realistic synthetic demonstration seed fixtures and seed reset endpoint.
  - Frontend API service client (`frontend/src/services/api.ts`) connecting web console state to backend API with graceful offline fallback.
  - Interactive OpenAPI Swagger documentation at `/docs` and ReDoc at `/redoc`.
  - Comprehensive automated integration test suite (`backend/tests/test_api.py`) with 10 passing tests.
- [x] **Phase 5: Fraud Detection & Transaction Engine**
  - Real-time transaction risk scoring engine powered by XGBoost with Scikit-Learn GradientBoosting fallback.
  - 18 behavioral and topological features covering amount limits, structuring near ₹50k, nocturnal circadian windows, account seasoning, and velocity counters.
  - Automated risk tiers and decisions: APPROVE (< 70), REVIEW (70 - 84), and BLOCK (>= 85).
  - Sub-15ms transaction scoring pipeline with explainable SHAP-style reasons for every suspicious decision.
  - Automated alert emission to notification docket for quarantined and flagged transactions.
  - Realistic synthetic UPI transaction dataset generator for training, evaluation, and simulator feeding.
  - Dedicated `/api/v1/fraud/*` endpoints for scoring, model metadata, empirical evaluation reports, retraining, and batch generation.
  - 14 automated integration tests validating ML inference, explainability, latency, and endpoints.
- [x] **Phase 6: Graph Intelligence & Mule-Ring Detection**
  - Directed NetworkX transaction graph representing accounts as nodes and weighted, timestamped transactions as directed edges.
  - Graph-based pattern recognition detecting circular money movement (cycles), fan-in funneling, fan-out smurfing dispersal, and multi-hop layering.
  - Multi-hop downstream money-trail path tracing identifying intermediate hops and terminal consolidation / cashout vaults.
  - Composite mule-account scoring utilizing degree disparity, flow pass-through velocity, and neighbor contamination with forensic explanations.
  - Organized fraud ring clustering and threat scoring across distinct typologies (Syndicate Falcon, Smurfing Cascade, Circular Wash Loops).
  - Dedicated `/api/v1/graph/*` REST endpoints (`/overview`, `/account/{vpa}`, `/explore`, `/mules`, `/rings`, `/trace`, `/sync`).
  - Cytoscape.js ready JSON export format directly powering interactive frontend graph visualizations.
  - Comprehensive automated test suite with 16 graph tests and 30 total backend integration tests passing.
- [x] **Phase 7: Fraud DNA & Attack Simulator Backend Integration**
  - Invariant structural pattern extraction encoding 8 topological and behavioral DNA strands (fan-in, fan-out, circular cycle participation, pass-through velocity, boundary structuring, hop depth, sink concentration, temporal compression).
  - Multi-archetype matching catalog containing canonical fraud signatures (Funnel Collector, Smurfing Dispersal, Circular Laundering Loop, Multi-Hop Layering Conduit, Coordinated Mule Network, Legitimate Commerce).
  - Cosine similarity matching engine with strand-by-strand alignment and plain-English forensic matching narratives.
  - Interactive attack simulator supporting 6 procedural scenarios (`funnel-attack`, `smurfing-split`, `layering-intermediates`, `circular-transfers`, `coordinated-mule-network`, `unknown-adaptive`).
  - Simulator execution engine feeding synthesized streams into Real-Time ML Fraud Pipeline, NetworkX graph analyzer, and money-trail tracer.
  - Dedicated `/api/v1/dna/*` and `/api/v1/simulator/*` REST endpoints for archetype queries, account DNA extraction, and configurable simulation runs.
  - 16 new automated tests in `test_dna.py` and `test_simulator.py` (46 total backend tests passing).
- [x] **Phase 8: End-to-End Hardening, Verification & Deployment**
  - Full frontend–backend integration across all six screens (`DashboardView`, `TransactionMonitorView`, `MoneyTrailView`, `FraudLabView`, `InvestigationsView`, `ModelPerformanceView`).
  - Automated camelCase <-> snake_case data mappers with robust offline-first fallback.
  - Live Cytoscape dynamic money-trail tracing directly querying the NetworkX backend graph for arbitrary VPAs.
  - Interactive online retraining and empirical telemetry card in Model Performance workspace.
  - Empirical latency and throughput profiling measuring sub-2ms P99 transaction turnaround and over 2,000 TPS single-core throughput.
  - 100% test pass rate across 46 automated backend test suites (`test_api.py`, `test_graph.py`, `test_dna.py`, `test_simulator.py`).
  - Production deployment configurations: Vercel SPA routing (`vercel.json`), Render web service spec (`render.yaml`), containerized `Dockerfile`, and updated `.env.example`.

---

## ⚡ Empirical Performance & Latency Benchmarks

StreamShield underwent rigorous, unsimulated empirical benchmarking measuring turnaround latency and single-core throughput under load.

| Component / Subsystem | Metric | Empirical Value | SLA / Requirement | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Real-Time ML Fraud Pipeline** | P50 Median Latency | **0.41 ms** | < 10.0 ms | ✅ Strict Pass |
| *(18-feature extraction + XGBoost inference + SHAP explanation)* | P95 Latency | **0.94 ms** | < 15.0 ms | ✅ Strict Pass |
| | P99 Tail Latency | **1.22 ms** | < 20.0 ms | ✅ Strict Pass |
| | Single-Core Throughput | **2,074.9 TPS** | > 1,000 TPS | ✅ High-Throughput |
| **Multi-Hop Money Trail Tracing** | P50 Median Latency | **0.08 ms** | < 5.0 ms | ✅ Instantaneous |
| *(NetworkX 4-hop DFS/BFS traversal + sink discovery)* | P99 Tail Latency | **0.10 ms** | < 10.0 ms | ✅ Instantaneous |
| | Throughput | **11,718.7 traces/sec** | > 2,000 traces/sec | ✅ Extreme Speed |
| **Fraud DNA Structural Pattern Matcher** | P50 Median Latency | **0.77 ms** | < 10.0 ms | ✅ Instantaneous |
| *(8-strand topological vector extraction + cosine matrix)* | P99 Tail Latency | **1.71 ms** | < 20.0 ms | ✅ Strict Pass |
| | Throughput | **1,170.8 matches/sec** | > 500 matches/sec | ✅ High-Throughput |

*Benchmarks executed on Python 3.14 on Windows 11 with XGBoost 3.0.0 and NetworkX 3.4. All metrics recorded directly in `backend/scripts/benchmark_report.json`.*

---

## 🚀 Deployment Guide

StreamShield is designed for seamless, zero-friction local or cloud deployment.

### Option 1: Local Development

1. **Backend Server**:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate   # Or source .venv/bin/activate on Linux/macOS
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *FastAPI Swagger documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

2. **Frontend Console**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Access the web console at [http://localhost:5173](http://localhost:5173).*

### Option 2: Production Cloud Deployment

- **Frontend (Vercel)**:
  - Connect your GitHub repository to Vercel.
  - Set Root Directory to `frontend`.
  - Environment variable: `VITE_API_BASE_URL=https://your-backend-api.onrender.com`.
  - Deployment is auto-configured with SPA client-side routing via [`vercel.json`](file:///d:/D%20DRIVR/ritvik%20engi/StreamSheild/frontend/vercel.json).

- **Backend (Render / Docker)**:
  - Connect repository to Render as a Web Service using [`backend/render.yaml`](file:///d:/D%20DRIVR/ritvik%20engi/StreamSheild/backend/render.yaml) or deploy the containerized [`backend/Dockerfile`](file:///d:/D%20DRIVR/ritvik%20engi/StreamSheild/backend/Dockerfile).
  - Environment variables: `ENVIRONMENT=production`, `DATABASE_URL=sqlite:///./streamshield.db` (or managed PostgreSQL), `CORS_ORIGINS=https://your-frontend.vercel.app`.

---

## ⚖️ PS-01 Requirements Compliance & Technical Limitations

| PS-01 Requirement | StreamShield Implementation | Hackathon Scope / Limitation |
| :--- | :--- | :--- |
| **Real-time Scoring** | XGBoost classifier with 18 streaming features (<1.5ms P99) | Evaluated on synthetic UPI distributions rather than proprietary NPCI production stream. |
| **Mule Account Detection** | Graph heuristic scoring combining in/out-degree, velocity, and neighbor contamination | Graph is maintained in-memory (NetworkX) with SQLite/Postgres persistence; production scale (>100M edges) would employ distributed Neo4j/Memgraph or graph neural networks. |
| **Multi-Hop Fund Tracing** | Breadth-first downstream money-trail tracing with sink identification | Traces up to 4 hops in real time; cyclic loops are detected and unrolled to avoid infinite recursion. |
| **Attack Simulation** | 6 procedural scenarios (`funnel-attack`, `smurfing-split`, `layering-intermediates`, etc.) | Procedural synthetic generator; does not inject live bank network packets. |
| **Statutory LEA Export** | Section 91 CrPC forensic case dossier JSON export with evidence timeline | Automated client-side bundle generation compliant with typical financial crime investigator schemas. |

---

## 🔒 Security Notice

- **Zero Credential Exposure**: Never commit live API keys, tokens, production passwords, or sensitive financial data to Git repositories.
- **Environment Management**: Always copy `.env.example` to `.env` for local testing and ensure `.env` remains strictly untracked.
- **Synthetic Data**: All transaction fixtures, testing datasets, and simulator scenarios must use synthetic or anonymized accounts—never real customer PII or banking credentials.

---

## 📄 License & Attribution

StreamShield is developed as a financial crime intelligence and risk defense platform. All rights reserved.
