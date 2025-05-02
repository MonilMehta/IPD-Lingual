import threading
import asyncio
# from flask import Flask # No longer needed directly here
from utils.user_auth import app # Import the Flask app instance
from hypercorn.config import Config
from hypercorn.asyncio import serve
# from hypercorn.middleware import AsyncioWSGIMiddleware # No longer needed

# Removed start_flask_server function

# Removed start_all_websocket_servers function

async def main():
    print("Starting IPD-Lingual ASGI server with Hypercorn...")
    config = Config()
    config.bind = ["0.0.0.0:5000"] # Bind to the same port as before
    # Serve the Flask app directly (Flask >= 2.0 supports ASGI)
    await serve(app, config)

if __name__ == "__main__":
    # Run the asyncio event loop with the main async function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
