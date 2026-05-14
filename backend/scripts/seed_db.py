import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
import random

# Add backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import engine, async_session_factory, Base
from app.models.user import User, UserRole
from app.models.member import Member
from app.models.subscription_type import SubscriptionType
from app.models.subscription import Subscription
from app.models.facility import Facility
from app.models.fitness_class import FitnessClass
from app.models.reservation import Reservation
from app.models.payment import Payment, PaymentStatus
from app.models.trainer import Trainer
from app.models.equipment import Equipment
from app.models.restricted_client import RestrictedClient
from app.services.auth_service import get_password_hash

async def clear_database(session: AsyncSession):
    tables = [
        "payments", "reservations", "fitness_classes", "equipment",
        "subscriptions", "subscription_types", "members", "users",
        "facilities", "trainers", "restricted_clients"
    ]
    for table in tables:
        try:
            await session.execute(text(f"DELETE FROM {table}"))
        except Exception:
            pass
    await session.commit()
    print("Database cleared.")

async def seed_data():
    print("Starting comprehensive database seeding...")
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_factory() as session:
        await clear_database(session)
        
        # 1. Create Admin
        admin = User(
            email="admin@fitness.local",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.admin,
            is_active=True
        )
        session.add(admin)
        
        # 2. Subscription Types
        sub_types = [
            SubscriptionType(name="Standard", base_fee=150.00, duration_days=30),
            SubscriptionType(name="Personalizat", base_fee=150.00, duration_days=30)
        ]
        session.add_all(sub_types)
        await session.commit()
        
        # 3. Facilities
        facilities = [
            Facility(name="Sala Aerobic"),
            Facility(name="Sala Forță"),
            Facility(name="Bazin Înot")
        ]
        session.add_all(facilities)
        await session.commit()
        
        # 4. Trainers
        trainers = [
            Trainer(name="Alex", specialization="Cardio & Fitness"),
            Trainer(name="Mihai", specialization="Bodybuilding")
        ]
        session.add_all(trainers)
        await session.commit()
        
        # 5. Fitness Classes
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        classes = []
        for i in range(5):
            classes.append(FitnessClass(
                facility_id=facilities[0].id,
                name=f"Aerobic Session {i+1}",
                capacity=15,
                scheduled_at=now + timedelta(days=i, hours=2)
            ))
        for i in range(3):
            classes.append(FitnessClass(
                facility_id=facilities[1].id,
                name=f"Powerlifting {i+1}",
                capacity=10,
                scheduled_at=now + timedelta(days=i, hours=4)
            ))
        session.add_all(classes)
        await session.commit()
        
        # 6. Generate 10 Members
        members = []
        for i in range(1, 11):
            user = User(
                email=f"member{i}@fitness.local",
                hashed_password=get_password_hash("parola123"),
                role=UserRole.member,
                is_active=True
            )
            session.add(user)
            await session.commit()
            
            member = Member(
                user_id=user.id,
                first_name=f"Membru",
                last_name=f"{i}",
                phone=f"07000000{i:02d}",
                subscription_status="active" if i <= 6 else "none"
            )
            session.add(member)
            members.append(member)
        await session.commit()
        
        # 7. Add subscriptions, payments and reservations
        for i, member in enumerate(members[:6]): # First 6 have active subscriptions
            base_fee = sub_types[i % 2].base_fee
            pt_sessions = 5 if i % 2 != 0 else 0
            sub = Subscription(
                member_id=member.id,
                type_id=sub_types[i % 2].id,
                type=sub_types[i % 2].name,
                base_fee=base_fee,
                pt_sessions=pt_sessions,
                total_amount=base_fee + (pt_sessions * 50),
                start_date=now - timedelta(days=2),
                end_date=now + timedelta(days=28),
                status="active"
            )
            session.add(sub)
            await session.commit()
            
            # Payment for sub
            amount = float(sub_types[i % 2].base_fee) + (sub.pt_sessions * 50)
            payment = Payment(
                subscription_id=sub.id,
                amount=amount,
                currency="RON",
                status=PaymentStatus.completed,
                paid_at=now - timedelta(days=2),
                gateway_session_id=f"sim_{member.id}_{now.timestamp()}"
            )
            session.add(payment)
            
            # Reservations for the active member
            res = Reservation(
                class_id=classes[i % len(classes)].id,
                member_id=member.id,
                status="confirmed"
            )
            session.add(res)
            
        await session.commit()
        print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
