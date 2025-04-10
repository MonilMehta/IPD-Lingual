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
import aiohttp  # Add aiohttp for API calls
from functools import partial

# Initialize translator and recognizer
translator = Translator()
recognizer = sr.Recognizer()

# Translation cache to avoid repeated translations
translation_cache = {}

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
        
        # Adjust recognizer settings for better accuracy
        self.recognizer.energy_threshold = 300
        self.dynamic_energy_threshold = True
        self.pause_threshold = 0.8
        
        # Supported languages with their codes and script patterns
        self.supported_languages = {
            'hi': {'name': 'Hindi', 'code': 'hi-IN', 'script': r'[\u0900-\u097F]'},
            'en': {'name': 'English', 'code': 'en-US', 'script': r'[a-zA-Z]'},
            'es': {'name': 'Spanish', 'code': 'es-ES', 'script': r'[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]'},
            'fr': {'name': 'French', 'code': 'fr-FR', 'script': r'[a-zA-ZàâäæçéèêëîïôœùûüÿÀÂÄÆÇÉÈÊËÎÏÔŒÙÛÜŸ]'},
            'de': {'name': 'German', 'code': 'de-DE', 'script': r'[a-zA-ZäöüßÄÖÜ]'},
            'ja': {'name': 'Japanese', 'code': 'ja-JP', 'script': r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]'},
            'ko': {'name': 'Korean', 'code': 'ko-KR', 'script': r'[\uac00-\ud7af\u1100-\u11ff]'},
            'zh': {'name': 'Chinese', 'code': 'zh-CN', 'script': r'[\u4e00-\u9fff]'},
            'ar': {'name': 'Arabic', 'code': 'ar-AE', 'script': r'[\u0600-\u06ff]'},
            'ru': {'name': 'Russian', 'code': 'ru-RU', 'script': r'[\u0400-\u04ff]'},
            'gu': {'name': 'Gujarati', 'code': 'gu-IN', 'script': r'[\u0A80-\u0AFF]'},
            'mr': {'name': 'Marathi', 'code': 'mr-IN', 'script': r'[\u0900-\u097F]'},
            'kn': {'name': 'Kannada', 'code': 'kn-IN', 'script': r'[\u0C80-\u0CFF]'}
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

    def detect_language(self, audio):
        """
        Detect language from audio using configured languages.
        Returns language code, transcribed text, and person identifier.
        """
        print("\n=== Speech Recognition Results ===")
        print("Attempting transcription in both languages:")
        
        results = {}
        
        # Try both languages first to see transcription results
        for lang_code in [self.language1, self.language2]:
            lang_name = self.supported_languages[lang_code]['name']
            try:
                # First attempt with show_all=False to get direct text
                transcript = self.recognizer.recognize_google(
                    audio, 
                    language=self.supported_languages[lang_code]['code']
                )
                print(f"  {lang_name}: {transcript}")
                
                # Now try again with show_all=True to get confidence
                detailed_result = self.recognizer.recognize_google(
                    audio,
                    language=self.supported_languages[lang_code]['code'],
                    show_all=True
                )
                
                # Initialize default confidence
                confidence = 0
                
                # Extract confidence from detailed result if available
                if isinstance(detailed_result, dict) and detailed_result.get('alternative'):
                    # Google API format when confidence is available
                    if 'confidence' in detailed_result:
                        confidence = detailed_result['confidence']
                    elif detailed_result['alternative'] and 'confidence' in detailed_result['alternative'][0]:
                        confidence = detailed_result['alternative'][0]['confidence']
                
                results[lang_code] = {
                    'transcript': transcript,
                    'confidence': confidence
                }
                
            except Exception as e:
                print(f"  {lang_name}: Recognition failed ({str(e)})")
        
        print("\nFinal Detection:")
        
        # Process the recognition results in detail
        best_lang = None
        best_confidence = 0
        best_transcript = ""
        
        for lang_code in [self.language1, self.language2]:
            if lang_code not in results:
                continue
                
            transcript = results[lang_code]['transcript']
            confidence = results[lang_code]['confidence']
            
            print(f"Recognition attempt for {lang_code}:")
            print(f"  Confidence: {confidence}")
            print(f"  Text: {transcript}")
            
            # Get validation and script scores
            try:
                is_valid = self.validate_transcript(transcript, lang_code)
                script_score = self.calculate_script_match(transcript, lang_code)
                
                # Log the validation results
                print(f"  Script match score: {script_score:.2f}")
                print(f"  Validation result: {'Passed' if is_valid else 'Failed'}")
                
                if confidence > 0:
                    # When we have confidence score, use it as primary factor
                    if is_valid and confidence >= self.validation_rules.get(lang_code, {}).get('min_confidence', 0.6):
                        if confidence > best_confidence:
                            best_lang = lang_code
                            best_confidence = confidence
                            best_transcript = transcript
                else:
                    # When confidence is 0 for both, use script matching as deciding factor
                    if is_valid and script_score > 0:
                        # Only update if we don't have a valid result yet or this one is better
                        if best_lang is None or script_score > results.get(best_lang, {}).get('script_score', 0):
                            best_lang = lang_code
                            best_transcript = transcript
                            # Store script score for comparison
                            results[lang_code]['script_score'] = script_score
            except Exception as e:
                print(f"  Validation failed: {str(e)}")
        
        # If we found a valid language, return it
        if best_lang:
            print(f"Selected language: {best_lang} based on {'confidence score' if best_confidence > 0 else 'script analysis'}")
            return best_lang, best_transcript, self.get_person(best_lang)
            
        # Special handling for Hindi phrases in Latin script
        if self.language1 == 'hi' or self.language2 == 'hi':
            for lang_code in [self.language1, self.language2]:
                if lang_code not in results:
                    continue
                    
                transcript = results[lang_code]['transcript']
                # Check if this could be Hindi written in Latin script
                if self.detect_transliterated_hindi(transcript):
                    print(f"Detected transliterated Hindi in: {transcript}")
                    return 'hi', transcript, self.get_person('hi')
        
        # If still no valid results, try again with fallback approach
        for lang_code in [self.language1, self.language2]:
            try:
                transcript = self.recognizer.recognize_google(
                    audio,
                    language=self.supported_languages[lang_code]['code']
                )
                
                # Validate using script detection only for fallback
                is_valid = self.fallback_validate(transcript, lang_code)
                if is_valid:
                    return lang_code, transcript, self.get_person(lang_code)
            except:
                continue
                
        # If everything else fails, return the first language as a last resort
        if results.get(self.language1):
            return self.language1, results[self.language1]['transcript'], self.get_person(self.language1)
        elif results.get(self.language2):
            return self.language2, results[self.language2]['transcript'], self.get_person(self.language2)
            
        raise Exception("Could not recognize speech confidently")

    def calculate_script_match(self, text, lang_code):
        """Calculate how well the text matches the expected script for the language"""
        if not text:
            return 0
            
        lang_info = self.supported_languages.get(lang_code, {})
        script_pattern = lang_info.get('script', r'[a-zA-Z]')
        
        # Count characters that match the language script
        script_chars = re.findall(script_pattern, text)
        total_chars = len(text.strip())
        
        if total_chars == 0:
            return 0
            
        # Return ratio of matching characters to total characters
        return len(script_chars) / total_chars
        
    def detect_transliterated_hindi(self, text):
        """Detect if text is likely Hindi transliterated in Latin script"""
        if not text:
            return False
            
        # Common Hindi words in Latin script
        hindi_words = [
            r'\b(main|mein|mai|hoon|hun|hai|hain|tha|thi|the)\b',  # Common verbs
            r'\b(aap|tum|tu|hum|ham|ye|woh|yeh|voh|vo)\b',  # Pronouns
            r'\b(ka|ki|ke|ko|se|mein|par|tak)\b',  # Postpositions
            r'\b(kya|kyun|kaise|kahan|kab|kaun)\b',  # Question words
            r'\b(aur|lekin|phir|kyunki|isliye)\b',  # Conjunctions
            r'\b(accha|theek|bura|acha)\b',  # Adjectives
            r'\b(bahut|thoda|jyada|kam)\b',  # Adverbs
            r'\b(ghar|naam|baat|din|raat|subah|shaam)\b',  # Common nouns
            r'\b(rahata|rahna|karna|khana|pina|sona|jana)\b',  # Common verb forms
            r'\b(mera|tera|hamara|tumhara|apna|uska)\b',  # Possessives
            r'\b(bhai|behen|mata|pita|chacha|maa|baap)\b',  # Family relations
        ]
        
        # Count matches
        match_count = 0
        word_count = len(text.split())
        
        for pattern in hindi_words:
            if re.search(pattern, text, re.IGNORECASE):
                match_count += 1
                
        # If more than 35% of common Hindi patterns are found, it's likely Hindi
        return match_count > 0 and (match_count / max(word_count, 1)) >= 0.35
        
    def validate_transcript(self, text, lang_code):
        """
        Validate if transcript matches expected patterns for the language.
        Now accepts only the text string, not the full recognition result.
        """
        if not text or not isinstance(text, str):
            return False
            
        # Get validation rules for this language
        rules = self.validation_rules.get(lang_code, {})
        lang_info = self.supported_languages.get(lang_code, {})
        
        # Check script composition based on language
        script_pattern = lang_info.get('script', r'[a-zA-Z]')
        script_chars = re.findall(script_pattern, text)
        total_chars = len(text.strip())
        
        # Skip very short texts
        if total_chars < 2:
            return False
            
        # For languages that require specific character counts
        if 'min_chars' in rules:
            return len(script_chars) >= rules['min_chars']
            
        # For languages that use character ratio validation
        if 'min_ratio' in rules and total_chars > 0:
            script_ratio = len(script_chars) / total_chars
            
            # Special handling for languages that might share scripts
            if lang_code == 'hi':
                return detect_hindi_patterns(text) or script_ratio >= rules['min_ratio'] or self.detect_transliterated_hindi(text)
            elif lang_code == 'mr':
                # Marathi should have Devanagari script but not too many Hindi patterns
                return script_ratio >= rules['min_ratio'] and not detect_hindi_patterns(text)
                
            return script_ratio >= rules['min_ratio']
            
        # Default case
        return True
        
    def fallback_validate(self, text, lang_code):
        """
        Simplified validation for fallback cases, focusing on script detection
        """
        if not text:
            return False
            
        lang_info = self.supported_languages.get(lang_code, {})
        script_pattern = lang_info.get('script', r'[a-zA-Z]')
        
        # Check if text contains characters from the language's script
        if lang_code == 'hi':
            return detect_hindi_patterns(text)
        elif lang_code == 'en':
            # For English, make sure it's mostly Latin characters
            latin_chars = re.findall(r'[a-zA-Z]', text)
            return len(latin_chars) / max(len(text), 1) > 0.7
        elif lang_code == 'ja':
            # For Japanese, require at least some Japanese characters
            japanese_chars = re.findall(r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]', text)
            return len(japanese_chars) > 0
        elif lang_code == 'gu':
            # For Gujarati, check for Gujarati script
            return bool(re.search(r'[\u0A80-\u0AFF]', text))
        else:
            # Default case: just check if the script pattern appears
            return bool(re.search(script_pattern, text))
    
    def get_person(self, detected_lang):
        """Return person identifier based on detected language"""
        return "1" if detected_lang == self.language1 else "2"
        
    async def process_audio(self, audio_data, audio_format="wav"):
        """Process audio data using Hugging Face Space API instead of local processing"""
        try:
            print(f"Processing {audio_format} audio data via Hugging Face API...")
            
            # Prepare API request to Hugging Face Space
            space_url = "https://monilm-lingual.hf.space/api/transcribe"
            payload = {
                "audio": audio_data,  # Already base64 encoded
                "format": audio_format,
                "language": self.language1  # Set source language or None for auto-detection
            }
            
            # Use aiohttp for async API calls
            async with aiohttp.ClientSession() as session:
                try:
                    async with session.post(space_url, json=payload, timeout=30) as response:
                        if response.status != 200:
                            error_text = await response.text()
                            raise Exception(f"API Error {response.status}: {error_text}")
                        
                        result = await response.json()
                        
                        if result.get("status") == "error":
                            raise Exception(f"Transcription error: {result.get('message')}")
                        
                        text = result.get("text")
                        detected_lang = result.get("language", self.language1)
                        person = self.get_person(detected_lang)
                        
                        print(f"Selected Language: {detected_lang}")
                        print(f"Transcribed Text: {text}")
                        print("=================================")
                        
                        return text, detected_lang, person
                except aiohttp.ClientError as e:
                    # Fall back to local processing if API is unavailable
                    print(f"API call failed: {str(e)}. Falling back to local processing.")
                    return await self._local_process_audio(audio_data, audio_format)
                    
        except Exception as e:
            raise Exception(f"Error processing audio: {str(e)}")

    async def _local_process_audio(self, audio_data, audio_format="wav"):
        """Legacy method for local audio processing as fallback"""
        try:
            print(f"Processing {audio_format} audio data locally...")
            audio_bytes = base64.b64decode(audio_data)
            
            # Handle different audio formats
            if (audio_format.lower() == "aac"):
                if not hasattr(pydub, "AudioSegment"):
                    raise RuntimeError("pydub not installed properly")
                wav_io, metadata = convert_aac_to_wav(audio_bytes)
            else:  # Assume WAV format
                wav_io = io.BytesIO(audio_bytes)
                wav_io.seek(0)
            
            with sr.AudioFile(wav_io) as source:
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.record(source)
                detected_lang, text, person = self.detect_language(audio)
                
                if not text:
                    raise ValueError("No speech detected in audio")
                    
                print(f"Selected Language: {detected_lang}")
                print(f"Transcribed Text: {text}")
                print("=================================")
                return text, detected_lang, person
                
        except Exception as e:
            raise Exception(f"Error in local audio processing: {str(e)}")
        
    async def translate_text(self, text, from_lang, person):
        """Translate text between the configured languages using API directly to avoid coroutine issues"""
        try:
            if not self.language1 or not self.language2:
                raise ValueError("Languages not configured")
                
            to_lang = self.language2 if from_lang == self.language1 else self.language1
            
            cache_key = f"{text}_{from_lang}_{to_lang}"
            if cache_key in self.translation_cache:
                translation_text = self.translation_cache[cache_key]
            else:
                # Use Google Translate API directly
                url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={from_lang}&tl={to_lang}&dt=t&q={text}"
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status != 200:
                            raise ValueError(f"Translation API error: {response.status}")
                        
                        data = await response.json()
                        translation_text = ''
                        
                        # Extract translation from response
                        for sentence in data[0]:
                            if sentence[0]:
                                translation_text += sentence[0]
                        
                        if not translation_text:
                            raise ValueError("Empty translation response")
                        
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
                        # Process audio to get text and language
                        text, detected_lang, person = await speech_service.process_audio(audio_data, audio_format)
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
            # Add origins for CORS
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