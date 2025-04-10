import threading
import asyncio
import os
from flask import Flask
from utils.user_auth import app

def start_flask_server():
    """Start the Flask server"""
    # In production, Render will set PORT env var and handle the web server
    # In development, we'll run our own server
    if os.environ.get('RENDER'):
        # When running on Render, this function won't actually start the server
        # as Render uses gunicorn to serve the app
        pass
    else:
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

async def start_all_websocket_servers():
    """Start both WebSocket servers concurrently"""
    from utils.detection_service import start_server
    from utils.speech_service import start_speech_server
   
    # Create tasks for both servers
    detection_server = asyncio.create_task(start_server(host='0.0.0.0', port=int(os.environ.get('DETECTION_PORT', 8765))))
    speech_server = asyncio.create_task(start_speech_server(host='0.0.0.0', port=int(os.environ.get('SPEECH_PORT', 8766))))
   
    # Wait for both servers
    await asyncio.gather(detection_server, speech_server)

def run_websocket_servers():
    """Run the websocket servers in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(start_all_websocket_servers())
    except Exception as e:
        print(f"Error in WebSocket servers: {e}")
    finally:
        loop.close()

# This needs to be at the module level for gunicorn to find it
websocket_thread = threading.Thread(target=run_websocket_servers)
websocket_thread.daemon = True
websocket_thread.start()
print("WebSocket servers starting in background thread")

if __name__ == "__main__":
    print("Starting IPD-Lingual servers...")
   
    # Start Flask directly when running the script locally
    start_flask_server()