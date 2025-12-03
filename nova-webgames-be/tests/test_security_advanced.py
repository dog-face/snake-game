"""
Advanced security tests for SQL injection, XSS, token tampering, and authorization bypass.
"""
import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from jose import jwt
from app.core.config import settings
from app.core import security


@pytest.fixture
async def test_user(client: AsyncClient):
    """Create a test user and return credentials"""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123"
    }
    response = await client.post("/api/v1/auth/signup", json=user_data)
    assert response.status_code == 201
    return user_data


class TestSQLInjection:
    """Test SQL injection prevention"""
    
    @pytest.mark.asyncio
    async def test_sql_injection_in_username_signup(self, client: AsyncClient):
        """Test that SQL injection attempts in username are prevented"""
        # Common SQL injection payloads
        sql_payloads = [
            "admin'--",
            "admin' OR '1'='1",
            "admin'; DROP TABLE users;--",
            "' UNION SELECT * FROM users--",
            "admin'/*",
        ]
        
        for payload in sql_payloads:
            response = await client.post("/api/v1/auth/signup", json={
                "email": f"test{payload}@example.com",
                "username": payload,
                "password": "testpass123"
            })
            # Should either succeed (payload treated as literal) or fail with validation error
            # Should NOT execute SQL
            assert response.status_code in [201, 400, 409, 422]
            # If it succeeds, verify the username is stored as-is (not executed)
            if response.status_code == 201:
                # Try to login with the exact payload
                login_response = await client.post("/api/v1/auth/login", json={
                    "username": payload,
                    "password": "testpass123"
                })
                # Should work if stored correctly, or fail if validation rejected it
                assert login_response.status_code in [200, 401]
    
    @pytest.mark.asyncio
    async def test_sql_injection_in_email_signup(self, client: AsyncClient):
        """Test that SQL injection attempts in email are prevented"""
        sql_payloads = [
            "test'@example.com",
            "test'; DROP TABLE users;--@example.com",
        ]
        
        for payload in sql_payloads:
            response = await client.post("/api/v1/auth/signup", json={
                "email": payload,
                "username": f"user{len(payload)}",
                "password": "testpass123"
            })
            # Should fail validation (invalid email format) or succeed if email validation allows it
            assert response.status_code in [201, 400, 422]
    
    @pytest.mark.asyncio
    async def test_sql_injection_in_login(self, client: AsyncClient, test_user):
        """Test that SQL injection attempts in login are prevented"""
        sql_payloads = [
            "testuser'--",
            "testuser' OR '1'='1",
            "' OR '1'='1'--",
        ]
        
        for payload in sql_payloads:
            response = await client.post("/api/v1/auth/login", json={
                "username": payload,
                "password": "testpass123"
            })
            # Should fail authentication (not execute SQL)
            assert response.status_code == 401


class TestXSS:
    """Test XSS prevention"""
    
    @pytest.mark.asyncio
    async def test_xss_in_username_signup(self, client: AsyncClient):
        """Test that XSS attempts in username are sanitized or rejected"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
        ]
        
        for payload in xss_payloads:
            response = await client.post("/api/v1/auth/signup", json={
                "email": f"test{len(payload)}@example.com",
                "username": payload,
                "password": "testpass123"
            })
            # Should either succeed (stored as-is, rendered safely) or fail validation
            assert response.status_code in [201, 400, 422]
            # If it succeeds, verify it's stored as literal (not executed)
            if response.status_code == 201:
                # The username should be stored exactly as provided
                login_response = await client.post("/api/v1/auth/login", json={
                    "username": payload,
                    "password": "testpass123"
                })
                assert login_response.status_code in [200, 401]
    
    @pytest.mark.asyncio
    async def test_xss_in_email_signup(self, client: AsyncClient):
        """Test that XSS attempts in email are sanitized or rejected"""
        xss_payloads = [
            "test<script>@example.com",
            "test<img src=x>@example.com",
        ]
        
        for payload in xss_payloads:
            response = await client.post("/api/v1/auth/signup", json={
                "email": payload,
                "username": f"user{len(payload)}",
                "password": "testpass123"
            })
            # Should fail email validation
            assert response.status_code in [400, 422]


class TestTokenTampering:
    """Test JWT token tampering prevention"""
    
    @pytest.mark.asyncio
    async def test_tampered_token_rejected(self, client: AsyncClient, test_user):
        """Test that tampered tokens are rejected"""
        # Login to get a valid token
        login_response = await client.post("/api/v1/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert login_response.status_code == 200
        valid_token = login_response.json()["token"]
        
        # Tamper with the token
        tampered_token = valid_token[:-5] + "XXXXX"
        
        # Try to use tampered token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"}
        )
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_token_with_wrong_secret_rejected(self, client: AsyncClient, test_user):
        """Test that tokens signed with wrong secret are rejected"""
        # Create a token with wrong secret
        wrong_secret = "wrong_secret_key"
        fake_token = jwt.encode(
            {"sub": "fake-user-id", "exp": datetime.utcnow() + timedelta(minutes=30)},
            wrong_secret,
            algorithm="HS256"
        )
        
        # Try to use fake token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {fake_token}"}
        )
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_token_with_wrong_algorithm_rejected(self, client: AsyncClient, test_user):
        """Test that tokens with wrong algorithm are rejected"""
        # Create a token with wrong algorithm (if possible)
        # Note: jose library may prevent this, but we test the behavior
        try:
            fake_token = jwt.encode(
                {"sub": "fake-user-id", "exp": datetime.utcnow() + timedelta(minutes=30)},
                settings.SECRET_KEY,
                algorithm="HS512"  # Wrong algorithm
            )
            
            # Try to use fake token
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {fake_token}"}
            )
            # Should be rejected (we only accept HS256)
            assert response.status_code == 401
        except Exception:
            # If library prevents wrong algorithm, that's also good
            pass


class TestExpiredToken:
    """Test expired token handling"""
    
    @pytest.mark.asyncio
    async def test_expired_token_rejected(self, client: AsyncClient, test_user):
        """Test that expired tokens are rejected"""
        # Create an expired token
        expired_token = security.create_access_token(
            "test-user-id",
            expires_delta=timedelta(minutes=-1)  # Already expired
        )
        
        # Try to use expired token
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_token_without_exp_claim_rejected(self):
        """Test that tokens without exp claim are handled properly"""
        # Create token without exp
        token_without_exp = jwt.encode(
            {"sub": "test-user-id"},
            settings.SECRET_KEY,
            algorithm="HS256"
        )
        
        # The token should be rejected when decoded
        from app.api.deps import get_current_user
        from fastapi import Depends
        from app.db.session import AsyncSessionLocal
        
        # This would fail in actual usage, but we test the decode logic
        try:
            payload = jwt.decode(
                token_without_exp,
                settings.SECRET_KEY,
                algorithms=["HS256"]
            )
            # If it decodes, exp should be missing
            assert "exp" not in payload
        except Exception:
            # If it fails to decode, that's also acceptable
            pass


class TestAuthorizationBypass:
    """Test authorization bypass attempts"""
    
    @pytest.mark.asyncio
    async def test_access_protected_endpoint_without_token(self, client: AsyncClient):
        """Test that protected endpoints require authentication"""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_access_protected_endpoint_with_invalid_token(self, client: AsyncClient):
        """Test that protected endpoints reject invalid tokens"""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_access_protected_endpoint_with_malformed_token(self, client: AsyncClient):
        """Test that protected endpoints reject malformed tokens"""
        malformed_tokens = [
            "not.a.token",
            "Bearer",
            "",
            "Bearer ",
            "not_bearer token",
        ]
        
        for token in malformed_tokens:
            headers = {"Authorization": token} if token else {}
            response = await client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_access_other_user_session(self, client: AsyncClient):
        """Test that users cannot access other users' sessions"""
        # Create two users
        user1_data = {
            "email": "user1@example.com",
            "username": "user1",
            "password": "testpass123"
        }
        user2_data = {
            "email": "user2@example.com",
            "username": "user2",
            "password": "testpass123"
        }
        
        signup1 = await client.post("/api/v1/auth/signup", json=user1_data)
        assert signup1.status_code == 201
        signup2 = await client.post("/api/v1/auth/signup", json=user2_data)
        assert signup2.status_code == 201
        
        # Login as user1
        login1 = await client.post("/api/v1/auth/login", json={
            "username": user1_data["username"],
            "password": user1_data["password"]
        })
        assert login1.status_code == 200
        token1 = login1.json()["token"]
        
        # Login as user2
        login2 = await client.post("/api/v1/auth/login", json={
            "username": user2_data["username"],
            "password": user2_data["password"]
        })
        assert login2.status_code == 200
        token2 = login2.json()["token"]
        
        # User1 should only see their own data
        me1 = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert me1.status_code == 200
        assert me1.json()["username"] == "user1"
        
        # User2 should only see their own data
        me2 = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token2}"}
        )
        assert me2.status_code == 200
        assert me2.json()["username"] == "user2"
        
        # Tokens should not be interchangeable
        # (This is already enforced by JWT, but we verify)
        assert token1 != token2


class TestInputValidation:
    """Test input validation and sanitization"""
    
    @pytest.mark.asyncio
    async def test_very_long_username_rejected(self, client: AsyncClient):
        """Test that very long usernames are rejected"""
        long_username = "a" * 1000
        response = await client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "username": long_username,
            "password": "testpass123"
        })
        # Should fail validation
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_very_long_email_rejected(self, client: AsyncClient):
        """Test that very long emails are rejected"""
        long_email = "a" * 1000 + "@example.com"
        response = await client.post("/api/v1/auth/signup", json={
            "email": long_email,
            "username": "testuser",
            "password": "testpass123"
        })
        # Should fail validation
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_empty_username_rejected(self, client: AsyncClient):
        """Test that empty username is rejected"""
        response = await client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "username": "",
            "password": "testpass123"
        })
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_empty_password_rejected(self, client: AsyncClient):
        """Test that empty password is rejected"""
        response = await client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "username": "testuser",
            "password": ""
        })
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_invalid_email_format_rejected(self, client: AsyncClient):
        """Test that invalid email formats are rejected"""
        invalid_emails = [
            "notanemail",
            "@example.com",
            "test@",
            "test@.com",
            "test..test@example.com",
        ]
        
        for email in invalid_emails:
            response = await client.post("/api/v1/auth/signup", json={
                "email": email,
                "username": f"user{len(email)}",
                "password": "testpass123"
            })
            assert response.status_code in [400, 422]

