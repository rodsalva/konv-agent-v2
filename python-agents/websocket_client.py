import asyncio
import json
import websockets
import logging
import uuid
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ml_websocket_client')

class WebSocketClient:
    """
    WebSocket client for connecting Python agents to Node.js backend
    
    Handles real-time communication between MercadoLivre agents and the main platform.
    """
    
    def __init__(self, uri, api_key, agent_id, agent_type):
        """
        Initialize WebSocket client
        
        Args:
            uri: WebSocket server URI
            api_key: API key for authentication
            agent_id: Unique agent identifier
            agent_type: Type of agent (e.g., 'tech_enthusiast', 'budget_shopper')
        """
        self.uri = uri
        self.api_key = api_key
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.connection = None
        self.is_connected = False
        self.message_handlers = {}
        
    async def connect(self):
        """Establish connection to WebSocket server"""
        try:
            # Extra headers for authentication
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "X-Agent-ID": self.agent_id,
                "X-Agent-Type": self.agent_type
            }
            
            logger.info(f"Connecting to {self.uri} as {self.agent_type} agent...")
            self.connection = await websockets.connect(self.uri, extra_headers=headers)
            self.is_connected = True
            logger.info(f"Connected successfully to WebSocket server")
            
            # Send initial handshake
            await self.send_message({
                "type": "agent_connect",
                "agent_id": self.agent_id,
                "agent_type": self.agent_type,
                "timestamp": datetime.now().isoformat()
            })
            
            return True
        except Exception as e:
            logger.error(f"Connection failed: {str(e)}")
            self.is_connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.connection and self.is_connected:
            try:
                # Send disconnect message
                await self.send_message({
                    "type": "agent_disconnect",
                    "agent_id": self.agent_id,
                    "timestamp": datetime.now().isoformat()
                })
                
                await self.connection.close()
                logger.info("Disconnected from WebSocket server")
            except Exception as e:
                logger.error(f"Error during disconnect: {str(e)}")
            
            self.is_connected = False
            self.connection = None
    
    async def send_message(self, message):
        """
        Send a message to the WebSocket server
        
        Args:
            message: Message payload to send
        """
        if not self.is_connected or not self.connection:
            logger.error("Cannot send message: Not connected")
            return False
        
        try:
            # Add message ID if not present
            if "id" not in message:
                message["id"] = str(uuid.uuid4())
                
            # Add timestamp if not present
            if "timestamp" not in message:
                message["timestamp"] = datetime.now().isoformat()
            
            await self.connection.send(json.dumps(message))
            logger.debug(f"Sent message: {message['type']}")
            return True
        except Exception as e:
            logger.error(f"Failed to send message: {str(e)}")
            return False
    
    async def send_observation(self, observation):
        """
        Send an observation/feedback to the WebSocket server
        
        Args:
            observation: Observation data from agent exploration
        """
        message = {
            "type": "agent_observation",
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "observation": observation,
            "timestamp": datetime.now().isoformat()
        }
        
        return await self.send_message(message)
    
    async def send_exploration_result(self, result):
        """
        Send complete exploration results to the WebSocket server
        
        Args:
            result: Exploration result data
        """
        message = {
            "type": "exploration_result",
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
        return await self.send_message(message)
    
    async def send_heartbeat(self):
        """Send heartbeat to keep connection alive"""
        message = {
            "type": "heartbeat",
            "agent_id": self.agent_id,
            "timestamp": datetime.now().isoformat()
        }
        
        return await self.send_message(message)
    
    def register_message_handler(self, message_type, handler):
        """
        Register a handler for a specific message type
        
        Args:
            message_type: Type of message to handle
            handler: Async callback function to handle the message
        """
        self.message_handlers[message_type] = handler
        logger.debug(f"Registered handler for message type: {message_type}")
    
    async def receive_messages(self):
        """
        Listen for and process incoming WebSocket messages
        
        This is a long-running task that should be run in the background
        """
        if not self.is_connected or not self.connection:
            logger.error("Cannot receive messages: Not connected")
            return
        
        try:
            async for message in self.connection:
                try:
                    # Parse message
                    data = json.loads(message)
                    message_type = data.get("type")
                    
                    logger.debug(f"Received message: {message_type}")
                    
                    # Call appropriate handler
                    if message_type in self.message_handlers:
                        await self.message_handlers[message_type](data)
                    else:
                        logger.warning(f"No handler for message type: {message_type}")
                        
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse message: {message}")
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.is_connected = False
        except Exception as e:
            logger.error(f"Error in receive_messages: {str(e)}")
            self.is_connected = False
    
    async def maintain_connection(self, heartbeat_interval=30):
        """
        Maintain WebSocket connection with heartbeats
        
        Args:
            heartbeat_interval: Seconds between heartbeat messages
        """
        while True:
            if self.is_connected:
                await self.send_heartbeat()
            else:
                # Try to reconnect
                logger.info("Connection lost, attempting to reconnect...")
                await self.connect()
                
            await asyncio.sleep(heartbeat_interval)

# Example usage
async def example():
    # Create WebSocket client
    client = WebSocketClient(
        uri="ws://localhost:3002/api/v1/ws",
        api_key="mcp_agent_example_001",
        agent_id="tech_enthusiast_1",
        agent_type="tech_enthusiast"
    )
    
    # Register message handlers
    async def handle_command(data):
        print(f"Received command: {data}")
        
    client.register_message_handler("command", handle_command)
    
    # Connect to server
    if await client.connect():
        # Start receive loop in background
        receive_task = asyncio.create_task(client.receive_messages())
        
        # Start heartbeat in background
        heartbeat_task = asyncio.create_task(client.maintain_connection())
        
        # Send some test messages
        await client.send_observation({
            "category": "electronics",
            "findings": "User interface for filtering products is intuitive"
        })
        
        # Wait for a while
        await asyncio.sleep(60)
        
        # Clean up
        receive_task.cancel()
        heartbeat_task.cancel()
        await client.disconnect()

if __name__ == "__main__":
    # Run example
    asyncio.run(example())