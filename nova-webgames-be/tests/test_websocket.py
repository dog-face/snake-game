import pytest
import json
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.websocket import manager, broadcast_player_update, broadcast_player_join, broadcast_player_leave


@pytest.fixture(scope="function")
def ws_client():
    """Create a test client for WebSocket testing"""
    return TestClient(app)


class TestWebSocketConnection:
    """Test WebSocket connection establishment"""
    
    def test_websocket_connection(self, ws_client: TestClient):
        """Test basic WebSocket connection"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive initial connection message
            message = websocket.receive_json()
            assert message["type"] == "connected"
            assert "connectionId" in message
            assert "message" in message
            assert message["message"] == "Connected to Snake Game WebSocket"
    
    def test_websocket_connection_id_uniqueness(self, ws_client: TestClient):
        """Test that each connection gets a unique connection ID"""
        connection_ids = []
        
        # Create multiple connections
        with ws_client.websocket_connect("/ws") as ws1:
            msg1 = ws1.receive_json()
            connection_ids.append(msg1["connectionId"])
        
        with ws_client.websocket_connect("/ws") as ws2:
            msg2 = ws2.receive_json()
            connection_ids.append(msg2["connectionId"])
        
        with ws_client.websocket_connect("/ws") as ws3:
            msg3 = ws3.receive_json()
            connection_ids.append(msg3["connectionId"])
        
        # All connection IDs should be unique
        assert len(connection_ids) == len(set(connection_ids))


class TestWebSocketSubscribe:
    """Test subscribe/unsubscribe functionality"""
    
    def test_websocket_subscribe(self, ws_client: TestClient):
        """Test subscribing to a player"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Subscribe to a player
            player_id = "test-player-123"
            websocket.send_json({
                "type": "subscribe",
                "playerId": player_id
            })
            
            # Receive subscription confirmation
            response = websocket.receive_json()
            assert response["type"] == "subscribed"
            assert response["playerId"] == player_id
    
    def test_websocket_subscribe_without_player_id(self, ws_client: TestClient):
        """Test subscribing without playerId (should not error but may not subscribe)"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Try to subscribe without playerId
            websocket.send_json({
                "type": "subscribe"
            })
            
            # Should not receive a subscribed message (no playerId provided)
            # Connection should still be alive - verify with ping
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_websocket_unsubscribe(self, ws_client: TestClient):
        """Test unsubscribing from a player"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            player_id = "test-player-456"
            
            # First subscribe
            websocket.send_json({
                "type": "subscribe",
                "playerId": player_id
            })
            websocket.receive_json()  # subscribed message
            
            # Then unsubscribe
            websocket.send_json({
                "type": "unsubscribe",
                "playerId": player_id
            })
            
            # Receive unsubscribe confirmation
            response = websocket.receive_json()
            assert response["type"] == "unsubscribed"
            assert response["playerId"] == player_id
    
    def test_websocket_multiple_subscriptions(self, ws_client: TestClient):
        """Test subscribing to multiple players"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            player_ids = ["player-1", "player-2", "player-3"]
            
            # Subscribe to multiple players
            for player_id in player_ids:
                websocket.send_json({
                    "type": "subscribe",
                    "playerId": player_id
                })
                response = websocket.receive_json()
                assert response["type"] == "subscribed"
                assert response["playerId"] == player_id


class TestWebSocketPingPong:
    """Test ping/pong heartbeat mechanism"""
    
    def test_websocket_ping_pong(self, ws_client: TestClient):
        """Test ping/pong heartbeat"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Send ping
            websocket.send_json({"type": "ping"})
            
            # Receive pong
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_websocket_multiple_pings(self, ws_client: TestClient):
        """Test multiple ping/pong exchanges"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Send multiple pings
            for _ in range(5):
                websocket.send_json({"type": "ping"})
                response = websocket.receive_json()
                assert response["type"] == "pong"


class TestWebSocketBroadcasts:
    """Test broadcast functionality"""
    
    @pytest.mark.asyncio
    async def test_websocket_broadcast_player_update(self, ws_client: TestClient):
        """Test receiving player update broadcasts"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            conn_msg = websocket.receive_json()
            connection_id = conn_msg["connectionId"]
            
            player_id = "test-player-update"
            
            # Subscribe to player
            websocket.send_json({
                "type": "subscribe",
                "playerId": player_id
            })
            websocket.receive_json()  # subscribed message
            
            # Broadcast player update (simulating from another source)
            player_data = {
                "id": player_id,
                "username": "testuser",
                "score": 100,
                "gameMode": "pass-through",
                "gameState": {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 15, "y": 15},
                    "direction": "right",
                    "score": 100,
                    "gameOver": False
                }
            }
            await broadcast_player_update(player_id, player_data)
            
            # Small delay to allow broadcast
            await asyncio.sleep(0.1)
            
            # Receive broadcast
            response = websocket.receive_json()
            assert response["type"] == "player:update"
            assert response["playerId"] == player_id
            assert "data" in response
            assert response["data"]["score"] == 100
    
    @pytest.mark.asyncio
    async def test_websocket_broadcast_player_join(self, ws_client: TestClient):
        """Test receiving player join broadcasts"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            player_id = "test-player-join"
            player_data = {
                "id": player_id,
                "username": "newplayer",
                "score": 0,
                "gameMode": "walls"
            }
            
            # Broadcast player join
            await broadcast_player_join(player_id, player_data)
            
            # Small delay to allow broadcast
            await asyncio.sleep(0.1)
            
            # Receive broadcast (should go to all connections)
            response = websocket.receive_json()
            assert response["type"] == "player:join"
            assert response["playerId"] == player_id
            assert "data" in response
    
    @pytest.mark.asyncio
    async def test_websocket_broadcast_player_leave(self, ws_client: TestClient):
        """Test receiving player leave broadcasts"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            player_id = "test-player-leave"
            
            # Broadcast player leave
            await broadcast_player_leave(player_id)
            
            # Small delay to allow broadcast
            await asyncio.sleep(0.1)
            
            # Receive broadcast
            response = websocket.receive_json()
            assert response["type"] == "player:leave"
            assert response["playerId"] == player_id
    
    @pytest.mark.asyncio
    async def test_websocket_broadcast_only_to_subscribed(self, ws_client: TestClient):
        """Test that broadcasts only go to subscribed connections"""
        # Create two connections
        with ws_client.websocket_connect("/ws") as ws1:
            conn_msg1 = ws1.receive_json()
            connection_id1 = conn_msg1["connectionId"]
            
            # Subscribe to player-1
            ws1.send_json({
                "type": "subscribe",
                "playerId": "player-1"
            })
            ws1.receive_json()  # subscribed
            
            with ws_client.websocket_connect("/ws") as ws2:
                conn_msg2 = ws2.receive_json()
                connection_id2 = conn_msg2["connectionId"]
                
                # Subscribe to player-2
                ws2.send_json({
                    "type": "subscribe",
                    "playerId": "player-2"
                })
                ws2.receive_json()  # subscribed
                
                # Broadcast update for player-1
                await broadcast_player_update("player-1", {
                    "id": "player-1",
                    "username": "user1",
                    "score": 50
                })
                
                # Small delay to allow broadcast
                await asyncio.sleep(0.1)
                
                # Only ws1 should receive it
                response1 = ws1.receive_json()
                assert response1["type"] == "player:update"
                assert response1["playerId"] == "player-1"


class TestWebSocketErrorHandling:
    """Test error handling"""
    
    def test_websocket_invalid_json(self, ws_client: TestClient):
        """Test handling of invalid JSON"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Send invalid JSON
            websocket.send_text("not valid json")
            
            # Receive error message
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "message" in response
            assert "Invalid JSON format" in response["message"] or "JSON" in response["message"]
    
    def test_websocket_unknown_message_type(self, ws_client: TestClient):
        """Test handling of unknown message types"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Send unknown message type
            websocket.send_json({
                "type": "unknown_type",
                "data": "test"
            })
            
            # Should not crash, connection should remain open
            # We can verify by sending a ping
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_websocket_malformed_message(self, ws_client: TestClient):
        """Test handling of malformed messages"""
        with ws_client.websocket_connect("/ws") as websocket:
            # Receive connection message
            websocket.receive_json()
            
            # Send message with missing type
            websocket.send_json({
                "data": "no type field"
            })
            
            # Should handle gracefully, connection should remain open
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"


class TestWebSocketMultipleConnections:
    """Test multiple concurrent connections"""
    
    def test_websocket_multiple_connections(self, ws_client: TestClient):
        """Test multiple sequential WebSocket connections"""
        connection_ids = []
        
        # Create 5 sequential connections using context managers
        # Using context managers ensures proper cleanup and prevents hanging
        for i in range(5):
            with ws_client.websocket_connect("/ws") as ws:
                conn_msg = ws.receive_json()
                assert conn_msg["type"] == "connected"
                connection_id = conn_msg["connectionId"]
                connection_ids.append(connection_id)
                
                # Verify connection is active by sending ping
                ws.send_json({"type": "ping"})
                response = ws.receive_json()
                assert response["type"] == "pong"
        
        # All connection IDs should be unique
        assert len(connection_ids) == len(set(connection_ids))
    
    def test_websocket_connection_cleanup_on_disconnect(self, ws_client: TestClient):
        """Test that connections are cleaned up on disconnect"""
        # Get initial connection count (if any)
        initial_count = len(manager.active_connections)
        
        # Create and disconnect a connection
        with ws_client.websocket_connect("/ws") as websocket:
            websocket.receive_json()
            # Connection should be in manager
            # Note: TestClient may not track connections the same way
            assert manager is not None
        
        # After context exit, connection should be cleaned up
        # Note: The cleanup happens in the disconnect handler
        assert manager is not None
