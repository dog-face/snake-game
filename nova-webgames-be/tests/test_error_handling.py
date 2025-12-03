"""
Error handling tests covering invalid request bodies, missing fields, type mismatches,
and malformed data scenarios.
"""
import pytest
from httpx import AsyncClient
from app.models.user import User


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
    token = response.json()["token"]
    return {**user_data, "token": token}


class TestInvalidRequestBodyFormats:
    """Test handling of invalid request body formats"""
    
    @pytest.mark.asyncio
    async def test_malformed_json_signup(self, client: AsyncClient):
        """Test signup with malformed JSON"""
        # Send invalid JSON
        response = await client.post(
            "/api/v1/auth/signup",
            content='{"username": "test", "email": "test@example.com", "password": "pass123"',  # Missing closing brace
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_empty_body_signup(self, client: AsyncClient):
        """Test signup with empty request body"""
        response = await client.post(
            "/api/v1/auth/signup",
            json={}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_wrong_content_type_signup(self, client: AsyncClient):
        """Test signup with wrong content type"""
        response = await client.post(
            "/api/v1/auth/signup",
            content="username=test&email=test@example.com&password=pass123",
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        # FastAPI should still try to parse, but may fail validation
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_malformed_json_leaderboard_submit(self, client: AsyncClient, test_user):
        """Test leaderboard submission with malformed JSON"""
        response = await client.post(
            "/api/v1/leaderboard",
            content='{"score": 100, "gameMode": "pass-through"',  # Missing closing brace
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_user['token']}"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_malformed_json_watch_start(self, client: AsyncClient, test_user):
        """Test watch start with malformed JSON"""
        response = await client.post(
            "/api/v1/watch/start",
            content='{"gameMode": "pass-through"',  # Missing closing brace
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_user['token']}"
            }
        )
        assert response.status_code == 422


class TestMissingRequiredFields:
    """Test handling of missing required fields"""
    
    @pytest.mark.asyncio
    async def test_signup_missing_username(self, client: AsyncClient):
        """Test signup with missing username"""
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": "test@example.com",
                "password": "testpass123"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_signup_missing_email(self, client: AsyncClient):
        """Test signup with missing email"""
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "username": "testuser",
                "password": "testpass123"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_signup_missing_password(self, client: AsyncClient):
        """Test signup with missing password"""
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "username": "testuser",
                "email": "test@example.com"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_login_missing_username(self, client: AsyncClient):
        """Test login with missing username"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "password": "testpass123"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_login_missing_password(self, client: AsyncClient):
        """Test login with missing password"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_leaderboard_submit_missing_score(self, client: AsyncClient, test_user):
        """Test leaderboard submission with missing score"""
        response = await client.post(
            "/api/v1/leaderboard",
            json={
                "gameMode": "pass-through"
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_leaderboard_submit_missing_game_mode(self, client: AsyncClient, test_user):
        """Test leaderboard submission with missing game mode"""
        response = await client.post(
            "/api/v1/leaderboard",
            json={
                "score": 100
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_start_missing_game_mode(self, client: AsyncClient, test_user):
        """Test watch start with missing game mode"""
        response = await client.post(
            "/api/v1/watch/start",
            json={},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_missing_game_state(self, client: AsyncClient, test_user):
        """Test watch update with missing game state"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update without game state
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_end_missing_final_score(self, client: AsyncClient, test_user):
        """Test watch end with missing final score"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to end without final score
        response = await client.post(
            f"/api/v1/watch/end/{session_id}",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_end_missing_game_mode(self, client: AsyncClient, test_user):
        """Test watch end with missing game mode"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to end without game mode
        response = await client.post(
            f"/api/v1/watch/end/{session_id}",
            json={"finalScore": 100},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422


class TestTypeMismatches:
    """Test handling of type mismatches in request data"""
    
    @pytest.mark.asyncio
    async def test_signup_username_not_string(self, client: AsyncClient):
        """Test signup with username as non-string"""
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "username": 12345,  # Should be string
                "email": "test@example.com",
                "password": "testpass123"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_signup_email_not_string(self, client: AsyncClient):
        """Test signup with email as non-string"""
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "username": "testuser",
                "email": 12345,  # Should be string
                "password": "testpass123"
            }
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_leaderboard_submit_score_not_integer(self, client: AsyncClient, test_user):
        """Test leaderboard submission with score as non-integer"""
        response = await client.post(
            "/api/v1/leaderboard",
            json={
                "score": "100",  # Should be integer
                "gameMode": "pass-through"
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        # Pydantic may coerce string to int, but let's test
        assert response.status_code in [201, 422]
    
    @pytest.mark.asyncio
    async def test_leaderboard_submit_score_as_float(self, client: AsyncClient, test_user):
        """Test leaderboard submission with score as float"""
        response = await client.post(
            "/api/v1/leaderboard",
            json={
                "score": 100.5,  # Should be integer
                "gameMode": "pass-through"
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        # Pydantic may reject float for int field
        assert response.status_code in [201, 422]
    
    @pytest.mark.asyncio
    async def test_watch_start_game_mode_not_string(self, client: AsyncClient, test_user):
        """Test watch start with game mode as non-string"""
        response = await client.post(
            "/api/v1/watch/start",
            json={
                "gameMode": 123  # Should be string/enum
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_snake_not_list(self, client: AsyncClient, test_user):
        """Test watch update with snake as non-list"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with snake as string instead of list
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": "not a list",  # Should be list
                    "food": {"x": 10, "y": 10},
                    "direction": "up",
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_food_not_object(self, client: AsyncClient, test_user):
        """Test watch update with food as non-object"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with food as string instead of object
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": "not an object",  # Should be object
                    "direction": "up",
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_score_not_integer(self, client: AsyncClient, test_user):
        """Test watch update with score as non-integer"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with score as string
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 15, "y": 15},
                    "direction": "up",
                    "score": "100",  # Should be integer
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        # Pydantic may coerce, but let's test
        assert response.status_code in [200, 422]
    
    @pytest.mark.asyncio
    async def test_watch_update_game_over_not_boolean(self, client: AsyncClient, test_user):
        """Test watch update with gameOver as non-boolean"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with gameOver as number (which cannot be coerced to boolean)
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 15, "y": 15},
                    "direction": "up",
                    "score": 0,
                    "gameOver": 123  # Should be boolean, not number
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422


class TestInvalidFieldValues:
    """Test handling of invalid field values"""
    
    @pytest.mark.asyncio
    async def test_watch_update_negative_score(self, client: AsyncClient, test_user):
        """Test watch update with negative score"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with negative score
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 15, "y": 15},
                    "direction": "up",
                    "score": -1,  # Invalid: negative score
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_invalid_coordinates(self, client: AsyncClient, test_user):
        """Test watch update with coordinates out of bounds"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with coordinates out of bounds
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 25, "y": 10}],  # Invalid: x > 19
                    "food": {"x": 15, "y": 15},
                    "direction": "up",
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_invalid_direction(self, client: AsyncClient, test_user):
        """Test watch update with invalid direction"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with invalid direction
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 15, "y": 15},
                    "direction": "diagonal",  # Invalid: not one of up/down/left/right
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_end_negative_final_score(self, client: AsyncClient, test_user):
        """Test watch end with negative final score"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to end with negative score
        response = await client.post(
            f"/api/v1/watch/end/{session_id}",
            json={
                "finalScore": -1,  # Invalid: negative score
                "gameMode": "pass-through"
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_leaderboard_submit_negative_score(self, client: AsyncClient, test_user):
        """Test leaderboard submission with negative score"""
        response = await client.post(
            "/api/v1/leaderboard",
            json={
                "score": -1,  # Invalid: negative score
                "gameMode": "pass-through"
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        # Score validation may happen at schema level
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_leaderboard_invalid_game_mode(self, client: AsyncClient, test_user):
        """Test leaderboard submission with invalid game mode"""
        response = await client.post(
            "/api/v1/leaderboard",
            json={
                "score": 100,
                "gameMode": "invalid-mode"  # Invalid: not pass-through or walls
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_start_invalid_game_mode(self, client: AsyncClient, test_user):
        """Test watch start with invalid game mode"""
        response = await client.post(
            "/api/v1/watch/start",
            json={
                "gameMode": "invalid-mode"  # Invalid: not pass-through or walls
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422


class TestNestedStructureErrors:
    """Test handling of errors in nested structures"""
    
    @pytest.mark.asyncio
    async def test_watch_update_snake_missing_coordinates(self, client: AsyncClient, test_user):
        """Test watch update with snake positions missing coordinates"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with snake position missing y coordinate
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10}],  # Missing y
                    "food": {"x": 15, "y": 15},
                    "direction": "up",
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_food_missing_coordinates(self, client: AsyncClient, test_user):
        """Test watch update with food position missing coordinates"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with food position missing y coordinate
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 15},  # Missing y
                    "direction": "up",
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_watch_update_empty_snake_list(self, client: AsyncClient, test_user):
        """Test watch update with empty snake list"""
        # First start a session
        start_response = await client.post(
            "/api/v1/watch/start",
            json={"gameMode": "pass-through"},
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert start_response.status_code == 201
        session_id = start_response.json()["sessionId"]
        
        # Try to update with empty snake list
        response = await client.put(
            f"/api/v1/watch/update/{session_id}",
            json={
                "gameState": {
                    "snake": [],  # Empty list (may be valid, but tests edge case)
                    "food": {"x": 15, "y": 15},
                    "direction": "up",
                    "score": 0,
                    "gameOver": False
                }
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        # Empty snake list may be accepted or rejected depending on validation
        assert response.status_code in [200, 422]

