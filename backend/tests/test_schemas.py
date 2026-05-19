import pytest
import sys
import os
from pydantic import ValidationError
from datetime import datetime, date
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.member import MemberCreate, MemberUpdate, MemberResponse
from app.schemas.subscription import SubscriptionCreate, SubscriptionTypeCreate
from app.schemas.facility import FacilityCreate, FacilityUpdate
from app.schemas.auth import Token, TokenData, UserResponse
from app.models.user import UserRole


def test_member_create_valid():
    """Test 1: Valid MemberCreate schema initialization."""
    member_data = {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "0712345678",
        "email": "john.doe@example.com"
    }
    member = MemberCreate(**member_data)
    assert member.first_name == "John"
    assert member.email == "john.doe@example.com"


def test_member_create_invalid_email():
    """Test 2: MemberCreate fails with invalid email."""
    member_data = {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "0712345678",
        "email": "not-an-email"
    }
    with pytest.raises(ValidationError) as exc_info:
        MemberCreate(**member_data)
    assert "value is not a valid email address" in str(exc_info.value).lower()


def test_member_update_partial():
    """Test 3: MemberUpdate allows partial updates."""
    update_data = {"first_name": "Jane"}
    update_schema = MemberUpdate(**update_data)
    assert update_schema.first_name == "Jane"
    assert update_schema.last_name is None


def test_subscription_type_create_valid():
    """Test 4: Valid SubscriptionTypeCreate schema."""
    data = {
        "name": "Premium",
        "base_fee": Decimal("150.00"),
        "duration_days": 30,
        "description": "Premium access",
        "is_active": True
    }
    sub_type = SubscriptionTypeCreate(**data)
    assert sub_type.name == "Premium"
    assert sub_type.base_fee == Decimal("150.00")


def test_subscription_type_create_default_values():
    """Test 5: SubscriptionTypeCreate uses correct defaults."""
    data = {
        "name": "Standard",
        "base_fee": Decimal("100.00")
    }
    sub_type = SubscriptionTypeCreate(**data)
    assert sub_type.duration_days == 30
    assert sub_type.is_active is True
    assert sub_type.description is None


def test_subscription_type_create_invalid_fee():
    """Test 6: SubscriptionTypeCreate fails with invalid base_fee."""
    data = {
        "name": "Standard",
        "base_fee": "not-a-number"
    }
    with pytest.raises(ValidationError):
        SubscriptionTypeCreate(**data)


def test_subscription_create_valid_positive_sessions():
    """Test 7: SubscriptionCreate valid with positive pt_sessions."""
    data = {
        "member_id": 1,
        "type_id": 2,
        "pt_sessions": 5
    }
    sub = SubscriptionCreate(**data)
    assert sub.pt_sessions == 5


def test_subscription_create_valid_zero_sessions():
    """Test 8: SubscriptionCreate valid with zero pt_sessions."""
    data = {
        "member_id": 1,
        "type_id": 2,
        "pt_sessions": 0
    }
    sub = SubscriptionCreate(**data)
    assert sub.pt_sessions == 0


def test_subscription_create_invalid_negative_sessions():
    """Test 9: SubscriptionCreate fails with negative pt_sessions."""
    data = {
        "member_id": 1,
        "type_id": 2,
        "pt_sessions": -1
    }
    with pytest.raises(ValidationError) as exc_info:
        SubscriptionCreate(**data)
    assert "pt_sessions must be >= 0" in str(exc_info.value)


def test_facility_create_valid():
    """Test 10: FacilityCreate schema initialization."""
    data = {"name": "Main Gym"}
    facility = FacilityCreate(**data)
    assert facility.name == "Main Gym"


def test_facility_update_valid():
    """Test 11: FacilityUpdate schema initialization."""
    data = {"name": "Updated Gym Name"}
    facility = FacilityUpdate(**data)
    assert facility.name == "Updated Gym Name"


def test_token_valid():
    """Test 12: Token schema initialization."""
    data = {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "token_type": "bearer"
    }
    token = Token(**data)
    assert token.access_token == "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    assert token.token_type == "bearer"


def test_token_data_optional():
    """Test 13: TokenData schema allows optional fields."""
    token_data = TokenData(email="admin@test.local")
    assert token_data.email == "admin@test.local"
    assert token_data.role is None


def test_user_response_valid():
    """Test 14: UserResponse valid schema with UserRole enum."""
    data = {
        "id": 1,
        "email": "user@example.com",
        "role": UserRole.admin,
        "is_active": True,
        "is_locked": False
    }
    user = UserResponse(**data)
    assert user.id == 1
    assert user.email == "user@example.com"
    assert user.role == UserRole.admin


def test_user_response_invalid_email():
    """Test 15: UserResponse fails with invalid email."""
    data = {
        "id": 1,
        "email": "invalid-email",
        "role": UserRole.member,
        "is_active": True,
        "is_locked": False
    }
    with pytest.raises(ValidationError) as exc_info:
        UserResponse(**data)
    assert "value is not a valid email address" in str(exc_info.value).lower()
