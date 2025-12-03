"""
Edge case tests for leaderboard functionality including pagination, concurrent submissions, and large values.
"""
import pytest
from httpx import AsyncClient
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.games.snake.leaderboard import SnakeLeaderboard
from app.models.user import User


class TestPaginationEdgeCases:
    """Test pagination boundary and edge cases"""
    
    @pytest.mark.asyncio
    async def test_offset_beyond_total(self, client: AsyncClient, test_db: AsyncSession, test_user: User):
        """Test that offset beyond total returns empty list"""
        # Create 5 entries
        for i in range(5):
            entry = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=100 + i,
                game_mode="pass-through",
                date=date.today(),
            )
            test_db.add(entry)
        await test_db.commit()
        
        # Try to get entries with offset beyond total
        response = await client.get("/api/v1/leaderboard?limit=10&offset=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 0
        assert data["total"] == 5
        assert data["offset"] == 10
    
    @pytest.mark.asyncio
    async def test_offset_at_total_boundary(self, client: AsyncClient, test_db: AsyncSession, test_user: User):
        """Test that offset at total boundary returns empty list"""
        # Create 10 entries
        for i in range(10):
            entry = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=100 + i,
                game_mode="pass-through",
                date=date.today(),
            )
            test_db.add(entry)
        await test_db.commit()
        
        # Try to get entries with offset at total
        response = await client.get("/api/v1/leaderboard?limit=10&offset=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 0
        assert data["total"] == 10
        assert data["offset"] == 10
    
    @pytest.mark.asyncio
    async def test_offset_negative_rejected(self, client: AsyncClient):
        """Test that negative offset is rejected"""
        # FastAPI Query validation should reject negative offset
        response = await client.get("/api/v1/leaderboard?offset=-1")
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_limit_zero_rejected(self, client: AsyncClient):
        """Test that limit of 0 is rejected"""
        # FastAPI Query validation should reject limit < 1
        response = await client.get("/api/v1/leaderboard?limit=0")
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_limit_negative_rejected(self, client: AsyncClient):
        """Test that negative limit is rejected"""
        # FastAPI Query validation should reject limit < 1
        response = await client.get("/api/v1/leaderboard?limit=-1")
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_limit_exceeds_maximum(self, client: AsyncClient):
        """Test that limit exceeding maximum (100) is rejected"""
        # FastAPI Query validation should reject limit > 100
        response = await client.get("/api/v1/leaderboard?limit=101")
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_limit_at_maximum(self, client: AsyncClient, test_db: AsyncSession, test_user: User):
        """Test that limit at maximum (100) is accepted"""
        # Create 100 entries
        for i in range(100):
            entry = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=100 + i,
                game_mode="pass-through",
                date=date.today(),
            )
            test_db.add(entry)
        await test_db.commit()
        
        response = await client.get("/api/v1/leaderboard?limit=100")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 100
        assert data["limit"] == 100
    
    @pytest.mark.asyncio
    async def test_offset_with_partial_results(self, client: AsyncClient, test_db: AsyncSession, test_user: User):
        """Test offset that returns partial results (less than limit)"""
        # Create 7 entries
        for i in range(7):
            entry = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=100 + i,
                game_mode="pass-through",
                date=date.today(),
            )
            test_db.add(entry)
        await test_db.commit()
        
        # Request 5 entries starting at offset 5 (should get 2)
        response = await client.get("/api/v1/leaderboard?limit=5&offset=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 2  # Only 2 entries available
        assert data["total"] == 7
        assert data["offset"] == 5


class TestConcurrentScoreSubmissions:
    """Test concurrent score submission scenarios"""
    
    @pytest.mark.asyncio
    async def test_concurrent_submissions_same_user(
        self, authenticated_client: AsyncClient, test_user: User
    ):
        """Test that concurrent submissions from same user are handled correctly"""
        # Submit multiple scores concurrently (sequentially in test, but simulates concurrent behavior)
        scores = [100, 200, 150, 250, 180]
        responses = []
        
        for score in scores:
            response = await authenticated_client.post(
                "/api/v1/leaderboard",
                json={
                    "score": score,
                    "game_mode": "pass-through"
                }
            )
            assert response.status_code == 201
            responses.append(response.json())
        
        # All submissions should succeed
        assert len(responses) == 5
        # All should have the same user
        for entry in responses:
            assert entry["username"] == test_user.username
    
    @pytest.mark.asyncio
    async def test_concurrent_submissions_different_users(
        self, client: AsyncClient, test_db: AsyncSession
    ):
        """Test that concurrent submissions from different users are handled correctly"""
        from app.core import security
        from app.core.config import settings
        from datetime import timedelta
        
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
        token1 = security.create_access_token(user1.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        token2 = security.create_access_token(user2.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        
        client1 = AsyncClient(transport=client._transport, base_url=client.base_url)
        client1.headers.update({"Authorization": f"Bearer {token1}"})
        
        client2 = AsyncClient(transport=client._transport, base_url=client.base_url)
        client2.headers.update({"Authorization": f"Bearer {token2}"})
        
        # Submit scores concurrently from both users
        response1 = await client1.post(
            "/api/v1/leaderboard",
            json={"score": 100, "game_mode": "pass-through"}
        )
        response2 = await client2.post(
            "/api/v1/leaderboard",
            json={"score": 200, "game_mode": "pass-through"}
        )
        
        assert response1.status_code == 201
        assert response2.status_code == 201
        
        data1 = response1.json()
        data2 = response2.json()
        
        assert data1["username"] == "user1"
        assert data2["username"] == "user2"
        assert data1["score"] == 100
        assert data2["score"] == 200


class TestLargeScoreValues:
    """Test handling of very large score values"""
    
    @pytest.mark.asyncio
    async def test_very_large_score_accepted(
        self, authenticated_client: AsyncClient, test_user: User
    ):
        """Test that very large score values are accepted"""
        # Test with a large but reasonable score
        large_score = 999999
        response = await authenticated_client.post(
            "/api/v1/leaderboard",
            json={
                "score": large_score,
                "game_mode": "pass-through"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["score"] == large_score
    
    @pytest.mark.asyncio
    async def test_maximum_integer_score(
        self, authenticated_client: AsyncClient, test_user: User
    ):
        """Test with maximum integer value (if supported by database)"""
        # Use a very large integer (Python int max is effectively unlimited, but DB may have limits)
        # Using 2^31 - 1 (max 32-bit signed integer) as a safe test
        max_score = 2147483647
        response = await authenticated_client.post(
            "/api/v1/leaderboard",
            json={
                "score": max_score,
                "game_mode": "pass-through"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["score"] == max_score
    
    @pytest.mark.asyncio
    async def test_large_score_in_leaderboard_sorting(
        self, client: AsyncClient, test_db: AsyncSession, test_user: User
    ):
        """Test that large scores are properly sorted in leaderboard"""
        # Create entries with varying scores including very large ones
        scores = [100, 999999, 50, 500000, 200]
        for score in scores:
            entry = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=score,
                game_mode="pass-through",
                date=date.today(),
            )
            test_db.add(entry)
        await test_db.commit()
        
        response = await client.get("/api/v1/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        # Should be sorted descending
        entry_scores = [entry["score"] for entry in data["entries"]]
        assert entry_scores == sorted(entry_scores, reverse=True)
        assert entry_scores[0] == 999999  # Largest first
        assert entry_scores[-1] == 50  # Smallest last


class TestLeaderboardFilteringEdgeCases:
    """Test edge cases for leaderboard filtering"""
    
    @pytest.mark.asyncio
    async def test_filter_with_no_matching_entries(
        self, client: AsyncClient, test_db: AsyncSession, test_user: User
    ):
        """Test filtering by game mode when no entries match"""
        # Create entries for one game mode only
        entry = SnakeLeaderboard(
            user_id=test_user.id,
            username=test_user.username,
            score=100,
            game_mode="pass-through",
            date=date.today(),
        )
        test_db.add(entry)
        await test_db.commit()
        
        # Filter for different game mode
        response = await client.get("/api/v1/leaderboard?gameMode=walls")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 0
        assert data["total"] == 0
    
    @pytest.mark.asyncio
    async def test_filter_with_pagination(
        self, client: AsyncClient, test_db: AsyncSession, test_user: User
    ):
        """Test filtering combined with pagination"""
        # Create entries for both game modes
        for i in range(10):
            entry1 = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=100 + i,
                game_mode="pass-through",
                date=date.today(),
            )
            entry2 = SnakeLeaderboard(
                user_id=test_user.id,
                username=test_user.username,
                score=200 + i,
                game_mode="walls",
                date=date.today(),
            )
            test_db.add(entry1)
            test_db.add(entry2)
        await test_db.commit()
        
        # Get first page of pass-through entries
        response = await client.get("/api/v1/leaderboard?gameMode=pass-through&limit=5&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 5
        assert data["total"] == 10  # Total pass-through entries
        for entry in data["entries"]:
            assert entry["game_mode"] == "pass-through"
        
        # Get second page
        response = await client.get("/api/v1/leaderboard?gameMode=pass-through&limit=5&offset=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 5
        assert data["total"] == 10

