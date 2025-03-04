import asyncio
import json
import cv2
import numpy as np
import websockets
import base64
from pymongo import MongoClient
from decouple import config
from ultralytics import YOLO
from googletrans import Translator
from PIL import Image, ImageDraw, ImageFont
import time
import torch
from utils.model_manager import load_model
from collections import deque
import threading
from websockets.extensions import permessage_deflate
from skimage.metrics import structural_similarity as ssim

# MongoDB connection
client = MongoClient(config('MONGODB_URL'))
db = client['IPDatabase']
language_collection = db['languageSelection']

# Initialize translator
translator = Translator()

# Translation cache to avoid repeated translations
translation_cache = {}

# Maximum allowed message size (increased to handle larger images) - 20MB
MAX_MESSAGE_SIZE = 20 * 1024 * 1024  # 20MB

# Processing settings
MIN_PROCESSING_INTERVAL = 0.5  # Minimum time between processing frames (seconds)
MAX_QUEUE_SIZE = 3  # Maximum number of frames to queue per client
RESPONSE_TIMEOUT = 5.0  # Seconds to wait for a response before timing out

class RateLimiter:
    """Rate limiter for client requests"""
    def __init__(self, rate_limit=2.0):  # Default: 2 frames per second max
        self.rate_limit = rate_limit
        self.last_request_time = {}
    
    def can_process(self, client_id):
        """Check if a client can process a new frame based on rate limit"""
        now = time.time()
        if client_id not in self.last_request_time:
            self.last_request_time[client_id] = now
            return True
        
        time_since_last = now - self.last_request_time[client_id]
        if time_since_last >= 1.0/self.rate_limit:
            self.last_request_time[client_id] = now
            return True
        return False

class DetectionService:
    def __init__(self):
        self.model = None
        self.clients = {}  # Map websocket -> client info (including frame queue)
        self.font_path = "NotoSansDevanagari-VariableFont_wdth,wght.ttf"
        self.font_size = 20
        self.processing = {}  # Track processing status per client
        self.current_language = {}  # Language per client
        self.client_id_counter = 0
        self.rate_limiter = RateLimiter(2.0)  # 2 frames per second max
        self.last_frames = {}  # Store last processed frame per client
        self.last_results = {}  # Store last detection results per client
        self.similarity_threshold = 0.95  # Adjust this value based on your needs (0.0 to 1.0)
        
    async def initialize_model(self):
        # Using your existing YOLOv12l.pt
        print("Loading YOLOv12 model...")
        try:
            self.model = load_model("yolov12l.pt")
            print("Model loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
        
    # Process the frame queue for a specific client
    async def process_queue(self, websocket, client_id):
        """Process frames in the client's queue with rate limiting"""
        while client_id in self.clients:
            client_info = self.clients[client_id]
            
            if client_info['queue'] and not client_info['processing']:
                # Get the next frame from the queue
                client_info['processing'] = True
                frame_data = client_info['queue'].popleft()
                
                try:
                    # Process the frame
                    frame = frame_data['frame']
                    
                    # Handle large images by resizing if necessary
                    h, w = frame.shape[:2]
                    
                    if w > 1280 or h > 720:  # More efficient target resolution
                        # Resize large images
                        scale = min(1280 / w, 720 / h)
                        new_w, new_h = int(w * scale), int(h * scale)
                        frame = cv2.resize(frame, (new_w, new_h))
                    
                    # Process frame
                    results = await self.process_frame(frame, client_id)
                    
                    # Send results back to client if still connected
                    if client_id in self.clients and self.clients[client_id]['websocket'] == websocket:
                        try:
                            await websocket.send(json.dumps({
                                'type': 'detection',
                                'results': results,
                                'processed_at': time.time()
                            }))
                        except websockets.exceptions.ConnectionClosed:
                            break
                except Exception as e:
                    print(f"Error processing frame for client {client_id}: {e}")
                    try:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': f'Error processing frame: {str(e)}'
                        }))
                    except websockets.exceptions.ConnectionClosed:
                        break
                finally:
                    client_info['processing'] = False
            
            # Wait before checking queue again
            await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
    
    def compute_frame_similarity(self, frame1, frame2):
        """Compute similarity between two frames using SSIM"""
        try:
            # Convert frames to grayscale for faster comparison
            gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
            
            # Ensure same size for comparison
            if gray1.shape != gray2.shape:
                gray2 = cv2.resize(gray2, (gray1.shape[1], gray1.shape[0]))
            
            # Compute SSIM between the two images
            score = ssim(gray1, gray2)
            return score
        except Exception as e:
            print(f"Error computing similarity: {e}")
            return 0.0

    async def process_frame(self, frame, client_id):
        """Process a video frame with YOLO detection and translation"""
        try:
            # Check if we have a previous frame to compare with
            if client_id in self.last_frames:
                similarity = self.compute_frame_similarity(frame, self.last_frames[client_id])
                if similarity > self.similarity_threshold and client_id in self.last_results:
                    print(f"Frame similar to previous (score: {similarity:.3f}), reusing results")
                    return self.last_results[client_id]

            # Store current frame for future comparison
            self.last_frames[client_id] = frame.copy()
            
            # Resize for consistent processing
            frame_resized = cv2.resize(frame, (640, 480))
            
            # Run inference with confidence threshold
            results = self.model(frame_resized, conf=0.4)
            
            detection_results = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = self.model.names[cls]
                    
                    # Get client's language
                    target_language = self.current_language.get(client_id, 'en')
                    
                    # Get translation
                    cache_key = f"{label}_{target_language}"
                    if cache_key in translation_cache:
                        translated_label = translation_cache[cache_key]
                    else:
                        try:
                            translated_label = translator.translate(
                                label,
                                dest=target_language
                            ).text
                            translation_cache[cache_key] = translated_label
                        except Exception as e:
                            print(f"Translation error: {e}")
                            translated_label = label
                    
                    detection_results.append({
                        'box': [x1, y1, x2, y2],
                        'class': cls,
                        'label': label,
                        'translated': translated_label,
                        'confidence': conf
                    })
            
            # Store results for future reuse
            self.last_results[client_id] = detection_results
            return detection_results
            
        except Exception as e:
            print(f"Error in processing frame: {e}")
            return []

    async def handler(self, websocket):
        # Assign a unique ID to this client
        client_id = self.client_id_counter
        self.client_id_counter += 1
        
        # Initialize client data
        self.clients[client_id] = {
            'websocket': websocket,
            'queue': deque(maxlen=MAX_QUEUE_SIZE),
            'processing': False,
            'last_frame_time': 0
        }
        self.current_language[client_id] = 'en'  # Default language
        
        print(f"New client {client_id} connected. Total clients: {len(self.clients)}")
        
        try:
            # Start the queue processor for this client
            queue_processor = asyncio.create_task(self.process_queue(websocket, client_id))
            
            async for message in websocket:
                try:
                    # Make sure we don't process extremely large messages
                    if len(message) > MAX_MESSAGE_SIZE:
                        print(f"Warning: Received oversized message ({len(message)/1024/1024:.2f} MB)")
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': f'Image too large, please resize. Maximum allowed: {MAX_MESSAGE_SIZE/1024/1024}MB'
                        }))
                        continue
                        
                    data = json.loads(message)
                    
                    # Handle different message types
                    if data['type'] == 'start':
                        # Start detection if model not loaded
                        if self.model is None:
                            await self.initialize_model()
                        
                        # Set user's preferred language
                        if 'username' in data:
                            user_language = await self.get_user_language(data['username'])
                            self.current_language[client_id] = user_language
                            print(f"Client {client_id}: Set language to {user_language}")
                        
                        await websocket.send(json.dumps({
                            'type': 'status',
                            'message': 'Detection started',
                            'status': 'success'
                        }))
                    
                    elif data['type'] == 'frame':
                        # Check if we're ready to process another frame
                        now = time.time()
                        client_info = self.clients[client_id]
                        
                        # Rate limit check
                        if not self.rate_limiter.can_process(client_id):
                            print(f"Client {client_id}: Rate limited, skipping frame")
                            continue
                            
                        # Queue limit check
                        if len(client_info['queue']) >= MAX_QUEUE_SIZE:
                            print(f"Client {client_id}: Queue full, dropping oldest frame")
                            client_info['queue'].popleft()  # Remove oldest frame
                            
                        try:
                            base64_data = data.get('data', '')
                            
                            # Decode base64 image
                            try:
                                if ',' in base64_data:
                                    parts = base64_data.split(',', 1)
                                    if len(parts) > 1:
                                        img_data = base64.b64decode(parts[1])
                                    else:
                                        img_data = base64.b64decode(parts[0])
                                else:
                                    img_data = base64.b64decode(base64_data)
                            except Exception as e:
                                await websocket.send(json.dumps({
                                    'type': 'error',
                                    'message': f'Error decoding image: {str(e)}'
                                }))
                                continue
                                
                            np_arr = np.frombuffer(img_data, np.uint8)
                            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                            
                            if frame is None:
                                await websocket.send(json.dumps({
                                    'type': 'error',
                                    'message': 'Invalid image data'
                                }))
                                continue
                                
                            # Add frame to queue for processing
                            client_info['queue'].append({
                                'frame': frame,
                                'time': now
                            })
                            
                            print(f"Client {client_id}: Added frame to queue. Queue size: {len(client_info['queue'])}")
                            
                        except Exception as e:
                            print(f"Client {client_id}: Error handling frame: {e}")
                            await websocket.send(json.dumps({
                                'type': 'error',
                                'message': f'Error handling frame: {str(e)}'
                            }))
                    
                    elif data['type'] == 'set_language':
                        self.current_language[client_id] = data['language']
                        await websocket.send(json.dumps({
                            'type': 'status',
                            'message': f'Language set to {data["language"]}',
                            'status': 'success'
                        }))
                    
                    elif data['type'] == 'stop':
                        await websocket.send(json.dumps({
                            'type': 'status',
                            'message': 'Detection stopped',
                            'status': 'success'
                        }))
                        break
                
                except json.JSONDecodeError:
                    print("Error: Invalid JSON message received")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Invalid JSON format'
                    }))
                except KeyError as e:
                    print(f"Error: Missing key in message: {e}")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': f'Missing required field: {e}'
                    }))
                except Exception as e:
                    print(f"Error processing message: {e}")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': f'Error: {str(e)}'
                    }))
        
        except websockets.exceptions.ConnectionClosed as e:
            print(f"Client {client_id} disconnected with code {e.code}, reason: {e.reason}")
        finally:
            # Clean up client resources
            if 'queue_processor' in locals():
                queue_processor.cancel()
            if client_id in self.clients:
                del self.clients[client_id]
            if client_id in self.current_language:
                del self.current_language[client_id]
            if client_id in self.last_frames:
                del self.last_frames[client_id]
            if client_id in self.last_results:
                del self.last_results[client_id]
                
            print(f"Client {client_id} removed. Total clients: {len(self.clients)}")
    
    async def get_user_language(self, username):
        """Fetch user's preferred language from database"""
        language_data = language_collection.find_one({"username": username})
        if language_data and 'language' in language_data:
            return language_data['language']
        return 'en'  # Default to English

async def start_server(host='0.0.0.0', port=8765):
    detection_service = DetectionService()
    # Update WebSocket server with increased max message size and max queue
    server = await websockets.serve(
        detection_service.handler, 
        host, 
        port,
        max_size=MAX_MESSAGE_SIZE,  # Set maximum message size to match our constant
        max_queue=32,               # Increase the message queue size
        ping_interval=30,           # Send ping every 30 seconds
        ping_timeout=10,             # Wait 10 seconds for pong before closing
        # extensions=[permessage_deflate.ServerPerMessageDeflateFactory(
        #     max_window_bits=15,
        #     compression_level=9
        # )],
        # Add origins for CORS (modify as needed)
        origins=[
            'http://localhost:3000',
            'http://localhost:8081',
            'http://127.0.0.1:3000',
            'https://abdd-49-36-113-134.ngrok-free.app',  # Add your ngrok URL
            'http://abdd-49-36-113-134.ngrok-free.app',  # Add your ngrok URL
            'https://2405:201:28:1847:907e:c994:418a:e14d',  # Your IPv6 address
            'null',
            '*'
        ]
    )
    print(f"WebSocket server started at ws://{host}:{port}")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(start_server())