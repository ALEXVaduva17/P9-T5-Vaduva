import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import engine, async_session_factory, Base
from app.models.user import User, UserRole
from app.services.auth_service import get_password_hash

async def seed_data():
    print("🚀 Starting database seeding...")
    
    # Create tables
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_factory() as session:
        # Check if admin already exists
        result = await session.execute(select(User).where(User.email == "admin@fitness.com"))
        admin = result.scalars().first()
        
        if not admin:
            print("Creating admin user...")
            new_admin = User(
                email="admin@fitness.com",
                hashed_password=get_password_hash("parola123"),
                role=UserRole.admin,
                is_active=True
            )
            session.add(new_admin)
            await session.commit()
            print("✅ Admin user created: admin@fitness.com / parola123")
        else:
            print("⚠️ Admin user already exists.")

    print("🏁 Seeding complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())
