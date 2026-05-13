"""
Mock authentication dependencies.

These are TEMPORARY stubs that simulate the auth system
(which is being developed on a separate branch: feature/auth).
They will be replaced with real JWT-based auth once that branch is merged.
"""


async def get_current_user():
    """Return a mock admin user — simulates a logged-in admin."""
    return {"id": 1, "email": "mock@test.com", "role": "admin"}


async def require_admin():
    """Return a mock admin user — simulates admin-level authorization."""
    return await get_current_user()
