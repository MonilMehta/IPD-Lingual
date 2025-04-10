import asyncio
import json
import cv2
import numpy as np  # Fixed import from 'np' to 'numpy as np'
import websockets
import base64
from pymongo import MongoClient
from decouple import config
import time
# import torch  # Commented out for API-only mode
import aiohttp
from collections import deque
from skimage.metrics import structural_similarity as ssim
from googletrans import Translator
from PIL import Image, ImageDraw, ImageFont
import io

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
        self.client_translation_cache = {}  # Separate translation cache per client
        self.use_hf_api = True  # Always use Hugging Face API
        
    async def initialize_model(self):
        # We're always using the HF API, so no need to load local models
        print("Using Hugging Face Spaces API for object detection")
        return True
            
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

    async def detect_objects_api(self, frame):
        """Detect objects in a frame using Hugging Face Spaces API"""
        try:
            # Convert OpenCV frame to PIL Image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            
            # Convert to base64
            buffered = io.BytesIO()
            pil_image.save(buffered, format="JPEG", quality=95)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            # Prepare API request
            space_url = "https://monilm-lingual.hf.space/api/detect_objects"
            payload = {
                "image": img_base64,
                "confidence": 0.25  # Default confidence threshold
            }
            
            # Call Hugging Face Spaces API
            async with aiohttp.ClientSession() as session:
                async with session.post(space_url, json=payload, timeout=30) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"API Error {response.status}: {error_text}")
                    
                    result = await response.json()
                    
                    if result.get("status") == "error":
                        raise Exception(f"Detection error: {result.get('message')}")
                    
                    # Convert API response format to our internal format
                    detections = []
                    for obj in result.get("objects", []):
                        # Extract coordinates
                        if "box" in obj:
                            x1 = obj["box"].get("x1", 0)
                            y1 = obj["box"].get("y1", 0)
                            x2 = obj["box"].get("x2", 0)
                            y2 = obj["box"].get("y2", 0)
                            
                            detections.append({
                                "box": [int(x1), int(y1), int(x2), int(y2)],
                                "class": obj.get("class", 0),
                                "label": obj.get("class_name", "unknown"),
                                "translated": obj.get("class_name", "unknown"),  # Will be translated later
                                "confidence": obj.get("confidence", 0.0)
                            })
                    
                    return detections
                    
        except aiohttp.ClientError as e:
            print(f"API call failed: {str(e)}.")
            raise Exception(f"Detection API error: {str(e)}")
        except Exception as e:
            print(f"Error in API detection: {str(e)}")
            raise

    async def process_frame(self, frame, client_id):
        """Process a video frame with object detection and translation"""
        try:
            # Check if we have a previous frame to compare with
            if client_id in self.last_frames:
                similarity = self.compute_frame_similarity(frame, self.last_frames[client_id])
                if (similarity > self.similarity_threshold and 
                    client_id in self.last_results):
                    print(f"Frame similar to previous (score: {similarity:.3f}), reusing results")
                    return self.last_results[client_id]

            # Store current frame for future comparison
            self.last_frames[client_id] = frame.copy()
            
            # Get detections using API
            detection_results = await self.detect_objects_api(frame)
            
            # Get client's language for translation
            target_language = self.current_language.get(client_id, 'en')
            
            # Initialize client's translation cache if not exists
            if client_id not in self.client_translation_cache:
                self.client_translation_cache[client_id] = {}
            
            # Translate labels
            for item in detection_results:
                label = item['label']
                
                # Get translation using client-specific cache
                cache_key = f"{label}_{target_language}"
                if cache_key in self.client_translation_cache[client_id]:
                    translated_label = self.client_translation_cache[client_id][cache_key]
                else:
                    try:
                        translation = await self.translate_text(label, target_language)
                        translated_label = translation
                        self.client_translation_cache[client_id][cache_key] = translated_label
                    except Exception as e:
                        print(f"Translation error: {e}")
                        translated_label = label
                
                item['translated'] = translated_label
            
            # Store results for future reuse
            self.last_results[client_id] = detection_results
            return detection_results
            
        except Exception as e:
            print(f"Error in processing frame: {e}")
            return []

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
                        # API-only mode: Initialize the model (which sets up API mode)
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
                        old_language = self.current_language.get(client_id, 'en')
                        new_language = data['language']
                        
                        # Only update if language actually changed
                        if old_language != new_language:
                            self.current_language[client_id] = new_language
                            # Clear the translation cache for this client when language changes
                            if client_id in self.client_translation_cache:
                                self.client_translation_cache[client_id] = {}
                            print(f"Client {client_id}: Language changed from {old_language} to {new_language}")
                        
                        await websocket.send(json.dumps({
                            'type': 'status',
                            'message': f'Language set to {new_language}',
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
            if client_id in self.client_translation_cache:
                del self.client_translation_cache[client_id]
                
            print(f"Client {client_id} removed. Total clients: {len(self.clients)}")
    
    async def get_user_language(self, username):
        """Fetch user's preferred language from database"""
        language_data = language_collection.find_one({"username": username})
        if language_data and 'language' in language_data:
            return language_data['language']
        return 'en'  # Default to English

    async def translate_text(self, text, target_language):
        """Translate text to target language using API to avoid coroutine issues"""
        try:
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_language}&dt=t&q={text}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        return text
                    
                    data = await response.json()
                    translated = ''
                    
                    # Extract translation from response
                    for sentence in data[0]:
                        if sentence[0]:
                            translated += sentence[0]
                            
                    return translated or text
        except Exception as e:
            print(f"Translation API error: {e}")
            return text

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
    )
    print(f"WebSocket server started at ws://{host}:{port}")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(start_server())