import unittest
import asyncio
import json
import sys
import os
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime
import uuid

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from websocket_client import WebSocketClient

class TestWebSocketClient(unittest.IsolatedAsyncioTestCase):
    """Tests for the WebSocketClient class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.uri = "ws://localhost:3002/api/v1/ws"
        self.api_key = "mcp_agent_test_123"
        self.agent_id = "test_agent_1"
        self.agent_type = "tech_enthusiast"
        
        # Create client instance
        self.client = WebSocketClient(
            uri=self.uri,
            api_key=self.api_key,
            agent_id=self.agent_id,
            agent_type=self.agent_type
        )
    
    def test_initialization(self):
        """Test that client is initialized with correct parameters"""
        self.assertEqual(self.client.uri, self.uri)
        self.assertEqual(self.client.api_key, self.api_key)
        self.assertEqual(self.client.agent_id, self.agent_id)
        self.assertEqual(self.client.agent_type, self.agent_type)
        self.assertFalse(self.client.is_connected)
        self.assertIsNone(self.client.connection)
        self.assertEqual(self.client.message_handlers, {})
    
    @patch('websockets.connect')
    async def test_connect(self, mock_connect):
        """Test the connect method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock send_message to avoid actual calls
        self.client.send_message = AsyncMock(return_value=True)
        
        # Call connect
        result = await self.client.connect()
        
        # Verify connect was called with correct parameters
        mock_connect.assert_called_once_with(self.uri, extra_headers={
            "Authorization": f"Bearer {self.api_key}",
            "X-Agent-ID": self.agent_id,
            "X-Agent-Type": self.agent_type
        })
        
        # Check connection state
        self.assertTrue(result)
        self.assertTrue(self.client.is_connected)
        self.assertEqual(self.client.connection, mock_connection)
        
        # Verify handshake message was sent
        self.client.send_message.assert_called_once()
        args = self.client.send_message.call_args[0][0]
        self.assertEqual(args["type"], "agent_connect")
        self.assertEqual(args["agent_id"], self.agent_id)
        self.assertEqual(args["agent_type"], self.agent_type)
    
    @patch('websockets.connect')
    async def test_connect_failure(self, mock_connect):
        """Test connect method handling connection failure"""
        # Setup mock to raise exception
        mock_connect.side_effect = Exception("Connection failed")
        
        # Call connect
        result = await self.client.connect()
        
        # Check connection state
        self.assertFalse(result)
        self.assertFalse(self.client.is_connected)
        self.assertIsNone(self.client.connection)
    
    async def test_disconnect_when_not_connected(self):
        """Test disconnect method when not connected"""
        # Client starts not connected
        self.assertFalse(self.client.is_connected)
        
        # Should not raise exceptions
        await self.client.disconnect()
        
        # Still not connected
        self.assertFalse(self.client.is_connected)
        self.assertIsNone(self.client.connection)
    
    @patch('websockets.connect')
    async def test_disconnect(self, mock_connect):
        """Test the disconnect method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock send_message to avoid actual calls
        self.client.send_message = AsyncMock(return_value=True)
        
        # Connect first
        await self.client.connect()
        
        # Reset mock to clear connect call
        self.client.send_message.reset_mock()
        
        # Call disconnect
        await self.client.disconnect()
        
        # Check disconnect message was sent
        self.client.send_message.assert_called_once()
        args = self.client.send_message.call_args[0][0]
        self.assertEqual(args["type"], "agent_disconnect")
        self.assertEqual(args["agent_id"], self.agent_id)
        
        # Check connection was closed
        mock_connection.close.assert_called_once()
        
        # Check connection state
        self.assertFalse(self.client.is_connected)
        self.assertIsNone(self.client.connection)
    
    async def test_send_message_when_not_connected(self):
        """Test send_message method when not connected"""
        # Client starts not connected
        self.assertFalse(self.client.is_connected)
        
        # Try to send message
        result = await self.client.send_message({"type": "test"})
        
        # Should fail
        self.assertFalse(result)
    
    @patch('websockets.connect')
    async def test_send_message(self, mock_connect):
        """Test the send_message method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Save the original send_message to restore it later
        original_send_message = self.client.send_message
        
        # Connect (this will use send_message)
        self.client.send_message = AsyncMock(return_value=True)
        await self.client.connect()
        
        # Restore original send_message
        self.client.send_message = original_send_message
        
        # Test message
        test_message = {
            "type": "test_message",
            "content": "Hello World"
        }
        
        # Send message
        result = await self.client.send_message(test_message)
        
        # Check result
        self.assertTrue(result)
        
        # Verify message was sent
        mock_connection.send.assert_called_once()
        
        # Check message content
        sent_data = mock_connection.send.call_args[0][0]
        sent_message = json.loads(sent_data)
        
        self.assertEqual(sent_message["type"], "test_message")
        self.assertEqual(sent_message["content"], "Hello World")
        self.assertIn("id", sent_message)
        self.assertIn("timestamp", sent_message)
    
    @patch('websockets.connect')
    async def test_send_message_failure(self, mock_connect):
        """Test send_message handling failure"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock send to raise exception
        mock_connection.send.side_effect = Exception("Send failed")
        
        # Save the original send_message
        original_send_message = self.client.send_message
        
        # Connect (this will use send_message)
        self.client.send_message = AsyncMock(return_value=True)
        await self.client.connect()
        
        # Restore original send_message
        self.client.send_message = original_send_message
        
        # Try to send message
        result = await self.client.send_message({"type": "test"})
        
        # Should fail
        self.assertFalse(result)
    
    @patch('websockets.connect')
    async def test_send_observation(self, mock_connect):
        """Test the send_observation method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock send_message to track calls
        self.client.send_message = AsyncMock(return_value=True)
        
        # Connect
        await self.client.connect()
        
        # Test observation
        observation = {
            "category": "electronics",
            "finding": "User interface is intuitive",
            "confidence": 0.85
        }
        
        # Send observation
        await self.client.send_observation(observation)
        
        # Check send_message was called with correct parameters
        self.client.send_message.assert_called_once()
        args = self.client.send_message.call_args[0][0]
        
        self.assertEqual(args["type"], "agent_observation")
        self.assertEqual(args["agent_id"], self.agent_id)
        self.assertEqual(args["agent_type"], self.agent_type)
        self.assertEqual(args["observation"], observation)
        self.assertIn("timestamp", args)
    
    @patch('websockets.connect')
    async def test_send_exploration_result(self, mock_connect):
        """Test the send_exploration_result method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock send_message to track calls
        self.client.send_message = AsyncMock(return_value=True)
        
        # Connect
        await self.client.connect()
        
        # Test result
        result = {
            "exploration_complete": True,
            "findings": ["Finding 1", "Finding 2"],
            "time_spent": 120
        }
        
        # Send result
        await self.client.send_exploration_result(result)
        
        # Check send_message was called with correct parameters
        self.client.send_message.assert_called_once()
        args = self.client.send_message.call_args[0][0]
        
        self.assertEqual(args["type"], "exploration_result")
        self.assertEqual(args["agent_id"], self.agent_id)
        self.assertEqual(args["agent_type"], self.agent_type)
        self.assertEqual(args["result"], result)
        self.assertIn("timestamp", args)
    
    @patch('websockets.connect')
    async def test_send_heartbeat(self, mock_connect):
        """Test the send_heartbeat method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock send_message to track calls
        self.client.send_message = AsyncMock(return_value=True)
        
        # Connect
        await self.client.connect()
        
        # Send heartbeat
        await self.client.send_heartbeat()
        
        # Check send_message was called with correct parameters
        self.client.send_message.assert_called_once()
        args = self.client.send_message.call_args[0][0]
        
        self.assertEqual(args["type"], "heartbeat")
        self.assertEqual(args["agent_id"], self.agent_id)
        self.assertIn("timestamp", args)
    
    def test_register_message_handler(self):
        """Test the register_message_handler method"""
        # Create test handler
        async def test_handler(data):
            pass
        
        # Register handler
        self.client.register_message_handler("test_type", test_handler)
        
        # Check handler was registered
        self.assertIn("test_type", self.client.message_handlers)
        self.assertEqual(self.client.message_handlers["test_type"], test_handler)
    
    @patch('websockets.connect')
    async def test_receive_messages(self, mock_connect):
        """Test the receive_messages method"""
        # Setup mock connection with messages
        mock_connection = AsyncMock()
        
        # Create a generator for the async for loop
        async def mock_generator():
            yield json.dumps({"type": "test_type", "data": "test_data"})
            yield json.dumps({"type": "unknown_type", "data": "test_data"})
            yield "invalid_json"
            raise Exception("Connection closed")
        
        mock_connection.__aiter__.return_value = mock_generator()
        mock_connect.return_value = mock_connection
        
        # Create test handlers
        test_handler = AsyncMock()
        self.client.register_message_handler("test_type", test_handler)
        
        # Connect
        self.client.send_message = AsyncMock(return_value=True)
        await self.client.connect()
        
        # Run receive_messages
        await self.client.receive_messages()
        
        # Check handler was called with correct data
        test_handler.assert_called_once()
        args = test_handler.call_args[0][0]
        self.assertEqual(args["type"], "test_type")
        self.assertEqual(args["data"], "test_data")
        
        # Check connection state after exception
        self.assertFalse(self.client.is_connected)
    
    @patch('websockets.connect')
    async def test_maintain_connection(self, mock_connect):
        """Test the maintain_connection method"""
        # Setup mock connection
        mock_connection = AsyncMock()
        mock_connect.return_value = mock_connection
        
        # Mock methods
        self.client.send_heartbeat = AsyncMock()
        self.client.connect = AsyncMock(return_value=True)
        
        # Set up to run for a short time and then exit
        orig_sleep = asyncio.sleep
        sleep_calls = 0
        
        async def mock_sleep(seconds):
            nonlocal sleep_calls
            sleep_calls += 1
            if sleep_calls >= 3:
                # Stop the maintain_connection loop
                self.client.is_connected = False
                raise asyncio.CancelledError()
            # Extremely short sleep for testing
            await orig_sleep(0.01)
        
        # Patch asyncio.sleep for faster tests
        with patch('asyncio.sleep', side_effect=mock_sleep):
            # Start with connected state
            self.client.is_connected = True
            
            try:
                # Call maintain_connection with short interval
                await self.client.maintain_connection(heartbeat_interval=0.1)
            except asyncio.CancelledError:
                pass
            
            # Check heartbeat was sent
            self.client.send_heartbeat.assert_called()
            
            # Reset connection state and heartbeat mock
            self.client.is_connected = False
            self.client.send_heartbeat.reset_mock()
            
            # Test reconnection
            try:
                # Call maintain_connection with short interval
                await self.client.maintain_connection(heartbeat_interval=0.1)
            except asyncio.CancelledError:
                pass
            
            # Check connect was called
            self.client.connect.assert_called()


if __name__ == '__main__':
    unittest.main()