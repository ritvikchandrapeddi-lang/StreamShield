import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import httpx
from main import app
from app.db.session import init_db

# Initialize database schemas and synthetic fixtures
init_db()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_root_endpoint(client: httpx.AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "StreamShield" in data["name"]
    assert data["status"] == "operational"
    assert data["phase"] == "Phase 4: Backend + Database Foundation"


@pytest.mark.anyio
async def test_health_check_endpoint(client: httpx.AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["services"]["api_server"] == "online"
    assert data["services"]["database"]["status"] == "healthy"


@pytest.mark.anyio
async def test_dashboard_stats(client: httpx.AsyncClient):
    response = await client.get("/api/v1/dashboard/stats?window=24h")
    assert response.status_code == 200
    data = response.json()
    assert data["total_transactions"] > 0
    assert data["monitored_volume_inr"] > 0
    assert "critical" in data["risk_distribution"]
    assert len(data["recent_alerts"]) > 0
    assert data["is_simulated"] is True


@pytest.mark.anyio
async def test_list_transactions_with_filter(client: httpx.AsyncClient):
    response = await client.get("/api/v1/transactions?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "transactions" in data
    assert data["total"] > 0

    # Search filter
    search_res = await client.get("/api/v1/transactions?q=Ramesh")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["transactions"]) >= 1


@pytest.mark.anyio
async def test_get_single_transaction_and_update_decision(client: httpx.AsyncClient):
    tx_id = "TXN-902418-UPI"
    get_res = await client.get(f"/api/v1/transactions/{tx_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == tx_id

    # Update decision
    patch_res = await client.patch(
        f"/api/v1/transactions/{tx_id}/decision",
        json={"decision": "review", "reason": "Pending telecom IMSI KYC audit"},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["decision"] == "review"

    # Non-existent transaction
    bad_res = await client.get("/api/v1/transactions/NON-EXISTENT-TX")
    assert bad_res.status_code == 404


@pytest.mark.anyio
async def test_create_transaction(client: httpx.AsyncClient):
    new_tx = {
        "sender_vpa": "test_sender@sbi",
        "sender_name": "Test Sender Account",
        "sender_bank": "State Bank of India",
        "sender_city": "Delhi, DL",
        "receiver_vpa": "test_receiver@icici",
        "receiver_name": "Test Beneficiary",
        "receiver_bank": "ICICI Bank",
        "amount": 25000.0,
        "risk_score": 85,
        "risk_level": "high",
        "decision": "review",
        "risk_factors": ["Test risk factor indicator"],
        "channel": "P2P",
        "mule_probability": 0.75,
        "is_simulated": True,
    }
    response = await client.post("/api/v1/transactions", json=new_tx)
    assert response.status_code == 201
    created = response.json()
    assert created["amount"] == 25000.0
    assert created["id"].startswith("TXN-")


@pytest.mark.anyio
async def test_alerts_lifecycle(client: httpx.AsyncClient):
    # 1. List alerts
    list_res = await client.get("/api/v1/alerts")
    assert list_res.status_code == 200
    data = list_res.json()
    assert len(data["alerts"]) > 0

    first_alert_id = data["alerts"][0]["id"]

    # 2. Mark single alert as read
    patch_res = await client.patch(f"/api/v1/alerts/{first_alert_id}/read")
    assert patch_res.status_code == 200
    assert patch_res.json()["read"] is True

    # 3. Mark all as read
    all_read_res = await client.post("/api/v1/alerts/mark-all-read")
    assert all_read_res.status_code == 200


@pytest.mark.anyio
async def test_investigations_lifecycle(client: httpx.AsyncClient):
    # 1. List cases
    cases_res = await client.get("/api/v1/investigations")
    assert cases_res.status_code == 200
    cases_data = cases_res.json()
    assert cases_data["total"] >= 4

    case_id = "CASE-2026-0841"

    # 2. Get case details with evidence and notes
    detail_res = await client.get(f"/api/v1/investigations/{case_id}")
    assert detail_res.status_code == 200
    case_detail = detail_res.json()
    assert case_detail["id"] == case_id
    assert len(case_detail["evidence"]) >= 1
    assert len(case_detail["notes"]) >= 1

    # 3. Update case status
    status_res = await client.patch(
        f"/api/v1/investigations/{case_id}/status",
        json={"status": "escalated"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "escalated"

    # 4. Add analyst note
    note_payload = {
        "author": "Inspector S. Roy (Cyber Cell)",
        "text": "Automated verification test note for statutory ledger logging.",
        "badge": "Forensic Linkage",
    }
    note_res = await client.post(f"/api/v1/investigations/{case_id}/notes", json=note_payload)
    assert note_res.status_code == 201
    created_note = note_res.json()
    assert created_note["text"] == note_payload["text"]

    # 5. Edit analyst note
    note_id = created_note["id"]
    edit_res = await client.patch(
        f"/api/v1/investigations/{case_id}/notes/{note_id}",
        json={"text": "Updated narrative following nodal bank response."},
    )
    assert edit_res.status_code == 200
    assert "Updated narrative" in edit_res.json()["text"]

    # 6. Delete analyst note
    del_res = await client.delete(f"/api/v1/investigations/{case_id}/notes/{note_id}")
    assert del_res.status_code == 200

    # 7. Export LEA Bundle
    export_res = await client.get(f"/api/v1/investigations/{case_id}/export")
    assert export_res.status_code == 200
    bundle = export_res.json()
    assert bundle["case_id"] == case_id
    assert "Section 91 CrPC" in bundle["statutory_notice"]


@pytest.mark.anyio
async def test_accounts_endpoints(client: httpx.AsyncClient):
    # 1. List accounts
    accounts_res = await client.get("/api/v1/accounts")
    assert accounts_res.status_code == 200
    accounts = accounts_res.json()
    assert len(accounts) >= 5

    # 2. Get profile with ledger flow
    vpa = "fastpay_drop88@paytm"
    profile_res = await client.get(f"/api/v1/accounts/{vpa}")
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert profile_data["account"]["vpa"] == vpa
    assert "recent_transactions" in profile_data


@pytest.mark.anyio
async def test_seed_reset(client: httpx.AsyncClient):
    response = await client.post("/api/v1/seed/reset")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
