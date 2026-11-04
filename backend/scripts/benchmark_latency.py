"""
StreamShield Phase 8 — Empirical Latency & Throughput Benchmark Suite

Measures actual, unsimulated hardware-level turnaround times across:
1. Real-Time ML Transaction Risk Scoring (extract_features + XGBoost inference + SHAP rules)
2. NetworkX Directed Graph Intelligence (multi-hop downstream money trail traversal)
3. Fraud DNA Pattern Recognition (structural vector extraction + cosine similarity matching)
"""

import os
import sys
import time
import json
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.pipeline import fraud_pipeline
from app.graph.service import graph_service
from app.dna.service import fraud_dna_service
from app.db.session import init_db, SessionLocal

def run_benchmarks():
    print("=" * 70)
    print("STREAMSHIELD EMPIRICAL PERFORMANCE & LATENCY PROFILING")
    print("=" * 70)
    print("Initializing SQLite/PostgreSQL schemas and in-memory caches...")
    init_db()
    db = SessionLocal()
    graph_service.sync_from_db(db)

    results = {}

    # -------------------------------------------------------------------------
    # 1. REAL-TIME ML FRAUD PIPELINE BENCHMARK
    # -------------------------------------------------------------------------
    print("\n[1/3] Benchmarking Real-Time ML Scoring Pipeline (1,000 transactions)...")
    sample_tx = {
        "id": "BENCH-TXN-001",
        "sender_vpa": "amit.verma91@okhdfcbank",
        "sender_name": "Amit Verma",
        "sender_bank": "HDFC Bank",
        "sender_account_age_days": 180,
        "sender_device_id": "DEV-BENCH-PHONE",
        "receiver_vpa": "deepak.mule01@okicici",
        "receiver_name": "Deepak Mule",
        "receiver_bank": "ICICI Bank",
        "amount": 48500.0,
        "timestamp": "2026-11-05T00:30:00Z",
        "channel": "P2P",
    }

    # Warm-up (50 runs)
    for _ in range(50):
        fraud_pipeline.process_transaction(sample_tx, db=None, create_alert_if_flagged=False)

    ml_latencies = []
    n_ml_runs = 1000
    t_start_ml = time.perf_counter()
    for i in range(n_ml_runs):
        t0 = time.perf_counter()
        fraud_pipeline.process_transaction(sample_tx, db=None, create_alert_if_flagged=False)
        ml_latencies.append((time.perf_counter() - t0) * 1000.0) # in ms
    total_time_ml = time.perf_counter() - t_start_ml

    ml_p50 = float(np.percentile(ml_latencies, 50))
    ml_p90 = float(np.percentile(ml_latencies, 90))
    ml_p95 = float(np.percentile(ml_latencies, 95))
    ml_p99 = float(np.percentile(ml_latencies, 99))
    ml_mean = float(np.mean(ml_latencies))
    ml_tps = float(n_ml_runs / total_time_ml)

    print(f"  > P50 Latency : {ml_p50:.2f} ms")
    print(f"  > P95 Latency : {ml_p95:.2f} ms")
    print(f"  > P99 Latency : {ml_p99:.2f} ms")
    print(f"  > Mean Latency: {ml_mean:.2f} ms")
    print(f"  > Throughput  : {ml_tps:.1f} transactions / second (single-core)")

    results["ml_pipeline"] = {
        "iterations": n_ml_runs,
        "p50_ms": round(ml_p50, 2),
        "p90_ms": round(ml_p90, 2),
        "p95_ms": round(ml_p95, 2),
        "p99_ms": round(ml_p99, 2),
        "mean_ms": round(ml_mean, 2),
        "single_core_tps": round(ml_tps, 1),
    }

    # -------------------------------------------------------------------------
    # 2. NETWORKX MULTI-HOP MONEY TRAIL GRAPH BENCHMARK
    # -------------------------------------------------------------------------
    print("\n[2/3] Benchmarking Multi-Hop Graph Money Trail Tracing (150 iterations)...")
    source_vpa = "amit.verma91@okhdfcbank"

    # Warm-up (10 runs)
    for _ in range(10):
        graph_service.trace_trail(source_vpa, max_hops=4, min_amount=5000.0)

    graph_latencies = []
    n_graph_runs = 150
    t_start_graph = time.perf_counter()
    for _ in range(n_graph_runs):
        t0 = time.perf_counter()
        res = graph_service.trace_trail(source_vpa, max_hops=4, min_amount=5000.0)
        graph_latencies.append((time.perf_counter() - t0) * 1000.0)
    total_time_graph = time.perf_counter() - t_start_graph

    graph_p50 = float(np.percentile(graph_latencies, 50))
    graph_p95 = float(np.percentile(graph_latencies, 95))
    graph_p99 = float(np.percentile(graph_latencies, 99))
    graph_mean = float(np.mean(graph_latencies))
    graph_qps = float(n_graph_runs / total_time_graph)

    print(f"  > P50 Latency : {graph_p50:.2f} ms")
    print(f"  > P95 Latency : {graph_p95:.2f} ms")
    print(f"  > P99 Latency : {graph_p99:.2f} ms")
    print(f"  > Mean Latency: {graph_mean:.2f} ms")
    print(f"  > Throughput  : {graph_qps:.1f} graph traces / second")

    results["graph_tracing"] = {
        "iterations": n_graph_runs,
        "p50_ms": round(graph_p50, 2),
        "p95_ms": round(graph_p95, 2),
        "p99_ms": round(graph_p99, 2),
        "mean_ms": round(graph_mean, 2),
        "qps": round(graph_qps, 1),
    }

    # -------------------------------------------------------------------------
    # 3. FRAUD DNA PATTERN EXTRACTION & MATCHING BENCHMARK
    # -------------------------------------------------------------------------
    print("\n[3/3] Benchmarking Fraud DNA Pattern Matching (200 iterations)...")

    # Warm-up (10 runs)
    for _ in range(10):
        fraud_dna_service.analyze_account(source_vpa, depth=2)

    dna_latencies = []
    n_dna_runs = 200
    t_start_dna = time.perf_counter()
    for _ in range(n_dna_runs):
        t0 = time.perf_counter()
        fraud_dna_service.analyze_account(source_vpa, depth=2)
        dna_latencies.append((time.perf_counter() - t0) * 1000.0)
    total_time_dna = time.perf_counter() - t_start_dna

    dna_p50 = float(np.percentile(dna_latencies, 50))
    dna_p95 = float(np.percentile(dna_latencies, 95))
    dna_p99 = float(np.percentile(dna_latencies, 99))
    dna_mean = float(np.mean(dna_latencies))
    dna_qps = float(n_dna_runs / total_time_dna)

    print(f"  > P50 Latency : {dna_p50:.2f} ms")
    print(f"  > P95 Latency : {dna_p95:.2f} ms")
    print(f"  > P99 Latency : {dna_p99:.2f} ms")
    print(f"  > Mean Latency: {dna_mean:.2f} ms")
    print(f"  > Throughput  : {dna_qps:.1f} DNA matches / second")

    results["dna_matching"] = {
        "iterations": n_dna_runs,
        "p50_ms": round(dna_p50, 2),
        "p95_ms": round(dna_p95, 2),
        "p99_ms": round(dna_p99, 2),
        "mean_ms": round(dna_mean, 2),
        "qps": round(dna_qps, 1),
    }

    # Save benchmark report artifact
    report_path = os.path.join(os.path.dirname(__file__), "benchmark_report.json")
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 70)
    print(f"BENCHMARK COMPLETED SUCCESSFULLY — Report saved to {report_path}")
    print("=" * 70)
    db.close()
    return results


if __name__ == "__main__":
    run_benchmarks()
