import asyncio
import websockets
import json
import numpy as np
import os
from googletrans import Translator
import speech_recognition as sr
import base64
import io
import re
import wave
import pydub
from functools import partial
import tempfile
import whisper  # Import OpenAI Whisper
import torch

# Initialize translator and recognizer
translator = Translator()
recognizer = sr.Recognizer()

# Translation cache to avoid repeated translations
translation_cache = {}

# Initialize Whisper model (load once at startup)
print("Loading Whisper model...")
try:
    # Check for CUDA availability
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    # Load the model (choose size based on your needs and resources)
    # Options: "tiny", "base", "small", "medium", "large", "large-v2"
    whisper_model = whisper.load_model("small", device=device)  # Upgrade from base to small for better accuracy
    print("Whisper model loaded successfully")
except Exception as e:
    print(f"Warning: Failed to load Whisper model: {str(e)}")
    whisper_model = None

def detect_hindi_patterns(text):
    """Detect if text contains Hindi patterns"""
    # Check for Devanagari characters
    devanagari_pattern = re.compile(r'[\u0900-\u097F]')
    if devanagari_pattern.search(text):
        return True
        
    # Common Hindi words and patterns (case-insensitive)
    hindi_patterns = [
        r'\b(mein|mei|me|hai|hain|ka|ki|ke|ko|se|ne|aur|par|main|nahin|nahi|kya|tha|thi|ho|koi|kuch|yeh|woh|aap|tum)\b',
        r'\b(apne|apni|apna|unka|unki|unke|iska|iski|iske|uska|uski|uske)\b',
        r'\b(karna|karna|kiya|hui|hua|hue|raha|rahi|rahe|gaya|gayi|gaye)\b',
        r'\b(kahan|kya|kyun|kaise|kaun|kab|kidhar)\b',
        r'\b(aur|ya|ki|ke|ka|mein|mei|me|se|ko|ne|par|tak|bhi|hi|to|ki|ke)\b',
        r'\b(ek|do|teen|char|paanch|subah|dopahar|sham|raat)\b',
        r'\b(bahut|thoda|jyada|kam|accha|bura|theek)\b',
        r'\b(ji|shri|smt|raja|rani|beta|beti|putra|putri)\b'
    ]
    
    patterns = [re.compile(pattern, re.IGNORECASE) for pattern in hindi_patterns]
    words = text.split()
    hindi_word_count = sum(1 for word in words if any(pattern.search(word) for pattern in patterns))
    
    return (hindi_word_count / len(words)) > 0.2 if words else False

def convert_aac_to_wav(aac_bytes):
    """Convert AAC audio bytes to WAV format"""
    try:
        # Save AAC data to temporary file
        temp_aac = io.BytesIO(aac_bytes)
        
        # Convert AAC to WAV using pydub
        audio = pydub.AudioSegment.from_file(temp_aac, format="aac")
        
        # Export as WAV to memory
        wav_io = io.BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)
        
        # Calculate duration in seconds
        duration = len(audio) / 1000.0  # pydub uses milliseconds
        
        # Return WAV file-like object and metadata
        return wav_io, {
            'channels': audio.channels,
            'sample_width': audio.sample_width,
            'framerate': audio.frame_rate,
            'duration': duration,
            'n_frames': len(audio.get_array_of_samples())
        }
    except Exception as e:
        raise Exception(f"Error converting AAC to WAV: {str(e)}")

class SpeechTranslationService:
    def __init__(self):
        self.translator = Translator()
        self.recognizer = sr.Recognizer()
        self.translation_cache = {}
        self.whisper_model = whisper_model
        
        # Adjust recognizer settings for better accuracy
        self.recognizer.energy_threshold = 300
        self.dynamic_energy_threshold = True
        self.pause_threshold = 0.8
        
        # Supported languages with their codes and script patterns
        self.supported_languages = {
            'hi': {'name': 'Hindi', 'code': 'hi-IN', 'whisper_code': 'hi'},
            'en': {'name': 'English', 'code': 'en-US', 'whisper_code': 'en'},
            'es': {'name': 'Spanish', 'code': 'es-ES', 'whisper_code': 'es'},
            'fr': {'name': 'French', 'code': 'fr-FR', 'whisper_code': 'fr'},
            'de': {'name': 'German', 'code': 'de-DE', 'whisper_code': 'de'},
            'ja': {'name': 'Japanese', 'code': 'ja-JP', 'whisper_code': 'ja'},
            'ko': {'name': 'Korean', 'code': 'ko-KR', 'whisper_code': 'ko'},
            'zh': {'name': 'Chinese', 'code': 'zh-CN', 'whisper_code': 'zh'},
            'ar': {'name': 'Arabic', 'code': 'ar-AE', 'whisper_code': 'ar'},
            'ru': {'name': 'Russian', 'code': 'ru-RU', 'whisper_code': 'ru'},
            'gu': {'name': 'Gujarati', 'code': 'gu-IN', 'whisper_code': 'gu'},
            'mr': {'name': 'Marathi', 'code': 'mr-IN', 'whisper_code': 'mr'},
            'kn': {'name': 'Kannada', 'code': 'kn-IN', 'whisper_code': 'kn'}
        }
        
        # Language validation parameters
        self.validation_rules = {
            'en': {'min_confidence': 0.7, 'min_ratio': 0.6},
            'hi': {'min_confidence': 0.6, 'min_ratio': 0.4},
            'gu': {'min_confidence': 0.6, 'min_ratio': 0.4},
            'mr': {'min_confidence': 0.6, 'min_ratio': 0.4},
            'kn': {'min_confidence': 0.6, 'min_ratio': 0.4},
            'ja': {'min_confidence': 0.7, 'min_chars': 2},
            'de': {'min_confidence': 0.8, 'min_ratio': 0.7},
            'es': {'min_confidence': 0.7, 'min_ratio': 0.6},
            'fr': {'min_confidence': 0.7, 'min_ratio': 0.6},
            'zh': {'min_confidence': 0.7, 'min_chars': 2},
            'ko': {'min_confidence': 0.7, 'min_chars': 2},
            'ar': {'min_confidence': 0.7, 'min_ratio': 0.5},
            'ru': {'min_confidence': 0.7, 'min_ratio': 0.6}
        }
        
        # Language settings
        self.language1 = None
        self.language2 = None

    def set_languages(self, lang1, lang2):
        """Set the source and target languages for translation"""
        # Validate languages
        if lang1 not in self.supported_languages:
            raise ValueError(f"Unsupported language: {lang1}")
        if lang2 not in self.supported_languages:
            raise ValueError(f"Unsupported language: {lang2}")
        if lang1 == lang2:
            raise ValueError("Languages must be different")
            
        self.language1 = lang1
        self.language2 = lang2
        print(f"Languages set to {self.supported_languages[lang1]['name']} and {self.supported_languages[lang2]['name']}")
        return True

    def transcribe_with_whisper(self, audio_path):
        """
        Transcribe audio using Whisper model with automatic language detection
        Returns detected language, transcription, and confidence
        """
        if not self.whisper_model:
            raise ValueError("Whisper model not available")
            
        try:
            print(f"Transcribing with Whisper (auto language detection)")
            
            # Load audio and pad/trim it to fit 30 seconds
            audio = whisper.load_audio(audio_path)
            audio = whisper.pad_or_trim(audio)
            
            # Make log-Mel spectrogram and move to the same device as the model
            mel = whisper.log_mel_spectrogram(audio).to(self.whisper_model.device)
            
            # Detect the spoken language
            _, probs = self.whisper_model.detect_language(mel)
            detected_lang = max(probs, key=probs.get)
            lang_probability = probs[detected_lang]
            
            print(f"Whisper detected language: {detected_lang} (probability: {lang_probability:.2f})")
            
            # Transcribe with the detected language
            options = whisper.DecodingOptions(language=detected_lang, fp16=torch.cuda.is_available())
            result = whisper.decode(self.whisper_model, mel, options)
            
            # Get the transcription
            transcription = result.text.strip()
            
            print(f"Whisper transcription: {transcription}")
            
            return detected_lang, transcription, lang_probability
            
        except Exception as e:
            print(f"Whisper transcription error: {str(e)}")
            raise

    def validate_script(self, text, lang_code):
        """
        Validate if the text uses the expected script for the language
        Returns True if the script is valid, False otherwise
        """
        if not text:
            return False
        
        # Script patterns for different languages
        script_patterns = {
            'hi': r'[\u0900-\u097F]',  # Devanagari for Hindi
            'en': r'[a-zA-Z]',         # Latin for English
            'ja': r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]',  # Japanese scripts
            'zh': r'[\u4e00-\u9fff]',  # Chinese characters
            'ar': r'[\u0600-\u06ff]',  # Arabic script
            'ru': r'[\u0400-\u04ff]',  # Cyrillic for Russian
            'ko': r'[\uac00-\ud7af\u1100-\u11ff]',  # Korean Hangul
            'gu': r'[\u0A80-\u0AFF]',  # Gujarati script
            'mr': r'[\u0900-\u097F]',  # Devanagari for Marathi
            'kn': r'[\u0C80-\u0CFF]',  # Kannada script
        }
        
        # For languages that use Latin script
        latin_script_langs = ['en', 'es', 'fr', 'de']
        
        # Get the appropriate script pattern
        if lang_code in latin_script_langs:
            pattern = script_patterns['en']  # Latin script
        elif lang_code in script_patterns:
            pattern = script_patterns[lang_code]
        else:
            # Default to Latin script for unknown languages
            pattern = script_patterns['en']
        
        # Count characters that match the expected script
        script_chars = re.findall(pattern, text)
        total_chars = len(text.strip())
        
        if total_chars == 0:
            return False
        
        # Calculate the ratio of matching characters
        script_ratio = len(script_chars) / total_chars
        
        # Special case for Hindi: check for Urdu script (Arabic) which is often confused
        if lang_code == 'hi' and script_ratio < 0.5:
            # Check if it's using Arabic script (Urdu)
            arabic_chars = re.findall(script_patterns['ar'], text)
            if len(arabic_chars) / total_chars > 0.5:
                print("Detected Urdu script in Hindi transcription")
                return False
        
        # For most languages, require at least 50% of characters to match the expected script
        threshold = 0.5
        
        # Special case for languages with mixed scripts
        if lang_code == 'ja':  # Japanese can mix scripts
            threshold = 0.3
        
        return script_ratio >= threshold

    def correct_common_phrases(self, text, lang_code):
        """Apply corrections for commonly misrecognized phrases"""
        if not text:
            return text
        
        # Common Hindi greetings and phrases that might be misrecognized
        hindi_corrections = {
            # Greetings
            r'(?i)namaste\s*ab\s*ke\s*se\s*ho': 'नमस्ते आप कैसे हो',
            r'(?i)namaste\s*abke\s*seho': 'नमस्ते आप कैसे हो',
            r'(?i)namaste\s*abgesero': 'नमस्ते आप कैसे हो',
            r'(?i)namaste\s*ap\s*kaise\s*ho': 'नमस्ते आप कैसे हो',
            r'(?i)namaste\s*aap\s*kaise\s*ho': 'नमस्ते आप कैसे हो',
            
            # Other common phrases
            r'(?i)mera\s*naam': 'मेरा नाम',
            r'(?i)aap\s*ka\s*naam': 'आपका नाम',
            r'(?i)kya\s*hal\s*hai': 'क्या हाल है',
            r'(?i)theek\s*h[au][io]n': 'ठीक हूँ',
            r'(?i)dhanyavad': 'धन्यवाद',
            r'(?i)shukriya': 'शुक्रिया'
        }
        
        # Apply corrections based on language
        if lang_code == 'hi':
            for pattern, replacement in hindi_corrections.items():
                if re.search(pattern, text, re.IGNORECASE):
                    print(f"Applying Hindi phrase correction: '{text}' -> '{replacement}'")
                    return replacement
        
        return text

    def process_audio(self, audio_data, audio_format="wav"):
        """Process audio data with Whisper for enhanced recognition"""
        try:
            print(f"Processing {audio_format} audio data...")
            
            # Validate audio size
            if len(audio_data) > 5000000:
                raise ValueError("Audio file too large (max 500KB)")
                
            audio_bytes = base64.b64decode(audio_data)
            
            # Create a temporary file for Whisper processing
            with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as temp_file:
                temp_path = temp_file.name
                temp_file.write(audio_bytes)
            
            try:
                # Use Whisper for transcription with auto language detection
                if self.whisper_model:
                    detected_lang, transcription, confidence = self.transcribe_with_whisper(temp_path)
                    
                    # Check for common phrases that might need correction
                    corrected_text = self.correct_common_phrases(transcription, detected_lang)
                    if corrected_text != transcription:
                        transcription = corrected_text
                        # If we applied a Hindi correction, force the language to Hindi
                        if detected_lang != 'hi' and any(char in transcription for char in '[\u0900-\u097F]'):
                            detected_lang = 'hi'
                            print(f"Applied Hindi correction, forcing language to Hindi")
                    
                    # Map Whisper language code to our language code
                    whisper_to_our_lang = {info['whisper_code']: code for code, info in self.supported_languages.items()}
                    our_lang_code = whisper_to_our_lang.get(detected_lang)
                    
                    # Check if the script matches the expected script for the language
                    script_valid = self.validate_script(transcription, detected_lang)
                    print(f"Script validation for {detected_lang}: {'Passed' if script_valid else 'Failed'}")
                    
                    # Force transcription if needed
                    if not our_lang_code or our_lang_code not in [self.language1, self.language2] or not script_valid:
                        if not script_valid:
                            print(f"Script mismatch for {detected_lang}. Forcing transcription in configured languages.")
                        else:
                            print(f"Whisper detected {detected_lang} which is not in our configured languages")
                        
                        # Try to force transcription with our configured languages
                        print("Trying forced transcription with configured languages")
                        
                        # Load audio for forced transcription
                        audio = whisper.load_audio(temp_path)
                        audio = whisper.pad_or_trim(audio)
                        mel = whisper.log_mel_spectrogram(audio).to(self.whisper_model.device)
                        
                        best_transcription = ""  # Start with empty string instead of original transcription
                        best_lang_code = self.language1  # Default to first language
                        best_confidence = 0
                        
                        # Try both configured languages
                        for lang_code in [self.language1, self.language2]:
                            whisper_code = self.supported_languages[lang_code]['whisper_code']
                            try:
                                options = whisper.DecodingOptions(language=whisper_code, fp16=torch.cuda.is_available())
                                result = whisper.decode(self.whisper_model, mel, options)
                                forced_transcription = result.text.strip()
                                
                                print(f"Forced {lang_code} transcription: {forced_transcription}")
                                
                                # Validate script for forced transcription
                                forced_script_valid = self.validate_script(forced_transcription, whisper_code)
                                print(f"Forced script validation: {'Passed' if forced_script_valid else 'Failed'}")
                                
                                # Only consider valid script transcriptions
                                if forced_script_valid and forced_transcription and (not best_transcription or len(forced_transcription) > len(best_transcription)):
                                    best_transcription = forced_transcription
                                    best_lang_code = lang_code
                                    best_confidence = 0.7  # Arbitrary confidence for forced transcription
                            except Exception as e:
                                print(f"Forced transcription with {lang_code} failed: {str(e)}")
                        
                        # Use the best forced transcription if we found one
                        if best_transcription:
                            transcription = best_transcription
                            our_lang_code = best_lang_code
                            print(f"Using forced transcription: {transcription}")
                        else:
                            # If forced transcription failed, fall back to original but map to one of our languages
                            our_lang_code = self.language1
                            print(f"Forced transcription failed, falling back to {our_lang_code}")
                            
                            # Try one more time with a direct transcription in our first language
                            try:
                                options = whisper.DecodingOptions(
                                    language=self.supported_languages[our_lang_code]['whisper_code'], 
                                    fp16=torch.cuda.is_available()
                                )
                                result = whisper.decode(self.whisper_model, mel, options)
                                fallback_transcription = result.text.strip()
                                if fallback_transcription:
                                    transcription = fallback_transcription
                                    print(f"Using fallback transcription: {transcription}")
                            except Exception as e:
                                print(f"Fallback transcription failed: {str(e)}")
                    
                    person = self.get_person(our_lang_code)
                    print(f"Final language: {our_lang_code}, Person: {person}")
                    print(f"Final transcription: {transcription}")
                    return transcription, our_lang_code, person
                
                # Fallback to Google Speech Recognition if Whisper fails or is not available
                print("\nFalling back to Google Speech Recognition")
                
                # Convert to WAV format if needed for Google Speech API
                if audio_format.lower() == "aac":
                    wav_io, metadata = convert_aac_to_wav(audio_bytes)
                else:  # Assume WAV format
                    wav_io = io.BytesIO(audio_bytes)
                    wav_io.seek(0)
                
                with sr.AudioFile(wav_io) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source)
                    audio = self.recognizer.record(source)
                    
                    # Try recognition in both configured languages
                    results = {}
                    
                    for lang_code in [self.language1, self.language2]:
                        try:
                            text = self.recognizer.recognize_google(
                                audio, 
                                language=self.supported_languages[lang_code]['code']
                            )
                            results[lang_code] = text
                            print(f"Google recognized ({lang_code}): {text}")
                        except Exception as e:
                            print(f"Google recognition failed for {lang_code}: {str(e)}")
                    
                    # If we have results, use the one from the first language
                    if results:
                        for lang_code in [self.language1, self.language2]:
                            if lang_code in results:
                                return results[lang_code], lang_code, self.get_person(lang_code)
                
                raise ValueError("Speech recognition failed with all methods")
                
            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_path)
                except:
                    pass
                
        except Exception as e:
            raise Exception(f"Error processing audio: {str(e)}")

    def get_person(self, detected_lang):
        """Return person identifier based on detected language"""
        return "1" if detected_lang == self.language1 else "2"

    async def translate_text(self, text, from_lang, person):
        """Translate text between the configured languages using Translator.translate directly"""
        try:
            if not self.language1 or not self.language2:
                raise ValueError("Languages not configured")
                
            to_lang = self.language2 if from_lang == self.language1 else self.language1
            
            cache_key = f"{text}_{from_lang}_{to_lang}"
            if cache_key in self.translation_cache:
                translation_text = self.translation_cache[cache_key]
            else:
                # Call the translation synchronously.
                translation = self.translator.translate(text, src=from_lang, dest=to_lang)
                # If the result is a coroutine, await it.
                if asyncio.iscoroutine(translation):
                    translation = await translation
                if not hasattr(translation, 'text'):
                    raise ValueError("Invalid translation response")
                translation_text = translation.text
                translation_text = translation_text.replace('\x00', '').strip()
                self.translation_cache[cache_key] = translation_text
            
            return {
                "type": "translation",
                "person": person,
                "original": {"text": text, "language": from_lang},
                "translated": {"text": translation_text, "language": to_lang},
                "languageSettings": {
                    "language1": self.language1,
                    "language2": self.language2
                }
            }
            
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            print(f"Translation Error: {error_msg}")
            return {
                "type": "error",
                "message": f"Translation failed: {error_msg}",
                "person": person
            }


# Create global service instance
speech_service = SpeechTranslationService()

async def handle_websocket(websocket):
    """Handle WebSocket connections for the speech translation service"""
    # Use the global service instance instead of creating a new one
    try:
        # Send initialization message
        init_message = {
            "type": "initialization",
            "status": "connected",
            "supportedLanguages": {code: info['name'] for code, info in speech_service.supported_languages.items()},
            "supportedFormats": ["aac"],
            "maxAudioSizeBytes": 500000,  # 500KB
            "currentSettings": {
                "language1": speech_service.language1,
                "language2": speech_service.language2
            }
        }
        await websocket.send(json.dumps(init_message))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                #print(f"Received message: {json.dumps(data)[:100]}...")  # Print just the start of the message to avoid huge logs
                
                # Handle language setting
                if "setLanguages" in data:
                    lang1 = data["setLanguages"]["language1"]
                    lang2 = data["setLanguages"]["language2"]
                    
                    try:
                        speech_service.set_languages(lang1, lang2)
                        await websocket.send(json.dumps({
                            "type": "languageSettings",
                            "status": "success",
                            "message": f"Languages set to {speech_service.supported_languages[lang1]['name']} and {speech_service.supported_languages[lang2]['name']}",
                            "settings": {
                                "language1": lang1,
                                "language2": lang2
                            }
                        }))
                    except ValueError as e:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": str(e)
                        }))
                
                # Handle text input (for direct text translation)
                elif "text" in data and "language" in data:
                    if not speech_service.language1 or not speech_service.language2:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": "Languages must be set before sending text"
                        }))
                        continue
                    
                    text = data["text"]
                    source_lang = data["language"]
                    person = "1" if source_lang == speech_service.language1 else "2"
                    
                    if not text:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": "Empty text data"
                        }))
                        continue
                    
                    try:
                        # Translate text directly
                        translation = await speech_service.translate_text(text, source_lang, person)
                        await websocket.send(json.dumps(translation))
                        
                    except Exception as e:
                        error_message = f"Error translating text: {str(e)}"
                        print(error_message)
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": error_message
                        }))
                
                # Handle audio processing
                elif "audio" in data:
                    if not speech_service.language1 or not speech_service.language2:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": "Languages must be set before sending audio"
                        }))
                        continue
                    
                    audio_format = data.get("format", "aac")
                    audio_data = data["audio"]
                    
                    if not audio_data:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": "Empty audio data"
                        }))
                        continue
                    
                    try:
                        # Process audio to get text and language using Whisper
                        text, detected_lang, person = await asyncio.to_thread(
                            speech_service.process_audio, audio_data, audio_format
                        )
                        print(f"Detected {detected_lang} text: {text[:30]}... ")
                        
                        # Translate text
                        translation = await speech_service.translate_text(text, detected_lang, person)
                        await websocket.send(json.dumps(translation))
                        print("Translation sent")
                        
                    except Exception as e:
                        error_message = f"Error processing audio: {str(e)}"
                        print(error_message)
                        await websocket.send(json.dumps({
                            "type": "error",
                            "status": "failed",
                            "message": error_message
                        }))
                else:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "status": "failed",
                        "message": "Invalid request format. Expected 'setLanguages', 'text', or 'audio' in the message."
                    }))
                    
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "type": "error",
                    "status": "failed",
                    "message": "Invalid JSON format in request"
                }))
            except Exception as e:
                print(f"Error processing request: {str(e)}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "status": "failed",
                    "message": f"Error processing request: {str(e)}"
                }))
                
    except websockets.exceptions.ConnectionClosed:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.send(json.dumps({
                "type": "error",
                "status": "failed",
                "message": f"WebSocket error: {str(e)}"
            }))
        except:
            pass

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