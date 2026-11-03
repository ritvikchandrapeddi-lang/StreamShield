# StreamShield: Real-Time UPI Fraud Detection & Financial Crime Intelligence

> **Current Status**: **Phase 2 — Complete Frontend UI Platform Implemented**  
> ⚠️ **Notice**: This project is actively under development. The full-featured financial crime intelligence web console—including the Cytoscape multi-hop Money Trail Explorer, live Transaction Monitor, Fraud Intelligence Lab simulator, and Case Investigations docket—is established with high-fidelity synthetic UPI demonstration fixtures.

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
- [ ] **Phase 3: Streaming Ingestion & Real-Time Engine**
  - UPI transaction schema definition, event models, and data contract specifications.
  - Streaming endpoint and Kafka / Redis event pipeline integration.
- [ ] **Phase 4: Graph Intelligence & Mule Network Tracing**
  - Graph database ingestion, multi-hop path tracing, and mule cluster scoring algorithms.
- [ ] **Phase 5: Fraud DNA & Attack Simulator Backend Integration**
  - Typology library, synthetic transaction generator, and attack vector stress testbed.
- [ ] **Phase 6: End-to-End Hardening, Verification & Deployment**
  - Integration testing, throughput profiling, benchmark verification, and containerization.

---

## 🔒 Security Notice

- **Zero Credential Exposure**: Never commit live API keys, tokens, production passwords, or sensitive financial data to Git repositories.
- **Environment Management**: Always copy `.env.example` to `.env` for local testing and ensure `.env` remains strictly untracked.
- **Synthetic Data**: All transaction fixtures, testing datasets, and simulator scenarios must use synthetic or anonymized accounts—never real customer PII or banking credentials.

---

## 📄 License & Attribution

StreamShield is developed as a financial crime intelligence and risk defense platform. All rights reserved.
