import asyncio
import json
import cv2
import numpy as np
# import websockets # Removed websocket import
import base64
from pymongo import MongoClient
from decouple import config
import time
import aiohttp
# from collections import deque # Removed deque import
from skimage.metrics import structural_similarity as ssim
from googletrans import Translator # Ensure Translator is imported
from PIL import Image, ImageDraw, ImageFont
import io

# MongoDB connection (Keep if needed for language or other settings)
client = MongoClient(config('MONGODB_URL'))
db = client['IPDatabase']
language_collection = db['languageSelection']

# Initialize translator
translator = Translator()

# Translation cache (optional but recommended)
translation_cache = {}

class DetectionService:
    def __init__(self):
        # Removed WebSocket client management attributes
        # self.clients = {}
        # self.processing = {}
        # self.client_id_counter = 0
        # self.rate_limiter = RateLimiter(2.0)
        # self.last_frames = {}
        # self.last_results = {}
        # self.client_translation_cache = {}

        # Keep attributes relevant to API/translation if needed elsewhere
        self.font_path = "NotoSansDevanagari-VariableFont_wdth,wght.ttf"
        self.font_size = 20
        # Removed self.current_language as language is now passed per request
        self.similarity_threshold = 0.95 # Keep if frame similarity check is used elsewhere
        self.use_hf_api = True # Keep as it controls API usage

    async def translate_text(self, text, target_language):
        """Translates text using googletrans with caching."""
        print(f"[DEBUG] Attempting translation: '{text}' -> '{target_language}'") # DEBUG
        if target_language == 'en': # No need to translate if target is English
            print("[DEBUG] Target is 'en', skipping translation.") # DEBUG
            return text
        cache_key = (text, target_language)
        if cache_key in translation_cache:
            print("[DEBUG] Found in cache.") # DEBUG
            return translation_cache[cache_key]
        try:
            # Use asyncio.to_thread for the blocking translation call
            translated = await asyncio.to_thread(translator.translate, text, dest=target_language)
            translated_text = translated.text
            print(f"[DEBUG] Translation result: '{translated_text}'") # DEBUG
            translation_cache[cache_key] = translated_text # Cache the result
            return translated_text
        except Exception as e:
            print(f"[DEBUG] Translation error for '{text}' to {target_language}: {e}") # DEBUG
            return text # Return original text on error

    async def detect_objects_api(self, frame, profile='kids', confidence='0.3', iou='0.6', target_language='en', username=None): # Add target_language and username
        """Detect objects in a frame using Hugging Face Spaces API and translate labels."""
        try:
            # Convert OpenCV frame to PIL Image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)

            # Convert PIL image to JPEG bytes in memory
            buffered = io.BytesIO()
            pil_image.save(buffered, format="JPEG", quality=95)
            image_bytes = buffered.getvalue()

            # Prepare multipart/form-data payload
            space_url = "https://monilm-lingual.hf.space/api/detect_objects"
            form_data = aiohttp.FormData()
            form_data.add_field('image', image_bytes, filename='image.jpg', content_type='image/jpeg')
            # Use provided parameters or defaults
            form_data.add_field('profile', profile)
            form_data.add_field('confidence', confidence)
            form_data.add_field('iou', iou)

            # Call Hugging Face Spaces API with form data
            async with aiohttp.ClientSession() as session:
                # Send POST request with FormData
                async with session.post(space_url, data=form_data, timeout=30) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"API Error {response.status}: {error_text}")

                    result = await response.json()

                    if result.get("status") == "error":
                        raise Exception(f"Detection error: {result.get('message')}")

            # Process and translate results
            detections = []
            api_objects = result.get("objects", [])
            for obj in api_objects:
                if "box" in obj:
                    x1 = obj["box"].get("x1", 0)
                    y1 = obj["box"].get("y1", 0)
                    x2 = obj["box"].get("x2", 0)
                    y2 = obj["box"].get("y2", 0) # Corrected typo here from x2 to y2
                    label = obj.get("class_name", "unknown")

                    # Translate the label
                    translated_label = await self.translate_text(label, target_language)

                    detections.append({
                        "box": [int(x1), int(y1), int(x2), int(y2)],
                        "class": obj.get("class", 0), # Keep original class if available
                        "label": label, # Original English label
                        "translated": translated_label, # Changed key from translated_label to translated
                        "confidence": obj.get("confidence", 0.0)
                    })

            # Construct the final response structure (similar to your original format)
            final_response = {
                "objects": detections,
                "count": len(detections),
                "profile_used": result.get("profile_used", profile),
                "classes_used": result.get("classes_used", []), # Pass through from API if available
                "status": "success",
                "message": None,
                "target_language": target_language # Include the language used for translation
            }
            return final_response

        except aiohttp.ClientError as e:
            print(f"API call failed: {str(e)}.")
            # Return error structure
            return {"status": "error", "message": f"Detection API connection error: {str(e)}", "objects": []}
        except Exception as e:
            print(f"Error in API detection/translation: {str(e)}")
            import traceback
            traceback.print_exc() # Print full traceback for debugging
            # Return error structure
            return {"status": "error", "message": f"Internal server error: {str(e)}", "objects": []}

# Example usage (optional, for testing the API call directly)
# async def main():
#     # Load a test image (replace with your image loading logic)
#     test_image_path = '../tests/test_image.jpg' # Adjust path as needed
#     if not os.path.exists(test_image_path):
#         print(f"Test image not found at {test_image_path}")
#         return
#     frame = cv2.imread(test_image_path)
#     if frame is None:
#         print("Failed to load test image.")
#         return
#
#     service = DetectionService()
#     try:
#         results = await service.detect_objects_api(frame, profile='general', confidence='0.5', iou='0.5')
#         print("Detection Results:")
#         print(json.dumps(results, indent=2))
#     except Exception as e:
#         print(f"Error during test: {e}")
#
# if __name__ == "__main__":
#     import os # Add os import if using the example
#     asyncio.run(main())