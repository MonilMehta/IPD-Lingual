import os
import asyncio
import json
import logging
from fastapi import FastAPI, WebSocket, Request, HTTPException, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.middleware.wsgi import WSGIMiddleware
from utils.detection_service import DetectionService
from utils.speech_service import handle_websocket as speech_websocket_handler, speech_service
from utils.user_auth import app as flask_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("asgi")

# Initialize services
detection_service = DetectionService()

# Create FastAPI app
app = FastAPI(title="IPD-Lingual API")

# Initialize speech service
async def initialize_speech_service():
    """Initialize speech service with default languages"""
    try:
        speech_service.set_languages('en', 'hi')
        logger.info("Speech service initialized with English and Hindi")
        return True
    except Exception as e:
        logger.error(f"Error initializing speech service: {e}")
        return False

# Home page with WebSocket info
@app.get("/", response_class=HTMLResponse)
async def home():
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
                <code>wss://[your-domain]/ws/detection</code>
            </div>
            
            <div class="endpoint">
                <h3>Speech WebSocket:</h3>
                <code>wss://[your-domain]/ws/speech</code>
            </div>
            
            <p>Use these endpoints with a WebSocket client to connect to the service.</p>
            <p>For API documentation, see <a href="/docs">/docs</a>.</p>
        </body>
    </html>
    """

# Health check endpoint for Render
@app.head("/")
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# WebSocket endpoints
@app.websocket("/ws/detection")
async def detection_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        logger.info("Detection WebSocket connection established")
        await detection_service.handler(websocket)
    except WebSocketDisconnect:
        logger.info("Detection WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in detection WebSocket: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass

@app.websocket("/ws/speech")
async def speech_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        logger.info("Speech WebSocket connection established")
        await speech_websocket_handler(websocket)
    except WebSocketDisconnect:
        logger.info("Speech WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in speech WebSocket: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass

# Mount Flask app for all other routes
app.mount("/api", WSGIMiddleware(flask_app))

# Startup event to initialize services
@app.on_event("startup")
async def startup_event():
    await initialize_speech_service()
    logger.info("ASGI server started with FastAPI + Flask integration")

# For direct execution (development mode)
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)