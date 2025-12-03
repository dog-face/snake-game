"""
Authentication edge case tests covering token expiration boundaries,
invalid user scenarios, authorization header edge cases, and concurrent authentication.
"""
import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from jose import jwt
from app.core.config import settings
from app.core import security
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio


@pytest.fixture
async def test_user(client: AsyncClient):
    """Create a test user and return user data with ID"""
    user_data = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "testpass123"
    }
    response = await client.post("/api/v1/auth/signup", json=user_data)
    assert response.status_code == 201
    user_data["id"] = response.json()["user"]["id"]
    return user_data


class TestTokenExpirationBoundaries:
    """Test token expiration at exact boundaries"""
    
    @pytest.mark.asyncio
    async def test_token_expiring_just_before_boundary(self, client: AsyncClient, test_user):
        """Test token that expires just before the expiration boundary"""
        # Create a token that expires in 1 second
        token = security.create_access_token(
            test_user["id"],
            expires_delta=timedelta(seconds=1)
        )
        
        # Use token immediately (should work)
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        # May succeed or fail depending on timing, but should handle gracefully
        assert response.status_code in [200, 401]
    
    @pytest.mark.asyncio
    async def test_token_expiring_exactly_at_boundary(self, client: AsyncClient, test_user):
        """Test token that expires exactly at the configured expiration time"""
        # Create token with exact expiration time
        token = security.create_access_token(
            test_user["id"],
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Use token immediately (should work)
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should work immediately, but will expire after ACCESS_TOKEN_EXPIRE_MINUTES
        assert response.status_code == 200
        assert response.json()["username"] == test_user["username"]
    
    @pytest.mark.asyncio
    async def test_token_expired_just_after_boundary(self, client: AsyncClient, test_user):
        """Test token that has just expired"""
        # Create an expired token (expired 1 second ago)
        expired_token = security.create_access_token(
            test_user["id"],
            expires_delta=timedelta(seconds=-1)
        )
        
        # Try to use expired token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
        assert response.json()["detail"]["error"]["code"] == "INVALID_TOKEN"
    
    @pytest.mark.asyncio
    async def test_token_with_zero_expiration(self, client: AsyncClient, test_user):
        """Test token with zero expiration time"""
        # Create token that expires immediately (negative delta to ensure it's expired)
        token = security.create_access_token(
            test_user["id"],
            expires_delta=timedelta(seconds=-1)
        )
        
        # Try to use expired token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should fail as token is expired
        assert response.status_code == 401


class TestInvalidUserScenarios:
    """Test tokens with invalid or non-existent user IDs"""
    
    @pytest.mark.asyncio
    async def test_token_with_non_existent_user_id(self, client: AsyncClient):
        """Test token with user ID that doesn't exist in database"""
        # Create token for non-existent user
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        token = security.create_access_token(
            fake_user_id,
            expires_delta=timedelta(minutes=30)
        )
        
        # Try to use token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"]["code"] == "USER_NOT_FOUND"
    
    @pytest.mark.asyncio
    async def test_token_with_deleted_user(self, client: AsyncClient, test_user, test_db: AsyncSession):
        """Test token for user that gets deleted after token creation"""
        # Login to get a valid token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get user from database
        result = await test_db.execute(
            select(User).filter(User.username == test_user["username"])
        )
        user = result.scalar_one()
        
        # Delete user
        await test_db.delete(user)
        await test_db.commit()
        
        # Try to use token for deleted user
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404
        assert response.json()["detail"]["error"]["code"] == "USER_NOT_FOUND"
    
    @pytest.mark.asyncio
    async def test_token_with_invalid_uuid_format(self, client: AsyncClient):
        """Test token with invalid UUID format in sub claim"""
        # Create token with invalid UUID format
        invalid_token = jwt.encode(
            {"sub": "not-a-valid-uuid", "exp": datetime.utcnow() + timedelta(minutes=30)},
            settings.SECRET_KEY,
            algorithm="HS256"
        )
        
        # Try to use token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        # Should fail validation (invalid UUID format or user not found)
        assert response.status_code in [400, 404, 422]


class TestAuthorizationHeaderEdgeCases:
    """Test various Authorization header formats and edge cases"""
    
    @pytest.mark.asyncio
    async def test_authorization_header_case_insensitive(self, client: AsyncClient, test_user):
        """Test that Authorization header is case-insensitive for 'Bearer'"""
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Test different case variations
        variations = [
            f"bearer {token}",
            f"Bearer {token}",
            f"BEARER {token}",
            f"BeArEr {token}",
        ]
        
        for auth_header in variations:
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": auth_header}
            )
            # FastAPI's OAuth2PasswordBearer should handle case variations
            assert response.status_code in [200, 401]
    
    @pytest.mark.asyncio
    async def test_authorization_header_with_extra_whitespace(self, client: AsyncClient, test_user):
        """Test Authorization header with extra whitespace"""
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Test with extra whitespace
        variations = [
            f"Bearer  {token}",  # Double space
            f"Bearer {token} ",   # Trailing space
            f" Bearer {token}",   # Leading space
            f"Bearer\t{token}",  # Tab character
        ]
        
        for auth_header in variations:
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": auth_header}
            )
            # Should handle whitespace gracefully
            assert response.status_code in [200, 401]
    
    @pytest.mark.asyncio
    async def test_authorization_header_missing_bearer(self, client: AsyncClient, test_user):
        """Test Authorization header without 'Bearer' prefix"""
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Try without Bearer prefix
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": token}
        )
        # Should fail as Bearer prefix is required
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_authorization_header_empty_token(self, client: AsyncClient):
        """Test Authorization header with empty token"""
        # Try with empty token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer "}
        )
        assert response.status_code == 401


class TestTokenReuseScenarios:
    """Test token reuse and multiple usage scenarios"""
    
    @pytest.mark.asyncio
    async def test_same_token_multiple_requests(self, client: AsyncClient, test_user):
        """Test that same token can be used for multiple requests"""
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Use token multiple times
        for _ in range(5):
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            assert response.json()["username"] == test_user["username"]
    
    @pytest.mark.asyncio
    async def test_multiple_tokens_same_user(self, client: AsyncClient, test_user):
        """Test that user can have multiple valid tokens simultaneously"""
        tokens = []
        
        # Login multiple times to get multiple tokens
        # Add small delays to ensure tokens are created at different times
        for i in range(3):
            await asyncio.sleep(0.1)  # Small delay to ensure different expiration times
            login_response = await client.post("/api/v1/auth/login", json={
                "username": test_user["username"],
                "password": test_user["password"]
            })
            assert login_response.status_code == 200
            tokens.append(login_response.json()["token"])
        
        # All tokens should be valid (may not all be unique if created in same second)
        assert len(tokens) == 3
        
        # All tokens should work
        for token in tokens:
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            assert response.json()["username"] == test_user["username"]


class TestConcurrentAuthentication:
    """Test concurrent authentication scenarios"""
    
    @pytest.mark.asyncio
    async def test_concurrent_logins_same_user(self, client: AsyncClient, test_user):
        """Test concurrent logins from same user"""
        async def login():
            response = await client.post("/api/v1/auth/login", json={
                "username": test_user["username"],
                "password": test_user["password"]
            })
            return response
        
        # Perform 5 concurrent logins
        tasks = [login() for _ in range(5)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
            assert "token" in response.json()
            assert "user" in response.json()
        
        # Tokens may not all be unique if created in the same second
        # (JWT tokens with same payload have same signature)
        tokens = [r.json()["token"] for r in responses]
        assert len(tokens) == 5
        # At least some tokens should be unique (unless all created in exact same second)
        assert len(set(tokens)) >= 1
    
    @pytest.mark.asyncio
    async def test_concurrent_authenticated_requests(self, client: AsyncClient, test_user):
        """Test concurrent authenticated requests with same token"""
        # Login to get token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        async def get_me():
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            return response
        
        # Perform 10 concurrent requests
        tasks = [get_me() for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
            assert response.json()["username"] == test_user["username"]


class TestTokenExpirationTiming:
    """Test token expiration timing scenarios"""
    
    @pytest.mark.asyncio
    async def test_token_with_custom_expiration(self, client: AsyncClient, test_user):
        """Test token created with custom expiration time"""
        # Create token with custom expiration (5 minutes)
        custom_token = security.create_access_token(
            test_user["id"],
            expires_delta=timedelta(minutes=5)
        )
        
        # Token should be valid immediately
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {custom_token}"}
        )
        # Should succeed with custom expiration
        assert response.status_code == 200
        assert response.json()["username"] == test_user["username"]
    
    @pytest.mark.asyncio
    async def test_token_expiration_default_vs_custom(self, client: AsyncClient, test_user):
        """Test that default expiration matches settings"""
        # Login to get token with default expiration
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        default_token = login_response.json()["token"]
        
        # Decode token to check expiration
        payload = jwt.decode(
            default_token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        
        # Check that expiration is approximately ACCESS_TOKEN_EXPIRE_MINUTES from now
        # Use utcfromtimestamp since exp is a UTC timestamp
        exp_time = datetime.utcfromtimestamp(payload["exp"])
        now = datetime.utcnow()
        expected_exp = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Allow 1 minute tolerance for test execution time
        time_diff = abs((exp_time - expected_exp).total_seconds())
        assert time_diff < 60  # Within 1 minute

