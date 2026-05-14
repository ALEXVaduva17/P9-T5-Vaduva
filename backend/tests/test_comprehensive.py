import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import uuid

# Fix path to import app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

# --- Helpers ---

def get_admin_token():
    res = client.post("/api/auth/login", data={"username": "admin@fitness.local", "password": "parola123"})
    return res.json()["access_token"]

def get_member_token():
    # Use member1 which is seeded
    res = client.post("/api/auth/login", data={"username": "member1@fitness.local", "password": "parola123"})
    return res.json()["access_token"]

# --- Tests ---

# 1. Auth: Success Login
def test_login_success():
    res = client.post("/api/auth/login", data={"username": "admin@fitness.local", "password": "parola123"})
    assert res.status_code == 200
    assert "access_token" in res.json()

# 2. Auth: Register New Member
def test_register_new_member():
    unique_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    data = {
        "email": unique_email,
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "phone": "0700000000"
    }
    res = client.post("/api/auth/register", json=data)
    assert res.status_code == 201
    assert res.json()["email"] == unique_email

# 3. Auth: Logout
def test_logout():
    token = get_admin_token()
    res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["message"] == "Successfully logged out"

# 4. Facilities: Create (Admin)
def test_admin_create_facility():
    token = get_admin_token()
    name = f"Test Room {uuid.uuid4().hex[:4]}"
    res = client.post("/api/facilities", headers={"Authorization": f"Bearer {token}"}, json={"name": name})
    assert res.status_code == 201
    assert res.json()["name"] == name
    return res.json()["id"]

# 5. Facilities: List
def test_list_facilities():
    res = client.get("/api/facilities")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# 6. Facilities: Update (Admin)
def test_admin_update_facility():
    token = get_admin_token()
    # First create one
    fac_id = test_admin_create_facility()
    new_name = "Updated Room Name"
    res = client.put(f"/api/facilities/{fac_id}", headers={"Authorization": f"Bearer {token}"}, json={"name": new_name})
    assert res.status_code == 200
    assert res.json()["name"] == new_name

# 7. Facilities: Delete (Admin)
def test_admin_delete_facility():
    token = get_admin_token()
    fac_id = test_admin_create_facility()
    res = client.delete(f"/api/facilities/{fac_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204

# 8. Subscriptions: Buy Custom PT Sessions
def test_member_buy_custom_subscription():
    token = get_member_token()
    # Plan 1 is standard
    res = client.post(
        "/api/subscriptions/buy", 
        headers={"Authorization": f"Bearer {token}"}, 
        json={"type_id": 1, "pt_sessions": 5}
    )
    assert res.status_code == 200
    assert res.json()["pt_sessions"] == 5

# 9. Reservations: Cancel Reservation
def test_member_cancel_reservation():
    token = get_member_token()
    # First reserve (Class 1 seeded)
    client.post("/api/reservations/", headers={"Authorization": f"Bearer {token}"}, json={"class_id": 1})
    
    # Then cancel
    res = client.delete("/api/reservations/1", headers={"Authorization": f"Bearer {token}"})
    # Status code might be 200 or 204 depending on implementation, let's check
    assert res.status_code in [200, 204]

# 10. Reports: Income Report (Admin)
def test_admin_income_report():
    token = get_admin_token()
    res = client.get("/api/reports/income", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "total_income" in res.json()

# 11. Reports: Occupancy Report (Admin)
def test_admin_occupancy_report():
    token = get_admin_token()
    res = client.get("/api/reports/occupancy", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# 12. Reports: Restricted Clients (Admin)
def test_admin_restricted_clients_report():
    token = get_admin_token()
    res = client.get("/api/reports/restricted-clients", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# 13. Trainers: Create (Admin)
def test_admin_create_trainer():
    token = get_admin_token()
    data = {
        "name": "New Trainer",
        "specialization": "Yoga",
        "bio": "Expert in yoga"
    }
    res = client.post("/api/trainers", headers={"Authorization": f"Bearer {token}"}, json=data)
    assert res.status_code == 201
    assert res.json()["name"] == "New Trainer"

# 14. Classes: Create (Admin)
def test_admin_create_class():
    token = get_admin_token()
    data = {
        "name": "New Yoga Class",
        "capacity": 10,
        "scheduled_at": (datetime.now() + timedelta(days=1)).isoformat(),
        "duration_minutes": 60,
        "trainer_id": 1,
        "facility_id": 1
    }
    res = client.post("/api/classes", headers={"Authorization": f"Bearer {token}"}, json=data)
    assert res.status_code == 201
    assert res.json()["name"] == "New Yoga Class"

# 15. Equipment: CRUD (Admin)
def test_equipment_crud():
    token = get_admin_token()
    # Create
    res = client.post("/api/equipment", headers={"Authorization": f"Bearer {token}"}, json={"name": "Dumbbells", "status": "functional"})
    assert res.status_code == 201
    eq_id = res.json()["id"]
    
    # List
    res_list = client.get("/api/equipment", headers={"Authorization": f"Bearer {token}"})
    assert res_list.status_code == 200
    
    # Delete
    res_del = client.delete(f"/api/equipment/{eq_id}", headers={"Authorization": f"Bearer {token}"})
    assert res_del.status_code == 204

# 16. Business Rule: Account Locking
def test_business_rule_lockout():
    username = f"lockout_{uuid.uuid4().hex[:4]}@test.com"
    # Register first
    client.post("/api/auth/register", json={
        "email": username, "password": "correct_password", "first_name": "L", "last_name": "U", "phone": "0"
    })
    
    # 5 failed attempts
    for _ in range(5):
        client.post("/api/auth/login", data={"username": username, "password": "wrong"})
    
    # 6th attempt should be 403
    res = client.post("/api/auth/login", data={"username": username, "password": "wrong"})
    assert res.status_code == 403
    assert "locked" in res.json()["detail"].lower()
