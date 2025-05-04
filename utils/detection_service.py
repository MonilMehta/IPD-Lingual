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
        #print(f"[DEBUG] Attempting translation: '{text}' -> '{target_language}'") # DEBUG
        if target_language == 'en': # No need to translate if target is English
            #print("[DEBUG] Target is 'en', skipping translation.") # DEBUG
            return text
        cache_key = (text, target_language)
        if cache_key in translation_cache:
            #print("[DEBUG] Found in cache.") # DEBUG
            return translation_cache[cache_key]
        try:
            # Directly await the translate coroutine
            translated = await translator.translate(text, dest=target_language)
            translated_text = translated.text
            #print(f"[DEBUG] Translation result: '{translated_text}'") # DEBUG
            translation_cache[cache_key] = translated_text # Cache the result
            return translated_text
        except Exception as e:
            #print(f"[DEBUG] Translation error for '{text}' to {target_language}: {e}") # DEBUG
            # Optionally log the full traceback for better error diagnosis
            import traceback
            traceback.print_exc()
            return text # Return original text on error

    async def detect_objects_api(self, frame, profile='kids', target_language='en', username=None): # Remove confidence and iou
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

            # --- Optimization: Translate unique labels once ---
            api_objects = result.get("objects", [])
            unique_labels_en = set(obj.get("label_en") for obj in api_objects if "box" in obj)

            # Translate unique labels concurrently
            translation_tasks = {
                label: self.translate_text(label, target_language)
                for label in unique_labels_en
            }
            # Wait for all translations to complete
            translated_labels_map = {}
            for label, task in translation_tasks.items():
                try:
                    translated_labels_map[label] = await task
                except Exception as trans_err:
                    print(f"[WARN] Failed to translate label '{label}': {trans_err}")
                    translated_labels_map[label] = label # Fallback to original on error

            # --- End Optimization ---

            # Process results using the pre-translated map
            detections = []
            # api_objects = result.get("objects", []) # Already defined above
            print(f"[DEBUG] API response: {json.dumps(api_objects, indent=2)}") # DEBUG log the full response
            for obj in api_objects:
                # Check if 'box' exists and is a list with 4 elements
                if "box" in obj and isinstance(obj["box"], list) and len(obj["box"]) == 4:
                    # Box format is [x, y, width, height]
                    x1 = obj["box"][0]
                    y1 = obj["box"][1]
                    width = obj["box"][2]
                    height = obj["box"][3]
                    x2 = x1 + width # Calculate x2
                    y2 = y1 + height # Calculate y2

                    label_en = obj.get("label_en") # Assuming class_name is still the key for the label

                    # Get the translated label from the map
                    translated_label = translated_labels_map.get(label_en, label_en) # Use map, fallback to original

                    centre = [x1 + width // 2, y1 + height // 2]

                    detections.append({
                        "box": [int(x1), int(y1), int(width), int(height)], # Keep the [x, y, w, h] format
                        "centre": centre,
                        "label_en": label_en, # Original English label
                        "label": translated_label # Potentially translated label
                        # Confidence removed as per previous request
                    })
                elif "box" in obj: # Log if box format is unexpected
                    print(f"[WARN] Unexpected box format received: {obj['box']}")


            # Construct the final response structure (similar to your original format)
            final_response = {
                "objects": detections,
                "count": len(detections),
                "profile_used": result.get("profile_used", profile),
                # "classes_used": result.get("classes_used", []), # Pass through from API if available
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