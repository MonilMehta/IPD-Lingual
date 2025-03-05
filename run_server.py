import threading
import asyncio
from flask import Flask
from utils.user_auth import app

def start_flask_server():
    """Start the Flask server"""
    app.run(host='0.0.0.0', port=5000)

async def start_all_websocket_servers():
    """Start both WebSocket servers concurrently"""
    from utils.detection_service import start_server
    from utils.speech_service import start_speech_server
    
    # Create tasks for both servers
    detection_server = asyncio.create_task(start_server(host='0.0.0.0', port=8765))
    speech_server = asyncio.create_task(start_speech_server(host='0.0.0.0', port=8766))
    
    # Wait for both servers
    await asyncio.gather(detection_server, speech_server)

if __name__ == "__main__":
    print("Starting IPD-Lingual servers...")
    
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=start_flask_server)
    flask_thread.daemon = True
    flask_thread.start()
    print("Flask REST API server started on port 5000")
    
    # Start both WebSocket servers in the main thread
    print("Starting WebSocket servers...")
    try:
        asyncio.run(start_all_websocket_servers())
    except KeyboardInterrupt:
        print("\nServers stopped by user")
    except Exception as e:
        print(f"Error starting servers: {e}")
