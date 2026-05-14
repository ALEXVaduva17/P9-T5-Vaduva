"""
Comprehensive seed script — populates the database with demo data for
facilities, trainers, fitness classes, and sample members with subscriptions.
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func as sa_func
from app.database import engine, async_session_factory, Base
from app.models.user import User, UserRole
from app.models.member import Member
from app.models.subscription_type import SubscriptionType
from app.models.subscription import Subscription
from app.models.restricted_client import RestrictedClient
from app.models.facility import Facility
from app.models.fitness_class import FitnessClass
from app.models.trainer import Trainer
from app.models.equipment import Equipment
from app.services.auth_service import get_password_hash


async def seed_data():
    print("🚀 Starting comprehensive database seeding...")

    # Create tables (drop first to pick up schema changes in dev)
    async with engine.begin() as conn:
        print("Dropping and recreating tables...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # ── 1. Admin User ──
        result = await session.execute(select(User).where(User.email == "admin@fitness.com"))
        admin = result.scalars().first()
        if not admin:
            print("👤 Creating admin user...")
            admin = User(
                email="admin@fitness.com",
                hashed_password=get_password_hash("parola123"),
                role=UserRole.admin,
                is_active=True
            )
            session.add(admin)
            await session.commit()
            print("   ✅ Admin: admin@fitness.com / parola123")
        # ── 1.5 Subscription Types ──
        sub_count = (await session.execute(
            select(sa_func.count()).select_from(SubscriptionType)
        )).scalar() or 0

        if sub_count == 0:
            print("💳 Creating subscription plans...")
            plans = [
                SubscriptionType(name="Off-Peak Lunar", base_fee=130.00, duration_days=30),
                SubscriptionType(name="Off-Peak Anual", base_fee=1404.00, duration_days=365),
                
                SubscriptionType(name="Student Fit Lunar", base_fee=110.00, duration_days=30),
                SubscriptionType(name="Student Fit Anual", base_fee=1188.00, duration_days=365),
                
                SubscriptionType(name="Basic Lunar", base_fee=180.00, duration_days=30),
                SubscriptionType(name="Basic Anual", base_fee=1944.00, duration_days=365),
                
                SubscriptionType(name="Premium Lunar", base_fee=280.00, duration_days=30),
                SubscriptionType(name="Premium Anual", base_fee=3024.00, duration_days=365),
                
                SubscriptionType(name="VIP Lunar", base_fee=400.00, duration_days=30),
                SubscriptionType(name="VIP Anual", base_fee=4320.00, duration_days=365),
            ]
            session.add_all(plans)
            await session.commit()
            print(f"   ✅ Created {len(plans)} subscription plans.")
        else:
            print(f"   ℹ️  {sub_count} subscription plans already exist.")

        # ── 2. Facilities ──
        fac_count = (await session.execute(
            select(sa_func.count()).select_from(Facility)
        )).scalar() or 0

        if fac_count == 0:
            print("🏢 Creating facilities...")
            facilities = [
                Facility(name="Sala Principală"),
                Facility(name="Sala de Yoga"),
                Facility(name="Sala de Spinning"),
                Facility(name="Piscina"),
                Facility(name="Sala de Box"),
            ]
            session.add_all(facilities)
            await session.commit()
            print(f"   ✅ Created {len(facilities)} facilities.")
        else:
            print(f"   ℹ️  {fac_count} facilities already exist.")

        # Refresh facility IDs
        fac_result = await session.execute(select(Facility))
        facilities_map = {f.name: f.id for f in fac_result.scalars().all()}

        # ── 3. Trainers ──
        trainer_count = (await session.execute(
            select(sa_func.count()).select_from(Trainer)
        )).scalar() or 0

        if trainer_count == 0:
            print("🏋️ Creating trainers...")
            trainers = [
                Trainer(
                    name="Alexandru Ionescu",
                    specialization="Fitness & Bodybuilding",
                    bio="Certificat NSCA cu 8 ani de experiență în antrenamente de forță și hipertrofie."
                ),
                Trainer(
                    name="Maria Popescu",
                    specialization="Yoga & Pilates",
                    bio="Instructor certificat RYT-500 specializat în Vinyasa și Hatha Yoga."
                ),
                Trainer(
                    name="Andrei Dumitrescu",
                    specialization="CrossFit & HIIT",
                    bio="CrossFit Level 2 Trainer cu pasiune pentru antrenamente funcționale intense."
                ),
                Trainer(
                    name="Elena Georgescu",
                    specialization="Spinning & Cardio",
                    bio="Specialist în antrenamente cardio cu certificare internațională Schwinn."
                ),
                Trainer(
                    name="Mihai Radu",
                    specialization="Box & Kickboxing",
                    bio="Fost sportiv de performanță, acum antrenor cu 10 ani de experiență."
                ),
            ]
            session.add_all(trainers)
            await session.commit()
            print(f"   ✅ Created {len(trainers)} trainers.")
        else:
            print(f"   ℹ️  {trainer_count} trainers already exist.")

        # Refresh trainer IDs
        tr_result = await session.execute(select(Trainer))
        trainers_map = {t.name: t.id for t in tr_result.scalars().all()}

        # ── 4. Fitness Classes ──
        class_count = (await session.execute(
            select(sa_func.count()).select_from(FitnessClass)
        )).scalar() or 0

        if class_count == 0:
            print("📅 Creating fitness classes...")
            # Generate classes for the next 2 weeks
            now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            classes = []

            class_templates = [
                {
                    "name": "Full Body Workout",
                    "facility": "Sala Principală",
                    "trainer": "Alexandru Ionescu",
                    "capacity": 20,
                    "duration": 60,
                    "description": "Antrenament complet care vizează toate grupele musculare. Ideal pentru toate nivelurile.",
                    "days": [0, 2, 4],  # Mon, Wed, Fri
                    "hour": 8,
                },
                {
                    "name": "Yoga Flow",
                    "facility": "Sala de Yoga",
                    "trainer": "Maria Popescu",
                    "capacity": 15,
                    "duration": 75,
                    "description": "Secvență fluidă de asane conectate prin respirație. Perfect pentru flexibilitate și relaxare.",
                    "days": [0, 2, 4],
                    "hour": 10,
                },
                {
                    "name": "HIIT Extreme",
                    "facility": "Sala Principală",
                    "trainer": "Andrei Dumitrescu",
                    "capacity": 18,
                    "duration": 45,
                    "description": "Antrenament de mare intensitate cu intervale. Arde grăsimea și construiește rezistența.",
                    "days": [1, 3, 5],  # Tue, Thu, Sat
                    "hour": 9,
                },
                {
                    "name": "Spinning Power",
                    "facility": "Sala de Spinning",
                    "trainer": "Elena Georgescu",
                    "capacity": 25,
                    "duration": 50,
                    "description": "Sesiune intensă de spinning cu muzică energizantă și profil variat de pedalare.",
                    "days": [0, 1, 3, 4],
                    "hour": 18,
                },
                {
                    "name": "Box & Fitness",
                    "facility": "Sala de Box",
                    "trainer": "Mihai Radu",
                    "capacity": 12,
                    "duration": 60,
                    "description": "Combinație de tehnici de box cu exerciții de condiționare fizică.",
                    "days": [1, 3, 5],
                    "hour": 17,
                },
                {
                    "name": "Pilates Core",
                    "facility": "Sala de Yoga",
                    "trainer": "Maria Popescu",
                    "capacity": 15,
                    "duration": 55,
                    "description": "Exerciții focusate pe musculatura centrală, postura și stabilitate.",
                    "days": [1, 3],
                    "hour": 11,
                },
                {
                    "name": "CrossFit WOD",
                    "facility": "Sala Principală",
                    "trainer": "Andrei Dumitrescu",
                    "capacity": 16,
                    "duration": 60,
                    "description": "Workout of the Day — antrenament funcțional variat, de intensitate ridicată.",
                    "days": [0, 2, 4],
                    "hour": 17,
                },
                {
                    "name": "Aqua Fitness",
                    "facility": "Piscina",
                    "trainer": "Elena Georgescu",
                    "capacity": 20,
                    "duration": 45,
                    "description": "Antrenament în apă cu impact redus asupra articulațiilor. Excelent pentru tonifiere.",
                    "days": [2, 5],
                    "hour": 10,
                },
            ]

            for template in class_templates:
                for day_offset in range(14):  # next 2 weeks
                    date = now + timedelta(days=day_offset)
                    if date.weekday() in template["days"]:
                        scheduled = date.replace(hour=template["hour"])
                        classes.append(FitnessClass(
                            name=template["name"],
                            facility_id=facilities_map.get(template["facility"]),
                            trainer_id=trainers_map.get(template["trainer"]),
                            capacity=template["capacity"],
                            duration_minutes=template["duration"],
                            description=template["description"],
                            scheduled_at=scheduled,
                        ))

            session.add_all(classes)
            await session.commit()
            print(f"   ✅ Created {len(classes)} class sessions over 2 weeks.")
        else:
            print(f"   ℹ️  {class_count} classes already exist.")

        # ── 5. Equipment ──
        eq_count = (await session.execute(
            select(sa_func.count()).select_from(Equipment)
        )).scalar() or 0

        if eq_count == 0:
            print("🔧 Creating equipment...")
            equipments = [
                Equipment(name="Banca Plată", category="Benzi & Bănci", quantity=4, condition="good", facility_id=facilities_map.get("Sala Principală")),
                Equipment(name="Gantere Set (2-40kg)", category="Greutăți Libere", quantity=1, condition="good", facility_id=facilities_map.get("Sala Principală")),
                Equipment(name="Bicicletă Spinning", category="Cardio", quantity=25, condition="good", facility_id=facilities_map.get("Sala de Spinning")),
                Equipment(name="Bandă de Alergare", category="Cardio", quantity=8, condition="good", facility_id=facilities_map.get("Sala Principală")),
                Equipment(name="Sac de Box", category="Box", quantity=6, condition="good", facility_id=facilities_map.get("Sala de Box")),
                Equipment(name="Mănuși Box (perechi)", category="Box", quantity=12, condition="fair", facility_id=facilities_map.get("Sala de Box")),
                Equipment(name="Saltea Yoga", category="Yoga", quantity=20, condition="good", facility_id=facilities_map.get("Sala de Yoga")),
                Equipment(name="Kettlebell Set", category="Greutăți Libere", quantity=10, condition="good", facility_id=facilities_map.get("Sala Principală")),
                Equipment(name="Cabluri/Scripete", category="Aparate", quantity=3, condition="good", facility_id=facilities_map.get("Sala Principală")),
                Equipment(name="TRX Suspensie", category="Funcționale", quantity=8, condition="good", facility_id=facilities_map.get("Sala Principală")),
            ]
            session.add_all(equipments)
            await session.commit()
            print(f"   ✅ Created {len(equipments)} equipment items.")
        else:
            print(f"   ℹ️  {eq_count} equipment items already exist.")

    print("\n🎉 Seeding complete!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_data())
