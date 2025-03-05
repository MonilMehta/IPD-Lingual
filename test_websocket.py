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
    uri = "ws://localhost:8765"
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
    """Test the speech processing WebSocket service"""
    uri = "ws://localhost:8766"
    try:
        async with websockets.connect(
            uri,
            origin="http://localhost:5000",
            user_agent_header="Mozilla/5.0"
        ) as websocket:
            print(f"\nConnected to speech service at {uri}")
            
            # First set up the languages
            config_message = {
                "setLanguages": {
                    "lang1": "hi",  # Hindi
                    "lang2": "en"   # English
                }
            }
            await websocket.send(json.dumps(config_message))
            response = await websocket.recv()
            print(f"Language config response: {response}")
            
            # Process audio files
            audio_files = {
                'sports.wav': 'hi',     # Hindi audio
                'conference.wav': 'en'  # English audio
            }
            recognizer = sr.Recognizer()
            
            for audio_file, expected_lang in audio_files.items():
                if not os.path.exists(audio_file):
                    print(f"Warning: {audio_file} not found")
                    continue
                
                print(f"\nProcessing {audio_file} (Expected language: {expected_lang})...")
                
                try:
                    # Convert audio to text
                    with sr.AudioFile(audio_file) as source:
                        print("Reading audio...")
                        audio = recognizer.record(source)
                        print(f"Converting to text (language: {expected_lang})...")
                        
                        # Use language-specific recognition
                        if expected_lang == 'hi':
                            text = recognizer.recognize_google(audio, language='hi-IN')
                        else:
                            text = recognizer.recognize_google(audio, language='en-US')
                            
                        print(f"Transcribed text: {text}")
                        
                        # Send the transcribed text with the known language
                        message = {
                            "text": text,
                            "sourceLanguage": expected_lang
                        }
                        print(f"Sending text with source language: {expected_lang}")
                        await websocket.send(json.dumps(message))
                        
                        # Wait for translation response
                        response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        result = json.loads(response)
                        print("\nTranslation result:")
                        print(f"Original ({result['original']['language']}): {result['original']['text']}")
                        print(f"Translated ({result['translated']['language']}): {result['translated']['text']}")
                        
                except sr.UnknownValueError:
                    print("Speech recognition could not understand the audio")
                except sr.RequestError as e:
                    print(f"Could not request results from speech recognition service; {e}")
                except asyncio.TimeoutError:
                    print("Timeout waiting for translation response")
                except Exception as e:
                    print(f"Error processing audio: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed - Make sure the speech WebSocket server is running")
    except Exception as e:
        print(f"An error occurred with speech service: {str(e)}")

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
    uri = "ws://localhost:8766"
    try:
        async with websockets.connect(
            uri,
            origin="http://localhost:5000",
            user_agent_header="Mozilla/5.0"
        ) as websocket:
            print("\nTesting audio processing service...")
            
            # Wait for initialization message
            init_response = await websocket.recv()
            init_data = json.loads(init_response)
            print(f"Initialization response: {json.dumps(init_data, indent=2)}")
            
            # Process conference.wav file
            audio_file = 'conference.wav'
            if not os.path.exists(audio_file):
                print(f"Error: {audio_file} not found")
                return
                
            print(f"\nProcessing {audio_file}...")
            
            try:
                # Read the audio file and convert to base64
                with open(audio_file, 'rb') as file:
                    audio_data = base64.b64encode(file.read()).decode('utf-8')
                
                # Send the audio data
                message = {
                    "audio": audio_data
                }
                print("Sending audio data...")
                await websocket.send(json.dumps(message))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                result = json.loads(response)
                
                print("\nProcessing Results:")
                print(f"Original Language: {result['original']['language']}")
                print(f"Original Text: {result['original']['text']}")
                print(f"Translated Language: {result['translated']['language']}")
                print(f"Translated Text: {result['translated']['text']}")
                
            except asyncio.TimeoutError:
                print("Timeout waiting for response")
            except Exception as e:
                print(f"Error processing audio: {str(e)}")
            
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed - Make sure the speech WebSocket server is running")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

async def main():
    print("Starting WebSocket tests...")
    print("Note: Two different WebSocket services will be tested:")
    print("1. Object Detection Service on ws://localhost:8765")
    print("2. Speech Processing Service on ws://localhost:8766")
    
    try:
        # Test audio processing first
        await test_audio_processing()
        
        # Then test other services
        # await test_object_detection_websocket()
        # await test_speech_websocket()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    print("Starting WebSocket test client...")
    asyncio.get_event_loop().run_until_complete(main()) 