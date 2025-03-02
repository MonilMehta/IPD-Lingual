import asyncio
import threading
from flask import Flask
import subprocess
import sys

def start_flask_server():
    """Start the Flask REST API server"""
    from utils.user_auth import app
    app.run(host="0.0.0.0", port=5000, debug=False)

def start_websocket_server():
    """Start the WebSocket server for continuous detection"""
    from utils.detection_service import start_server
    asyncio.run(start_server(host='0.0.0.0', port=8765))

if __name__ == "__main__":
    print("Starting IPD-Lingual servers...")
    
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=start_flask_server)
    flask_thread.daemon = True
    flask_thread.start()
    print("Flask REST API server started on port 5000")
    
    # Start WebSocket server in the main thread
    print("Starting WebSocket server...")
    start_websocket_server()
