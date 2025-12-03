from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
import json
import uuid

router = APIRouter()

class FPSConnectionManager:
    """Game-specific WebSocket connection manager for FPS multiplayer."""
    def __init__(self):
        # Map of connection_id -> websocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Map of connection_id -> player_id
        self.connection_players: Dict[str, str] = {}
        # Map of room_id -> set of connection_ids
        self.rooms: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
    
    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        if connection_id in self.connection_players:
            player_id = self.connection_players[connection_id]
            del self.connection_players[connection_id]
            # Remove from all rooms
            for room_id, connections in self.rooms.items():
                connections.discard(connection_id)
    
    async def send_personal_message(self, message: dict, connection_id: str):
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def broadcast_to_room(self, message: dict, room_id: str, exclude: str = None):
        """Broadcast message to all connections in a room."""
        if room_id not in self.rooms:
            return
        
        disconnected = []
        for connection_id in self.rooms[room_id]:
            if connection_id == exclude:
                continue
            if connection_id in self.active_connections:
                try:
                    await self.active_connections[connection_id].send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to {connection_id}: {e}")
                    disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    def join_room(self, connection_id: str, room_id: str):
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(connection_id)
    
    def leave_room(self, connection_id: str, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].discard(connection_id)

fps_manager = FPSConnectionManager()

@router.websocket("/ws")
async def fps_websocket_endpoint(websocket: WebSocket):
    """
    Game-specific WebSocket endpoint for FPS multiplayer.
    Separate from the generic watch WebSocket at /api/v1/ws
    """
    connection_id = str(uuid.uuid4())
    await fps_manager.connect(websocket, connection_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "connectionId": connection_id,
            "game": "fps",
            "message": "Connected to FPS Game WebSocket"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "join_room":
                    room_id = message.get("roomId")
                    player_id = message.get("playerId")
                    if room_id and player_id:
                        fps_manager.join_room(connection_id, room_id)
                        fps_manager.connection_players[connection_id] = player_id
                        await websocket.send_json({
                            "type": "room_joined",
                            "roomId": room_id
                        })
                        # Notify others in room
                        await fps_manager.broadcast_to_room({
                            "type": "player_joined",
                            "playerId": player_id,
                            "roomId": room_id
                        }, room_id, exclude=connection_id)
                
                elif message_type == "leave_room":
                    room_id = message.get("roomId")
                    player_id = fps_manager.connection_players.get(connection_id)
                    if room_id:
                        fps_manager.leave_room(connection_id, room_id)
                        await websocket.send_json({
                            "type": "room_left",
                            "roomId": room_id
                        })
                        # Notify others in room
                        if player_id:
                            await fps_manager.broadcast_to_room({
                                "type": "player_left",
                                "playerId": player_id,
                                "roomId": room_id
                            }, room_id, exclude=connection_id)
                
                elif message_type == "game_state":
                    # Forward game state to other players in room
                    room_id = message.get("roomId")
                    if room_id:
                        await fps_manager.broadcast_to_room(message, room_id, exclude=connection_id)
                
                elif message_type == "ping":
                    await websocket.send_json({"type": "pong"})
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        fps_manager.disconnect(connection_id)
    except Exception as e:
        print(f"FPS WebSocket error: {e}")
        fps_manager.disconnect(connection_id)

