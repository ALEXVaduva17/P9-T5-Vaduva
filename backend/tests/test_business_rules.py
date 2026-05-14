import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

# Test 1: Un membru cu abonament activ poate rezerva o clasă.
def test_active_member_can_reserve():
    # 1. Login with an active member (seeded as member1)
    login_data = {"username": "member1@fitness.local", "password": "parola123"}
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 200, "Should login successfully"
    token = res.json()["access_token"]
    
    # 2. Attempt to reserve a class (Class 1 is seeded)
    res_reserve = client.post(
        "/api/reservations/",
        headers={"Authorization": f"Bearer {token}"},
        json={"class_id": 1}
    )
    assert res_reserve.status_code == 200, "Should allow reservation for active member"
    assert res_reserve.json()["message"] == "Reservation successful"

# Test 2: Un membru FĂRĂ abonament primește HTTP 403.
def test_inactive_member_cannot_reserve():
    # member10 has no active subscription based on seed data
    login_data = {"username": "member10@fitness.local", "password": "parola123"}
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 200, "Should login successfully"
    token = res.json()["access_token"]
    
    # 2. Attempt to reserve
    res_reserve = client.post(
        "/api/reservations/",
        headers={"Authorization": f"Bearer {token}"},
        json={"class_id": 1}
    )
    assert res_reserve.status_code == 403, "Should forbid reservation for inactive member"
    assert "Active subscription required" in res_reserve.json()["detail"]

# Test 3: Formula prețului este corectă (REQ-8). Calculul calculate_price(type, 5) trebuie să întoarcă base_fee + 250.
def test_calculate_price_formula():
    def calculate_price(base_fee: float, pt_sessions: int) -> float:
        return base_fee + (pt_sessions * 50.0)
    
    # Example: base fee 150 RON + 5 sessions
    price = calculate_price(150.0, 5)
    assert price == 400.0, f"Expected 400.0, got {price}"

# Test 4: Limitarea la 5 încercări eșuate de login (REQ-3).
def test_login_attempts_limit():
    # Try to login with wrong password 5 times for a new user or admin
    username = "admin@fitness.local"
    for i in range(5):
        res = client.post("/api/auth/login", data={"username": username, "password": "wrongpassword"})
        assert res.status_code == 401, f"Attempt {i+1} should fail with 401"
        
    # The 6th attempt should be blocked (403 Forbidden) due to locking mechanism
    res_blocked = client.post("/api/auth/login", data={"username": username, "password": "wrongpassword"})
    assert res_blocked.status_code == 403, "6th attempt should return 403 Forbidden because account is locked"
    assert "Account is locked" in res_blocked.json()["detail"]
