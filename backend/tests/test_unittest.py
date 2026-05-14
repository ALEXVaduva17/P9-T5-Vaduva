import unittest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import uuid
import sys
import os
import asyncio

# Fix path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app
from app.database import engine, Base, async_session_factory
from app.models.user import User, UserRole
from app.models.member import Member
from app.models.subscription_type import SubscriptionType
from app.services.auth_service import get_password_hash

async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_factory() as session:
        # Create Admin if not exists
        res = await session.execute(asyncio.get_event_loop().run_in_executor(None, lambda: None)) # dummy for sync feel
        
        # Check admin
        from sqlalchemy import select
        admin_res = await session.execute(select(User).where(User.email == "admin@fitness.local"))
        if not admin_res.scalars().first():
            admin = User(
                email="admin@fitness.local",
                hashed_password=get_password_hash("parola123"),
                role=UserRole.admin,
                is_active=True
            )
            session.add(admin)
        
        # Check member
        member_user_res = await session.execute(select(User).where(User.email == "member1@fitness.local"))
        if not member_user_res.scalars().first():
            member_user = User(
                email="member1@fitness.local",
                hashed_password=get_password_hash("parola123"),
                role=UserRole.member,
                is_active=True
            )
            session.add(member_user)
            await session.flush()
            
            member = Member(
                user_id=member_user.id,
                first_name="Member",
                last_name="One",
                phone="0712345678",
                subscription_status="active"
            )
            session.add(member)

        # Ensure at least one subscription type and facility for tests
        from app.models.facility import Facility
        fac_res = await session.execute(select(Facility))
        if not fac_res.scalars().first():
            session.add(Facility(name="Sala Test"))
            
        sub_type_res = await session.execute(select(SubscriptionType))
        if not sub_type_res.scalars().first():
            session.add(SubscriptionType(name="Standard", base_fee=100.0, duration_days=30))
            
        # Ensure a trainer and a class exist
        from app.models.trainer import Trainer
        from app.models.fitness_class import FitnessClass
        tr_res = await session.execute(select(Trainer))
        trainer = tr_res.scalars().first()
        if not trainer:
            trainer = Trainer(name="Trainer Test", specialization="General")
            session.add(trainer)
            await session.flush()
            
        fac_res = await session.execute(select(Facility))
        facility = fac_res.scalars().first()
        
        class_res = await session.execute(select(FitnessClass))
        if not class_res.scalars().first():
            session.add(FitnessClass(
                name="Clasa Test",
                capacity=10,
                scheduled_at=datetime.now() + timedelta(days=1),
                duration_minutes=60,
                trainer_id=trainer.id,
                facility_id=facility.id
            ))

        await session.commit()

class TestFitnessSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run async setup
        asyncio.run(setup_test_db())
        
        cls.test_client = TestClient(app)
        cls.test_client.__enter__()
        cls.client = cls.test_client
        
        # Login to get tokens for use in tests
        res_admin = cls.client.post("/api/auth/login", data={"username": "admin@fitness.local", "password": "parola123"})
        if res_admin.status_code != 200:
            print(f"Admin Login Failed: {res_admin.status_code} - {res_admin.text}")
        cls.admin_token = res_admin.json().get("access_token")
        
        res_member = cls.client.post("/api/auth/login", data={"username": "member1@fitness.local", "password": "parola123"})
        if res_member.status_code != 200:
            print(f"Member Login Failed: {res_member.status_code} - {res_member.text}")
        cls.member_token = res_member.json().get("access_token")

    @classmethod
    def tearDownClass(cls):
        cls.test_client.__exit__(None, None, None)

    # 1. Auth: Success Login
    def test_01_login_success(self):
        res = self.client.post("/api/auth/login", data={"username": "admin@fitness.local", "password": "parola123"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access_token", res.json())

    # 2. Auth: Register New Member
    def test_02_register_new_member(self):
        unique_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
        data = {
            "email": unique_email,
            "password": "password123",
            "first_name": "Test",
            "last_name": "User",
            "phone": "0700000000"
        }
        res = self.client.post("/api/auth/register", json=data)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["email"], unique_email)

    # 3. Auth: Logout
    def test_03_logout(self):
        res = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["message"], "Successfully logged out")

    # 4. Facilities: Create (Admin)
    def test_04_admin_create_facility(self):
        name = f"Test Room {uuid.uuid4().hex[:4]}"
        res = self.client.post("/api/facilities", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": name})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["name"], name)
        self.__class__.created_facility_id = res.json()["id"]

    # 5. Facilities: List
    def test_05_list_facilities(self):
        res = self.client.get("/api/facilities")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # 6. Facilities: Update (Admin)
    def test_06_admin_update_facility(self):
        fac_id = getattr(self, "created_facility_id", 1)
        new_name = "Updated Room Name"
        res = self.client.put(f"/api/facilities/{fac_id}", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": new_name})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["name"], new_name)

    # 7. Facilities: Delete (Admin)
    def test_07_admin_delete_facility(self):
        # Create a temp one to delete
        res_temp = self.client.post("/api/facilities", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": "To Delete"})
        fac_id = res_temp.json()["id"]
        res = self.client.delete(f"/api/facilities/{fac_id}", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 204)

    # 8. Subscriptions: Buy Custom PT Sessions
    def test_08_member_buy_custom_subscription(self):
        res = self.client.post(
            "/api/subscriptions/buy", 
            headers={"Authorization": f"Bearer {self.member_token}"}, 
            json={"type_id": 1, "pt_sessions": 5}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["pt_sessions"], 5)

    # 9. Reservations: Create Reservation
    def test_09_member_reserve_class(self):
        res = self.client.post(
            "/api/reservations/", 
            headers={"Authorization": f"Bearer {self.member_token}"}, 
            json={"class_id": 1}
        )
        self.assertIn(res.status_code, [200, 400]) # 400 if already reserved in previous runs

    # 10. Reports: Revenue Report (Admin)
    def test_10_admin_revenue_report(self):
        res = self.client.get("/api/reports/revenue?year=2026&month=5", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("total_revenue", res.json())

    # 11. Reports: Occupancy Report (Admin)
    def test_11_admin_occupancy_report(self):
        res = self.client.get("/api/reports/occupancy?year=2026&month=5", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # 12. Reports: Restricted Clients (Admin)
    def test_12_admin_restricted_clients_report(self):
        res = self.client.get("/api/reports/restricted-clients", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # 13. Trainers: Create (Admin)
    def test_13_admin_create_trainer(self):
        data = {"name": "Test Trainer", "specialization": "Yoga", "bio": "Bio"}
        res = self.client.post("/api/trainers", headers={"Authorization": f"Bearer {self.admin_token}"}, json=data)
        self.assertEqual(res.status_code, 201)

    # 14. Classes: Create (Admin)
    def test_14_admin_create_class(self):
        data = {
            "name": "Test Class",
            "capacity": 10,
            "scheduled_at": (datetime.now() + timedelta(days=2)).isoformat(),
            "duration_minutes": 60,
            "trainer_id": 1,
            "facility_id": 1
        }
        res = self.client.post("/api/classes", headers={"Authorization": f"Bearer {self.admin_token}"}, json=data)
        self.assertEqual(res.status_code, 201)

    # 15. Equipment: CRUD (Admin)
    def test_15_equipment_crud(self):
        # Create
        res = self.client.post("/api/equipment", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": "Dumbbells", "status": "functional"})
        self.assertEqual(res.status_code, 201)
        eq_id = res.json()["id"]
        # Delete
        res_del = self.client.delete(f"/api/equipment/{eq_id}", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res_del.status_code, 204)

    # 16. Trainers: Update (Admin)
    def test_16_admin_update_trainer(self):
        # Create first
        res_create = self.client.post("/api/trainers", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": "To Update", "specialization": "X"})
        t_id = res_create.json()["id"]
        # Update
        res = self.client.put(f"/api/trainers/{t_id}", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": "Updated Name", "specialization": "Y"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["name"], "Updated Name")

    # 17. Trainers: Delete (Admin)
    def test_17_admin_delete_trainer(self):
        res_create = self.client.post("/api/trainers", headers={"Authorization": f"Bearer {self.admin_token}"}, json={"name": "To Delete", "specialization": "X"})
        t_id = res_create.json()["id"]
        res = self.client.delete(f"/api/trainers/{t_id}", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 204)

    # 18. Classes: Update (Admin)
    def test_18_admin_update_class(self):
        # Create first
        data = {
            "name": "To Update", "capacity": 10, 
            "scheduled_at": (datetime.now() + timedelta(days=5)).isoformat(),
            "duration_minutes": 30, "trainer_id": 1, "facility_id": 1
        }
        res_create = self.client.post("/api/classes", headers={"Authorization": f"Bearer {self.admin_token}"}, json=data)
        c_id = res_create.json()["id"]
        # Update
        data["name"] = "Updated Class Name"
        res = self.client.put(f"/api/classes/{c_id}", headers={"Authorization": f"Bearer {self.admin_token}"}, json=data)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["name"], "Updated Class Name")

    # 19. Classes: Delete (Admin)
    def test_19_admin_delete_class(self):
        data = {
            "name": "To Delete", "capacity": 10, 
            "scheduled_at": (datetime.now() + timedelta(days=5)).isoformat(),
            "duration_minutes": 30, "trainer_id": 1, "facility_id": 1
        }
        res_create = self.client.post("/api/classes", headers={"Authorization": f"Bearer {self.admin_token}"}, json=data)
        c_id = res_create.json()["id"]
        res = self.client.delete(f"/api/classes/{c_id}", headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertEqual(res.status_code, 204)

    # 20. Public: List Trainers
    def test_20_public_list_trainers(self):
        res = self.client.get("/api/trainers")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # 21. Public: List Classes
    def test_21_public_list_classes(self):
        res = self.client.get("/api/classes")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

if __name__ == "__main__":
    unittest.main()
