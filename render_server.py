import os
import asyncio
import json
import threading
from aiohttp import web
import websockets
from utils.detection_service import DetectionService
from utils.speech_service import handle_websocket as speech_websocket_handler, speech_service
from utils.user_auth import app
from flask import request, Response
import uuid

# Expose the Flask app for gunicorn to use directly
# This is what gunicorn will import when using render_server:app
application = app  # Standard WSGI application variable name
app = application

# Get port from environment variable for Render compatibility
PORT = int(os.environ.get("PORT", 10000))

# Initialize services
detection_service = DetectionService()

# Dictionary to track active WebSocket connections
websocket_connections = {}

# Add WebSocket handlers to Flask routes
@app.route('/ws/detection')
def detection_websocket_handler():
    """WebSocket endpoint for object detection"""
    if request.method == 'GET' and 'Upgrade' in request.headers.get('Connection', '') and 'websocket' in request.headers.get('Upgrade', ''):
        # This is a WebSocket request - return a dummy response
        # The actual WebSocket connection will be handled by the WebSocket server
        return Response('WebSocket connection established', 101)
    return "WebSocket endpoint for object detection. Use a WebSocket client to connect.", 200

@app.route('/ws/speech')
def speech_websocket_handler():
    """WebSocket endpoint for speech recognition"""
    if request.method == 'GET' and 'Upgrade' in request.headers.get('Connection', '') and 'websocket' in request.headers.get('Upgrade', ''):
        # This is a WebSocket request - return a dummy response
        return Response('WebSocket connection established', 101)
    return "WebSocket endpoint for speech recognition. Use a WebSocket client to connect.", 200

# Add a test endpoint to verify the server is working
@app.route('/')
def index():
    """Root endpoint for health checks and testing"""
    return """
    <html>
        <head>
            <title>IPD-Lingual API Server</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                code { background: #eee; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>IPD-Lingual API Server</h1>
            <p>The server is running successfully. WebSocket endpoints are available at:</p>
            
            <div class="endpoint">
                <h3>Detection WebSocket:</h3>
                <code>wss://{}/ws/detection</code>
            </div>
            
            <div class="endpoint">
                <h3>Speech WebSocket:</h3>
                <code>wss://{}/ws/speech</code>
            </div>
            
            <p>Use these endpoints with a WebSocket client to connect to the service.</p>
            <p>For API documentation, see <a href="/apidocs">/apidocs</a>.</p>
        </body>
    </html>
    """.format(request.host, request.host), 200

# WebSocket route handling
async def router(websocket, path):
    """Route WebSocket connections based on path"""
    try:
        print(f"New WebSocket connection on path: {path}")
        
        # Generate a unique ID for this connection
        connection_id = str(uuid.uuid4())
        websocket_connections[connection_id] = {
            'path': path,
            'websocket': websocket,
            'connected_at': asyncio.get_event_loop().time()
        }
        
        try:
            if path == "/ws/detection":
                await detection_service.handler(websocket)
            elif path == "/ws/speech":
                await speech_websocket_handler(websocket)
            else:
                # Return error for unknown paths
                await websocket.send(json.dumps({
                    "type": "error", 
                    "message": f"Unknown WebSocket path: {path}"
                }))
                await websocket.close(1008, f"Unknown path: {path}")
        finally:
            # Clean up the connection when done
            if connection_id in websocket_connections:
                del websocket_connections[connection_id]
    except Exception as e:
        print(f"Error in WebSocket router: {e}")

# Create a custom HTTP routing function for WebSocket server
async def http_handler(path, headers):
    """
    This function handles HTTP requests before they reach the WebSocket handler.
    It specifically handles HEAD requests and path routing.
    """
    print(f"Request: {headers.get('method', 'UNKNOWN')} {path}")
    
    # Handle Render health checks (HEAD requests)
    if headers.get("method") == "HEAD":
        print("Responding to HEAD request (health check)")
        return (200, {"Content-Type": "text/plain"}, b"OK")
    
    # Only handle WebSocket paths - let Flask handle the rest
    if path in ["/ws/detection", "/ws/speech"]:
        # Check if it's a WebSocket upgrade request
        if headers.get("connection", "").lower() == "upgrade" and headers.get("upgrade", "").lower() == "websocket":
            print(f"Processing WebSocket upgrade request for {path}")
            return None  # Let WebSocket handler take over
            
    # Let Flask handle all other HTTP requests
    return (404, {"Content-Type": "text/plain"}, b"Not found by WebSocket server; forwarded to Flask")

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
    server = await websockets.serve(
        router,  # Use the router function to handle different paths
        "0.0.0.0", 
        PORT,  # Use the same port
        process_request=http_handler,  # Handle HTTP requests
        max_size=20 * 1024 * 1024,  # 20MB max message size
        ping_interval=30,
        ping_timeout=10
    )
    print(f"WebSocket server started on port {PORT}")
    print(f"  - Detection endpoint: ws://0.0.0.0:{PORT}/ws/detection")
    print(f"  - Speech endpoint: ws://0.0.0.0:{PORT}/ws/speech")
    
    return server

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
        # When running directly (not through gunicorn), start the Flask app
        app.run(host="0.0.0.0", port=PORT)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error: {e}")