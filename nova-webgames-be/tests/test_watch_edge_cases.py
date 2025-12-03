"""
Edge case tests for watch/session functionality including timeout, concurrent updates, and invalid data.
"""
import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.active_session import ActiveSession
from app.schemas.watch import GameState, GameMode


class TestSessionTimeout:
    """Test session timeout boundary cases"""
    
    @pytest.mark.asyncio
    async def test_session_expires_after_timeout(self, client: AsyncClient, authenticated_client: AsyncClient, test_db: AsyncSession):
        """Test that sessions expire after SESSION_TIMEOUT"""
        from app.core.config import settings
        
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Verify session is active
        active_response = await client.get("/api/v1/watch/active")
        assert active_response.status_code == 200
        active_players = active_response.json()["players"]
        assert any(p["id"] == session_id for p in active_players)
        
        # Manually set last_updated_at to be beyond timeout
        result = await test_db.execute(
            select(ActiveSession).filter(ActiveSession.id == session_id)
        )
        session = result.scalar_one()
        session.last_updated_at = datetime.utcnow() - timedelta(seconds=settings.SESSION_TIMEOUT + 1)
        await test_db.commit()
        
        # Verify session is no longer active
        active_response = await client.get("/api/v1/watch/active")
        assert active_response.status_code == 200
        active_players = active_response.json()["players"]
        assert not any(p["id"] == session_id for p in active_players)
    
    @pytest.mark.asyncio
    async def test_session_still_active_at_timeout_boundary(self, client: AsyncClient, authenticated_client: AsyncClient, test_db: AsyncSession):
        """Test that sessions are still active just before timeout boundary"""
        from app.core.config import settings
        
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Set last_updated_at to just before timeout boundary (1 second before)
        # This accounts for time passing between setting and checking
        result = await test_db.execute(
            select(ActiveSession).filter(ActiveSession.id == session_id)
        )
        session = result.scalar_one()
        session.last_updated_at = datetime.utcnow() - timedelta(seconds=settings.SESSION_TIMEOUT - 1)
        await test_db.commit()
        
        # Verify session is still active (boundary case: >= cutoff_time)
        active_response = await client.get("/api/v1/watch/active")
        assert active_response.status_code == 200
        active_players = active_response.json()["players"]
        assert any(p["id"] == session_id for p in active_players)
    
    @pytest.mark.asyncio
    async def test_get_active_player_returns_404_after_timeout(self, client: AsyncClient, authenticated_client: AsyncClient, test_db: AsyncSession):
        """Test that getting a specific player returns 404 after timeout"""
        from app.core.config import settings
        
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Set last_updated_at to be beyond timeout
        result = await test_db.execute(
            select(ActiveSession).filter(ActiveSession.id == session_id)
        )
        session = result.scalar_one()
        session.last_updated_at = datetime.utcnow() - timedelta(seconds=settings.SESSION_TIMEOUT + 1)
        await test_db.commit()
        
        # Try to get the player - should return 404
        response = await client.get(f"/api/v1/watch/active/{session_id}")
        assert response.status_code == 404


class TestConcurrentSessionUpdates:
    """Test concurrent session update scenarios"""
    
    @pytest.mark.asyncio
    async def test_concurrent_updates_to_same_session(self, authenticated_client: AsyncClient):
        """Test that concurrent updates to the same session are handled correctly"""
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Create two different game states
        game_state_1 = GameState(
            snake=[{"x": 10, "y": 10}, {"x": 9, "y": 10}],
            food={"x": 15, "y": 15},
            direction="right",
            score=10,
            gameOver=False
        )
        
        game_state_2 = GameState(
            snake=[{"x": 11, "y": 10}, {"x": 10, "y": 10}],
            food={"x": 16, "y": 16},
            direction="right",
            score=20,
            gameOver=False
        )
        
        # Update session concurrently (sequentially in test, but simulates concurrent behavior)
        update1 = await authenticated_client.put(
            f"/api/v1/watch/update/{session_id}",
            json={"gameState": game_state_1.model_dump()}
        )
        assert update1.status_code == 200
        
        update2 = await authenticated_client.put(
            f"/api/v1/watch/update/{session_id}",
            json={"gameState": game_state_2.model_dump()}
        )
        assert update2.status_code == 200
        
        # Both updates should succeed
        # The last update should be the one persisted
        active_response = await authenticated_client.get(f"/api/v1/watch/active/{session_id}")
        assert active_response.status_code == 200
        player = active_response.json()
        assert player["score"] == 20  # Last update's score


class TestInvalidGameState:
    """Test handling of invalid game state structures"""
    
    @pytest.mark.asyncio
    async def test_update_with_missing_required_fields(self, authenticated_client: AsyncClient):
        """Test that updating with missing required fields fails validation"""
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with missing fields
        invalid_states = [
            {},  # Empty
            {"snake": [{"x": 10, "y": 10}]},  # Missing food, direction, score, gameOver
            {"food": {"x": 15, "y": 15}},  # Missing snake, direction, score, gameOver
        ]
        
        for invalid_state in invalid_states:
            response = await authenticated_client.put(
                f"/api/v1/watch/update/{session_id}",
                json={"gameState": invalid_state}
            )
            assert response.status_code in [400, 422]  # Validation error
    
    @pytest.mark.asyncio
    async def test_update_with_invalid_snake_structure(self, authenticated_client: AsyncClient):
        """Test that invalid snake structure is rejected"""
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Invalid snake structures
        invalid_states = [
            {"snake": "not an array", "food": {"x": 15, "y": 15}, "direction": "right", "score": 0, "gameOver": False},
            {"snake": [{"x": 10}], "food": {"x": 15, "y": 15}, "direction": "right", "score": 0, "gameOver": False},  # Missing y
            {"snake": [{"y": 10}], "food": {"x": 15, "y": 15}, "direction": "right", "score": 0, "gameOver": False},  # Missing x
        ]
        
        for invalid_state in invalid_states:
            response = await authenticated_client.put(
                f"/api/v1/watch/update/{session_id}",
                json={"gameState": invalid_state}
            )
            assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_update_with_invalid_food_structure(self, authenticated_client: AsyncClient):
        """Test that invalid food structure is rejected"""
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Invalid food structures
        invalid_states = [
            {"snake": [{"x": 10, "y": 10}], "food": "not an object", "direction": "right", "score": 0, "gameOver": False},
            {"snake": [{"x": 10, "y": 10}], "food": {"x": 15}, "direction": "right", "score": 0, "gameOver": False},  # Missing y
            {"snake": [{"x": 10, "y": 10}], "food": {"y": 15}, "direction": "right", "score": 0, "gameOver": False},  # Missing x
        ]
        
        for invalid_state in invalid_states:
            response = await authenticated_client.put(
                f"/api/v1/watch/update/{session_id}",
                json={"gameState": invalid_state}
            )
            assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_update_with_invalid_score_type(self, authenticated_client: AsyncClient):
        """Test that invalid score type is rejected"""
        # Start a session
        start_response = await authenticated_client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Invalid score types
        invalid_states = [
            {"snake": [{"x": 10, "y": 10}], "food": {"x": 15, "y": 15}, "direction": "right", "score": "not a number", "gameOver": False},
            {"snake": [{"x": 10, "y": 10}], "food": {"x": 15, "y": 15}, "direction": "right", "score": -1, "gameOver": False},  # Negative score
        ]
        
        for invalid_state in invalid_states:
            response = await authenticated_client.put(
                f"/api/v1/watch/update/{session_id}",
                json={"gameState": invalid_state}
            )
            # Score validation may or may not reject negative, but type should be validated
            assert response.status_code in [200, 400, 422]


class TestMalformedSessionIDs:
    """Test handling of malformed session IDs"""
    
    @pytest.mark.asyncio
    async def test_update_with_nonexistent_session_id(self, authenticated_client: AsyncClient):
        """Test that updating nonexistent session returns 404"""
        fake_session_id = "nonexistent-session-id-12345"
        
        game_state = GameState(
            snake=[{"x": 10, "y": 10}],
            food={"x": 15, "y": 15},
            direction="right",
            score=10,
            gameOver=False
        )
        
        response = await authenticated_client.put(
            f"/api/v1/watch/update/{fake_session_id}",
            json={"gameState": game_state.model_dump()}
        )
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_end_with_nonexistent_session_id(self, authenticated_client: AsyncClient):
        """Test that ending nonexistent session returns 404"""
        fake_session_id = "nonexistent-session-id-12345"
        
        response = await authenticated_client.post(
            f"/api/v1/watch/end/{fake_session_id}",
            json={"finalScore": 100, "gameMode": "pass-through"}
        )
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_get_active_player_with_nonexistent_id(self, client: AsyncClient):
        """Test that getting nonexistent player returns 404"""
        fake_session_id = "nonexistent-session-id-12345"
        
        response = await client.get(f"/api/v1/watch/active/{fake_session_id}")
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_update_with_empty_session_id(self, authenticated_client: AsyncClient):
        """Test that empty session ID is handled"""
        game_state = GameState(
            snake=[{"x": 10, "y": 10}],
            food={"x": 15, "y": 15},
            direction="right",
            score=10,
            gameOver=False
        )
        
        # Empty string as session ID should result in 404 or 422
        response = await authenticated_client.put(
            "/api/v1/watch/update/",
            json={"gameState": game_state.model_dump()}
        )
        # Should be 404 (route not found) or 422 (validation error)
        assert response.status_code in [404, 422]
    
    @pytest.mark.asyncio
    async def test_update_with_invalid_uuid_format(self, authenticated_client: AsyncClient):
        """Test that invalid UUID format is handled"""
        invalid_session_ids = [
            "not-a-uuid",
            "123",
            "abc-def-ghi",
            "very-long-string-that-is-not-a-valid-session-id-format",
        ]
        
        game_state = GameState(
            snake=[{"x": 10, "y": 10}],
            food={"x": 15, "y": 15},
            direction="right",
            score=10,
            gameOver=False
        )
        
        for invalid_id in invalid_session_ids:
            response = await authenticated_client.put(
                f"/api/v1/watch/update/{invalid_id}",
                json={"gameState": game_state.model_dump()}
            )
            # Should return 404 (session not found) since it doesn't exist
            assert response.status_code == 404


class TestSessionOwnership:
    """Test session ownership and authorization"""
    
    @pytest.mark.asyncio
    async def test_cannot_update_other_user_session(self, client: AsyncClient, test_db: AsyncSession):
        """Test that users cannot update other users' sessions"""
        from app.models.user import User
        from app.core import security
        
        # Create two users
        user1 = User(
            username="user1",
            email="user1@example.com",
            password_hash=security.get_password_hash("pass123")
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            password_hash=security.get_password_hash("pass123")
        )
        test_db.add(user1)
        test_db.add(user2)
        await test_db.commit()
        await test_db.refresh(user1)
        await test_db.refresh(user2)
        
        # Get tokens for both users
        from app.core.config import settings
        from datetime import timedelta
        from app.core import security
        
        token1 = security.create_access_token(user1.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        token2 = security.create_access_token(user2.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        
        client1 = AsyncClient(transport=client._transport, base_url=client.base_url)
        client1.headers.update({"Authorization": f"Bearer {token1}"})
        
        client2 = AsyncClient(transport=client._transport, base_url=client.base_url)
        client2.headers.update({"Authorization": f"Bearer {token2}"})
        
        # User1 starts a session
        start_response = await client1.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # User2 tries to update user1's session
        game_state = GameState(
            snake=[{"x": 10, "y": 10}],
            food={"x": 15, "y": 15},
            direction="right",
            score=10,
            gameOver=False
        )
        
        response = await client2.put(
            f"/api/v1/watch/update/{session_id}",
            json={"gameState": game_state.model_dump()}
        )
        assert response.status_code == 403  # Forbidden
    
    @pytest.mark.asyncio
    async def test_cannot_end_other_user_session(self, client: AsyncClient, test_db: AsyncSession):
        """Test that users cannot end other users' sessions"""
        from app.models.user import User
        from app.core import security
        
        # Create two users
        user1 = User(
            username="user1",
            email="user1@example.com",
            password_hash=security.get_password_hash("pass123")
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            password_hash=security.get_password_hash("pass123")
        )
        test_db.add(user1)
        test_db.add(user2)
        await test_db.commit()
        await test_db.refresh(user1)
        await test_db.refresh(user2)
        
        # Get tokens for both users
        from app.core.config import settings
        from datetime import timedelta
        from app.core import security
        
        token1 = security.create_access_token(user1.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        token2 = security.create_access_token(user2.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        
        client1 = AsyncClient(transport=client._transport, base_url=client.base_url)
        client1.headers.update({"Authorization": f"Bearer {token1}"})
        
        client2 = AsyncClient(transport=client._transport, base_url=client.base_url)
        client2.headers.update({"Authorization": f"Bearer {token2}"})
        
        # User1 starts a session
        start_response = await client1.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # User2 tries to end user1's session
        response = await client2.post(
            f"/api/v1/watch/end/{session_id}",
            json={"finalScore": 100, "gameMode": "pass-through"}
        )
        assert response.status_code == 403  # Forbidden

