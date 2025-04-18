import os
import asyncio
import json
import threading
from aiohttp import web
import websockets
from utils.detection_service import DetectionService
from utils.speech_service import handle_websocket as speech_websocket_handler, speech_service
from utils.user_auth import app

# Expose the Flask app for gunicorn to use directly
# This is what gunicorn will import when using render_server:app
application = app  # Standard WSGI application variable name
# Also export as 'app' since that's what gunicorn is looking for in render_server:app
# Note: Don't remove this line - it's crucial for the gunicorn command to work!
app = application

# Create a custom HTTP routing function for WebSocket server
async def http_handler(path, headers):
    """
    This function handles HTTP requests before they reach the WebSocket handler.
    It specifically looks for HEAD requests (used by Render for health checks)
    and returns an HTTP 200 response instead of trying to upgrade to WebSocket.
    """
    print(f"Received request: {headers.get('method', 'UNKNOWN')} {path}")
    
    # If it's a HEAD request (Render health check), return 200 OK
    print("Handling HEAD request (health check)")
    if headers.get("method") == "HEAD":
        return (200, {}, b"Health check OK")
    
    # Standard GET requests to root path get a health check response too
    if path == "/" and headers.get("connection") != "Upgrade":
        return (200, {"Content-Type": "text/plain"}, b"Server is running")
        
    # Let WebSocket handler deal with WebSocket upgrade requests
    return None

# Get port from environment variable for Render compatibility
PORT = int(os.environ.get("PORT", 10000))

# Initialize services
detection_service = DetectionService()

# Initialize speech service
async def initialize_speech_service():
    """Initialize speech service with default languages"""
    try:
        speech_service.set_languages('en', 'hi')
        print("Speech service initialized with English and Hindi")
    except Exception as e:
        print(f"Error initializing speech service: {e}")

async def main():
    """Main entry point for Render deployment"""
    print(f"=== Starting IPD-Lingual on {'Render' if os.environ.get('RENDER') else 'local development'} (PORT={PORT}) ===")
    
    # Initialize speech service
    await initialize_speech_service()
    
    # Start WebSocket servers
    detection_ws = await websockets.serve(
        detection_service.handler,
        "0.0.0.0", 
        PORT + 1,  # Use PORT+1 for detection websocket
        process_request=http_handler,
        max_size=20 * 1024 * 1024,
        ping_interval=30,
        ping_timeout=10,
    )
    print(f"Detection WebSocket server started at ws://0.0.0.0:{PORT + 1}")
    
    speech_ws = await websockets.serve(
        speech_websocket_handler,
        "0.0.0.0",
        PORT + 2,  # Use PORT+2 for speech websocket
        process_request=http_handler,
        max_size=20 * 1024 * 1024,
        ping_interval=30,
        ping_timeout=10,
    )
    print(f"Speech WebSocket server started at ws://0.0.0.0:{PORT + 2}")
    
    # Keep the server running
    await asyncio.Future()

# Start websocket servers in a separate thread when imported by gunicorn
def start_websocket_servers():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main())
    except Exception as e:
        print(f"Error in WebSocket servers: {e}")

# Start the websocket servers when this module is imported by gunicorn
websocket_thread = threading.Thread(target=start_websocket_servers)
websocket_thread.daemon = True
websocket_thread.start()

if __name__ == "__main__":
    try:
        # When running directly (not through gunicorn), start the app
        app.run(host="0.0.0.0", port=PORT)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error: {e}")