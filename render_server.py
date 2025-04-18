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
app = application

# Get port from environment variable for Render compatibility
PORT = int(os.environ.get("PORT", 10000))

# Initialize services
detection_service = DetectionService()

# WebSocket route handling
async def router(websocket, path):
    """Route WebSocket connections based on path"""
    print(f"New WebSocket connection on path: {path}")
    
    if path == "/ws/detection":
        await detection_service.handler(websocket)
    elif path == "/ws/speech":
        await speech_websocket_handler(websocket)
    else:
        # Return error for unknown paths
        try:
            await websocket.send(json.dumps({
                "type": "error", 
                "message": f"Unknown WebSocket path: {path}"
            }))
            await websocket.close(1008, f"Unknown path: {path}")
        except:
            pass

# Create a custom HTTP routing function for WebSocket server
async def http_handler(path, headers):
    """
    This function handles HTTP requests before they reach the WebSocket handler.
    It specifically handles HEAD requests and path routing.
    """
    print(f"Request: {headers.get('method', 'UNKNOWN')} {path}")
    
    # Handle Render health checks (HEAD requests)
    if headers.get("method") == "HEAD":
        return (200, {"Content-Type": "text/plain"}, b"OK")
    
    # Handle regular GET requests to root
    if path == "/" and headers.get("connection") != "Upgrade":
        return (200, {"Content-Type": "text/plain"}, b"IPD-Lingual Server")
    
    # Allow WebSocket connections to proceed for specific paths
    if path in ["/ws/detection", "/ws/speech"]:
        return None
    
    # For any other path, return 404
    return (404, {"Content-Type": "text/plain"}, b"Not Found")

# Initialize speech service
async def initialize_speech_service():
    """Initialize speech service with default languages"""
    try:
        speech_service.set_languages('en', 'hi')
        print("Speech service initialized with English and Hindi")
    except Exception as e:
        print(f"Error initializing speech service: {e}")

async def start_websocket_server():
    """Start WebSocket server with path-based routing"""
    # Initialize speech service
    await initialize_speech_service()
    
    # Start WebSocket server with path-based routing
    # This is crucial: use a SINGLE server for ALL WebSocket endpoints
    server = await websockets.serve(
        router,  # Use the router function to handle different paths
        "0.0.0.0", 
        PORT,  # Use the same port
        process_request=http_handler,  # Handle HTTP requests
        max_size=20 * 1024 * 1024,  # 20MB max message size
        ping_interval=30,
        ping_timeout=10
    )
    print(f"WebSocket server started at ws://0.0.0.0:{PORT}")
    print(f"  - Detection endpoint: ws://0.0.0.0:{PORT}/ws/detection")
    print(f"  - Speech endpoint: ws://0.0.0.0:{PORT}/ws/speech")
    
    return server

# For direct execution (development mode)
async def main():
    """Main entry point for development"""
    print(f"=== Starting IPD-Lingual on {'Render' if os.environ.get('RENDER') else 'local development'} (PORT={PORT}) ===")
    
    # Start WebSocket server
    server = await start_websocket_server()
    
    # In dev mode, also start the Flask app
    if not os.environ.get('RENDER'):
        # Start Flask in a thread
        flask_thread = threading.Thread(
            target=lambda: app.run(host="0.0.0.0", port=PORT)
        )
        flask_thread.daemon = True
        flask_thread.start()
    
    # Keep the server running
    try:
        await asyncio.Future()
    finally:
        server.close()
        await server.wait_closed()

# For gunicorn in production
def start_background_websocket():
    """Start WebSocket server in background thread (for gunicorn)"""
    async def run():
        try:
            server = await start_websocket_server()
            await asyncio.Future()  # Keep running indefinitely
        except Exception as e:
            print(f"Error in WebSocket server: {e}")
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run())

# Start background WebSocket server when imported by gunicorn
if not os.environ.get('NO_WEBSOCKET'):
    websocket_thread = threading.Thread(target=start_background_websocket)
    websocket_thread.daemon = True
    websocket_thread.start()
    print("WebSocket server started in background thread")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error: {e}")