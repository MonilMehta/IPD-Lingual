import asyncio
import websockets
import json
import numpy as np
from gensim.models import KeyedVectors
import os
from googletrans import Translator

# Initialize translator
translator = Translator()

# Translation cache to avoid repeated translations
translation_cache = {}

class SpeechTranslationService:
    def __init__(self):
        self.language1 = 'hi'  # Default language 1 (Hindi)
        self.language2 = 'en'  # Default language 2 (English)
        self.translator = Translator()
        self.translation_cache = {}
    
    def set_languages(self, lang1, lang2):
        """Set the language pair for translation"""
        self.language1 = lang1
        self.language2 = lang2
        # Clear cache when languages change
        self.translation_cache = {}
    
    async def translate_text(self, text, from_lang):
        """Translate text between the two configured languages"""
        try:
            # Determine target language based on source language
            to_lang = self.language2 if from_lang == self.language1 else self.language1
            
            # Check cache first
            cache_key = f"{text}_{from_lang}_{to_lang}"
            if cache_key in self.translation_cache:
                return self.translation_cache[cache_key]
            
            # Perform translation
            translation = self.translator.translate(text, src=from_lang, dest=to_lang)
            
            result = {
                "type": "translation",
                "original": {
                    "text": text,
                    "language": from_lang
                },
                "translated": {
                    "text": translation.text,
                    "language": to_lang
                },
                "confidence": getattr(translation, 'confidence', None)
            }
            
            # Cache the result
            self.translation_cache[cache_key] = result
            return result
            
        except Exception as e:
            return {
                "type": "error",
                "message": f"Translation error: {str(e)}",
                "original_text": text,
                "from_language": from_lang
            }

# Create global service instance
speech_service = SpeechTranslationService()

async def handle_websocket(websocket):
    """Handle WebSocket connections"""
    try:
        print(f"Accepted connection from {websocket.remote_address}")
        async for message in websocket:
            try:
                data = json.loads(message)
                
                # Handle language configuration
                if "setLanguages" in data:
                    speech_service.set_languages(data["setLanguages"]["lang1"], data["setLanguages"]["lang2"])
                    await websocket.send(json.dumps({
                        "type": "config",
                        "message": "Languages configured successfully",
                        "languages": {
                            "lang1": speech_service.language1,
                            "lang2": speech_service.language2
                        }
                    }))
                    continue
                
                # Handle speech/text translation
                if "text" in data and "sourceLanguage" in data:
                    print(f"Processing text: {data['text'][:50]}...")
                    result = await speech_service.translate_text(data["text"], data["sourceLanguage"])
                    await websocket.send(json.dumps(result))
                    print("Translation sent")
                else:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Invalid request format. Required fields: 'text' and 'sourceLanguage'"
                    }))
                    
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
                
    except websockets.exceptions.ConnectionClosedError:
        print(f"Connection closed with {websocket.remote_address}")
    except Exception as e:
        print(f"Error handling connection: {str(e)}")

async def start_speech_server(host='0.0.0.0', port=8766):
    """Start the WebSocket server for speech processing"""
    try:
        server = await websockets.serve(
            handle_websocket, 
            host, 
            port,
            max_size=1024*1024*20,  # 20MB max message size
            max_queue=32,           # Increase queue size
            ping_interval=30,       # Send ping every 30 seconds
            ping_timeout=10,        # Wait 10 seconds for pong
            # Add origins for CORS
            origins=[
                'http://localhost:3000',
                'http://localhost:8081',
                'http://127.0.0.1:5000',
                'http://localhost:5000',
                'http://localhost:8765',
                'http://localhost:8766',
                'http://127.0.0.1:3000',
                'https://abdd-49-36-113-134.ngrok-free.app',
                'http://abdd-49-36-113-134.ngrok-free.app',
                'https://2405:201:28:1847:907e:c994:418a:e14d',
                'null',
                '*'
            ]
        )
        print(f"Speech WebSocket server started on ws://{host}:{port}")
        await server.wait_closed()
    except OSError as e:
        if e.errno == 10048:  # Address already in use
            print(f"Port {port} is already in use. Make sure no other service is running on this port.")
        else:
            print(f"Error starting speech server: {str(e)}")
    except Exception as e:
        print(f"Error starting speech server: {str(e)}")

if __name__ == "__main__":
    try:
        asyncio.run(start_speech_server())
    except KeyboardInterrupt:
        print("\nSpeech server stopped by user")
    except Exception as e:
        print(f"Unexpected error: {str(e)}") 