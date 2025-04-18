import os
import asyncio
import json
import threading
from aiohttp import web
import websockets
from utils.detection_service import DetectionService
from utils.speech_service import handle_websocket as speech_websocket_handler, speech_service
from flask import Flask
from utils.user_auth import app as flask_app

# Get port from environment variable for Render compatibility
PORT = int(os.environ.get("PORT", 10000))

# Initialize services
detection_service = DetectionService()

# Dict to track active websocket connections
active_connections = {}

# Health check handler for Render
async def health_check(request):
    """Health check endpoint for Render"""
    return web.Response(text="OK", status=200)

# WebSocket handler for detection with health check support
async def detection_handler(websocket, path):
    try:
        # If it's a health check (HEAD request), just return
        if getattr(websocket, 'request_headers', {}).get('method') == 'HEAD':
            await websocket.close(1000, "Health check OK")
            return
            
        # Otherwise, handle as normal
        await detection_service.handler(websocket)
    except Exception as e:
        print(f"Error in detection handler: {e}")

# WebSocket handler for speech with health check support
async def speech_handler(websocket, path):
    try:
        # If it's a health check (HEAD request), just return
        if getattr(websocket, 'request_headers', {}).get('method') == 'HEAD':
            await websocket.close(1000, "Health check OK")
            return
            
        # Otherwise, handle as normal
        await speech_websocket_handler(websocket)
    except Exception as e:
        print(f"Error in speech handler: {e}")

# Create HTTP server for health checks
async def setup_http_server():
    """Setup HTTP server for health checks on the main port"""
    app = web.Application()
    app.router.add_get("/", health_check)
    app.router.add_head("/", health_check)  # Explicitly handle HEAD requests
    app.router.add_get("/ws/detection/health", health_check)
    app.router.add_get("/ws/speech/health", health_check)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    print(f"Health check server running at http://0.0.0.0:{PORT}")
    return runner

# Flask server function
def start_flask():
    """Start Flask server"""
    try:
        # Configuring Flask to run on a different port if on Render
        if os.environ.get('RENDER'):
            from waitress import serve
            print(f"Starting Flask with waitress on port {PORT}")
            serve(flask_app, host="0.0.0.0", port=PORT)
        else:
            print(f"Starting Flask development server on port {PORT}")
            flask_app.run(host="0.0.0.0", port=PORT)
    except Exception as e:
        print(f"Error starting Flask: {e}")

# WebSocket server function with path routing
async def start_websocket_servers():
    """Start WebSocket servers with Render-compatible health checks"""
    # Set up detection websocket service
    detection_ws = await websockets.serve(
        detection_handler, 
        "0.0.0.0", 
        PORT,  # Use the same port as HTTP
        max_size=20 * 1024 * 1024,
        ping_interval=30,
        ping_timeout=10,
        process_request=handle_process_request
    )
    print(f"Detection WebSocket server started at ws://0.0.0.0:{PORT}/ws/detection")
    
    # Set up speech websocket service
    speech_ws = await websockets.serve(
        speech_handler,
        "0.0.0.0",
        PORT,  # Use the same port as HTTP
        max_size=20 * 1024 * 1024,
        ping_interval=30,
        ping_timeout=10,
        process_request=handle_process_request
    )
    print(f"Speech WebSocket server started at ws://0.0.0.0:{PORT}/ws/speech")
    
    return [detection_ws, speech_ws]

async def handle_process_request(path, headers):
    """Handle HTTP requests to websocket endpoints"""
    if path == "/":
        # Return HTTP response for health check
        if headers.get("connection") != "Upgrade":
            return 200, {"Content-Type": "text/plain"}, b"Health check OK"
    
    # For WebSocket paths, let the WebSocket handler take over
    if path in ["/ws/detection", "/ws/speech"]:
        return None
    
    # Handle specific health check endpoints
    if path in ["/ws/detection/health", "/ws/speech/health"]:
        return 200, {"Content-Type": "text/plain"}, b"WebSocket endpoint healthy"
    
    # For other paths, return 404
    return 404, {"Content-Type": "text/plain"}, b"Not found"

# Initialize language settings for speech service
async def initialize_speech_service():
    """Initialize speech service with default languages"""
    try:
        speech_service.set_languages('en', 'hi')
        print("Speech service initialized with English and Hindi")
    except Exception as e:
        print(f"Error initializing speech service: {e}")

async def main():
    """Main entry point for Render deployment"""
    print(f"=== Starting IPD-Lingual on Render (PORT={PORT}) ===")
    
    # Initialize speech service
    await initialize_speech_service()
    
    if os.environ.get('RENDER'):
        # On Render, use a hybrid approach with HTTP server for health checks
        # and WebSocket servers for the actual functionality
        http_runner = await setup_http_server()
        websocket_servers = await start_websocket_servers()
        
        # Keep the server running
        try:
            await asyncio.Future()
        finally:
            # Clean up on shutdown
            await http_runner.cleanup()
            for server in websocket_servers:
                server.close()
                await server.wait_closed()
    else:
        # In development, start Flask and WebSocket servers together
        flask_thread = threading.Thread(target=start_flask)
        flask_thread.daemon = True
        flask_thread.start()
        
        websocket_servers = await start_websocket_servers()
        
        # Keep the server running
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")