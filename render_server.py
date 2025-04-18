import os
import asyncio
import json
import threading
from utils.detection_service import DetectionService
from utils.speech_service import handle_websocket as speech_websocket_handler, speech_service
from utils.user_auth import app
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("render_server")

# Get port from environment variable for Render compatibility
PORT = int(os.environ.get("PORT", 10000))

# Initialize services
detection_service = DetectionService()

# Dictionary to track active WebSocket connections
websocket_connections = {}

# Initialize speech service
async def initialize_speech_service():
    """Initialize speech service with default languages"""
    try:
        speech_service.set_languages('en', 'hi')
        logger.info("Speech service initialized with English and Hindi")
    except Exception as e:
        logger.error(f"Error initializing speech service: {e}")

# Create Flask app instance for WSGI
application = app

# This is what gunicorn will import when using render_server:app
app = application

# For direct execution (development mode)
if __name__ == "__main__":
    # When running directly (not through gunicorn), start the Flask app
    app.run(host="0.0.0.0", port=PORT)