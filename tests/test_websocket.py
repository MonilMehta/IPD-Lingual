import asyncio
import websockets
import json
import speech_recognition as sr
import wave
import os
import base64
from PIL import Image
import io
from langdetect import detect
import re

# Common headers for WebSocket connections
WEBSOCKET_HEADERS = {
    "Origin": "http://localhost:5000",
    "User-Agent": "Mozilla/5.0"
}

async def test_object_detection_websocket():
    """Test the object detection WebSocket service"""
    uri = "ws://localhost:8765/camera"
    try:
        async with websockets.connect(
            uri,
            origin="http://localhost:5000",
            user_agent_header="Mozilla/5.0"
        ) as websocket:
            print(f"\nConnected to object detection service at {uri}")
            
            # Process image file
            image_path = "yolo_test.jpg"
            if not os.path.exists(image_path):
                print(f"Error: {image_path} not found")
                return
            
            print(f"Processing {image_path}...")
            encoded_image = image_path
            if encoded_image:
                # Send the image for detection
                message = {
                    "type": "detect",
                    "image": encoded_image
                }
                await websocket.send(json.dumps(message))
                print("Image sent for detection")
                
                # Wait for response
                response = await websocket.recv()
                detections = json.loads(response)
                print("\nDetection Results:")
                if isinstance(detections, list):
                    for det in detections:
                        print(f"- Found {det['class']} with confidence {det['confidence']:.2f}")
                else:
                    print(detections)
            
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed - Make sure the object detection WebSocket server is running")
    except Exception as e:
        print(f"An error occurred with object detection service: {str(e)}")

def detect_language(text):
    """
    Improved language detection for Hindi/English text.
    Returns 'hi' for Hindi, 'en' for English
    """
    # Check for Devanagari characters (Hindi)
    devanagari_pattern = re.compile(r'[\u0900-\u097F]')
    if devanagari_pattern.search(text):
        return 'hi'
        
    # Common Hindi words and patterns (case-insensitive)
    hindi_patterns = [
        # Common Hindi words in Roman script
        r'\b(mein|mei|me|hai|hain|ka|ki|ke|ko|se|ne|aur|par|main|nahin|nahi|kya|tha|thi|ho|koi|kuch|yeh|woh|aap|tum)\b',
        # More Hindi words
        r'\b(apne|apni|apna|unka|unki|unke|iska|iski|iske|uska|uski|uske)\b',
        # Common verbs
        r'\b(karna|karna|kiya|hui|hua|hue|raha|rahi|rahe|gaya|gayi|gaye)\b',
        # Question words
        r'\b(kahan|kya|kyun|kaise|kaun|kab|kidhar)\b',
        # Postpositions and conjunctions
        r'\b(aur|ya|ki|ke|ka|mein|mei|me|se|ko|ne|par|tak|bhi|hi|to|ki|ke)\b',
        # Numbers and time-related
        r'\b(ek|do|teen|char|paanch|subah|dopahar|sham|raat)\b',
        # Common phrases
        r'\b(bahut|thoda|jyada|kam|accha|bura|theek)\b',
        # Honorifics and relations
        r'\b(ji|shri|smt|raja|rani|beta|beti|putra|putri)\b',
        # Common endings
        r'(kar|kar ke|ne ke|ne ka|ne ki|kar di|kar diya)\b'
    ]
    
    # Make all patterns case-insensitive
    hindi_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in hindi_patterns]
    
    # Count Hindi words
    words = text.split()
    hindi_word_count = sum(
        1 for word in words
        if any(pattern.search(word) for pattern in hindi_patterns)
    )
    total_words = len(words)
    
    # Lower threshold to 20% for Hindi detection
    if total_words > 0 and (hindi_word_count / total_words) > 0.2:
        return 'hi'
        
    try:
        # Use langdetect as fallback, with some context hints
        # Add some Hindi context words to help detection
        context_text = text + " namaste aur dhanyavaad"
        detected = detect(context_text)
        return 'hi' if detected in ['hi', 'ne', 'mr'] else 'en'
    except:
        # If the text contains common Hindi words but detection failed, consider it Hindi
        if any(pattern.search(text) for pattern in hindi_patterns):
            return 'hi'
        # Default to English if all detection methods fail
        return 'en'
async def test_speech_websocket():
    """Test the speech processing WebSocket service with proper initialization handling"""
    uri = "ws://localhost:8766"
    audio_files = {
        'conference.wav': 'en',  # English audio
        'sports.wav': 'hi'   # Hindi audio
    }
    
    try:
        async with websockets.connect(
            uri,
            origin="http://localhost:5000",
            user_agent_header="Mozilla/5.0",
            ping_timeout=20  # Increased timeout for debugging
        ) as websocket:
            print(f"\nConnected to speech service at {uri}")
            
            # Step 1: Receive server initialization message
            init_response = await websocket.recv()
            print("Received initialization message from server")
            
            # Step 2: Configure languages
            config_message = {
                "setLanguages": {
                    "language1": "en",
                    "language2": "hi"
                }
            }
            await websocket.send(json.dumps(config_message))
            config_response = await websocket.recv()
            print(f"Language configuration confirmed: {config_response}")
            
            # Step 3: Process test audio files
            for audio_file, expected_lang in audio_files.items():
                if not os.path.exists(audio_file):
                    print(f"\n⛔ Test file not found: {audio_file}")
                    continue
                
                print(f"\n🔊 Processing {audio_file} (expecting {expected_lang.upper()})...")
                
                try:
                    # Read and encode audio file
                    with open(audio_file, 'rb') as f:
                        audio_data = base64.b64encode(f.read()).decode('utf-8')
                    
                    # Construct and send audio message
                    audio_message = {
                        "audio": audio_data,
                        "format": "wav"
                    }
                    await websocket.send(json.dumps(audio_message))
                    
                    # Receive and process response with timeout
                    response = await asyncio.wait_for(websocket.recv(), timeout=15.0)
                    result = json.loads(response)
                    
                    # Handle response
                    if result.get('type') == 'error':
                        print(f"❌ Error processing audio: {result.get('message', 'Unknown error')}")
                    else:
                        print("\n✅ Translation Results:")
                        print(f"Original ({result['original']['language']}): {result['original']['text']}")
                        print(f"Translated ({result['translated']['language']}): {result['translated']['text']}")
                        print(f"Speaker: Person {result.get('person', 'Unknown')}")
                        
                except asyncio.TimeoutError:
                    print(f"⌛ Timeout waiting for response on {audio_file}")
                except Exception as e:
                    print(f"⚠️ Unexpected error processing {audio_file}: {str(e)}")
                    
            print("\nTest sequence completed")
            
    except websockets.exceptions.ConnectionClosed as cc:
        print(f"🔌 Connection closed unexpectedly: {cc.reason} (code: {cc.code})")
    except Exception as e:
        print(f"🔥 Critical error in test session: {str(e)}")

def convert_audio_to_text(audio_file, language='hi-IN'):
    """Convert WAV audio file to text using speech recognition with specified language"""
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_file) as source:
            print(f"Reading audio from {audio_file}...")
            audio = recognizer.record(source)
            print(f"Converting audio to text (language: {language})...")
            text = recognizer.recognize_google(audio, language=language)
            return text
    except sr.UnknownValueError:
        print(f"Could not understand audio in {audio_file}")
    except sr.RequestError as e:
        print(f"Could not request results from speech recognition service; {e}")
    except Exception as e:
        print(f"Error processing {audio_file}: {e}")
    return None

async def test_audio_processing():
    """Test the audio processing functionality with conference.wav"""
    uri = "ws://localhost:8765/voice"
    try:
        async with websockets.connect(uri) as websocket:
            print("\nTesting audio processing service...")
            
            # Wait for initialization message
            init_response = await websocket.recv()
            init_data = json.loads(init_response)
            print(f"Initialization response: {json.dumps(init_data, indent=2)}")
            
            # Set languages first
            config_message = {
                "setLanguages": {
                    "language1": "en",
                    "language2": "hi"
                }
            }
            await websocket.send(json.dumps(config_message))
            config_response = await websocket.recv()
            print(f"Language config response: {config_response}")
            
            audio_file = 'conference.wav'
            if not os.path.exists(audio_file):
                print(f"Error: {audio_file} not found")
                return
            
            print(f"\nProcessing {audio_file}...")
            
            try:
                with open(audio_file, 'rb') as file:
                    audio_data = base64.b64encode(file.read()).decode('utf-8')
                
                message = {
                    "audio": audio_data,
                    "format": "wav"
                }
                print("Sending audio data...")
                
                # Send audio with improved timeout handling
                try:
                    await websocket.send(json.dumps(message))
                    response = await asyncio.wait_for(
                        websocket.recv(),
                        timeout=15.0  # Increased timeout
                    )
                    result = json.loads(response)
                    
                    # Add response validation
                    if result.get("type") == "error":
                        print(f"Error: {result.get('message')}")
                    elif "translated" not in result:
                        print("Invalid response format")
                    else:
                        # Verify language direction
                        if result['original']['language'] != 'en':
                            print("Warning: Unexpected language detection!")
                        print("\nProcessing Results:")
                        print(f"Original ({result['original']['language']}): {result['original']['text']}")
                        print(f"Translated ({result['translated']['language']}): {result['translated']['text']}")
                        
                except asyncio.TimeoutError:
                    print("Translation timeout - check server load")
                except Exception as e:
                    print(f"Error processing audio: {str(e)}")
                
            except Exception as e:
                print(f"Error processing audio: {str(e)}")
            
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed - Make sure the speech WebSocket server is running")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

# Update main execution
async def main():
    print("Starting WebSocket tests...")
    print("Note: Two different WebSocket services will be tested:")
    print("1. Object Detection Service on ws://localhost:8765")
    print("2. Speech Processing Service on ws://localhost:8765")
    
    try:
        
        await test_speech_websocket()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    print("Starting WebSocket test client...")
    # Use modern asyncio.run() instead of get_event_loop()
    asyncio.run(main())