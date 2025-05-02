import asyncio
import json
import base64
import io
import aiohttp

# Translation cache to avoid repeated translations
translation_cache = {}

class SpeechTranslationService:
    def __init__(self):
        self.translation_cache = {} # Keep cache

        # Supported languages with their codes (names might still be useful for responses)
        self.supported_languages = {
            'hi': {'name': 'Hindi', 'code': 'hi-IN'},
            'en': {'name': 'English', 'code': 'en-US'},
            'es': {'name': 'Spanish', 'code': 'es-ES'},
            'fr': {'name': 'French', 'code': 'fr-FR'},
            'de': {'name': 'German', 'code': 'de-DE'},
            'ja': {'name': 'Japanese', 'code': 'ja-JP'},
            'ko': {'name': 'Korean', 'code': 'ko-KR'},
            'zh': {'name': 'Chinese', 'code': 'zh-CN'},
            'ar': {'name': 'Arabic', 'code': 'ar-AE'},
            'ru': {'name': 'Russian', 'code': 'ru-RU'},
            'gu': {'name': 'Gujarati', 'code': 'gu-IN'},
            'mr': {'name': 'Marathi', 'code': 'mr-IN'},
            'kn': {'name': 'Kannada', 'code': 'kn-IN'}
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

    def get_person(self, detected_lang):
        """Return person identifier based on detected language"""
        if not self.language1 or not self.language2:
             # Default to person 1 if languages not set or mismatch
             # This might need adjustment based on how detected_lang is determined by the API
             print("Warning: Languages not set, defaulting person to 1")
             return "1"
        return "1" if detected_lang == self.language1 else "2"

    async def process_audio_api(self, audio_data, audio_format="aac"):
        """Process audio data using Hugging Face Space API for transcription"""
        if not self.language1:
             raise ValueError("Source language (language1) must be set before processing audio.")

        try:
            print(f"Processing {audio_format} audio data via Hugging Face API...")

            # Prepare API request to Hugging Face Space
            # Assuming the API expects base64 encoded string directly in JSON
            space_url = "https://monilm-lingual.hf.space/api/transcribe"
            payload = {
                "audio": audio_data,  # Expecting base64 string
                "format": audio_format,
                # Sending language1 hint, API might override or use for better accuracy
                "language": self.language1
            }

            # Use aiohttp for async API calls
            async with aiohttp.ClientSession() as session:
                async with session.post(space_url, json=payload, timeout=60) as response: # Increased timeout
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Transcription API Error {response.status}: {error_text}")

                    result = await response.json()

                    if result.get("status") == "error":
                        raise Exception(f"Transcription error from API: {result.get('message')}")

                    text = result.get("text")
                    # Use language returned by API, fallback to language1 if not provided
                    detected_lang_code = result.get("language", self.language1)

                    # Ensure the detected language is one of the configured ones
                    if detected_lang_code not in [self.language1, self.language2]:
                         print(f"Warning: API detected language '{detected_lang_code}' which is not language1 ('{self.language1}') or language2 ('{self.language2}'). Using language1 as source.")
                         detected_lang_code = self.language1 # Fallback to language1

                    person = self.get_person(detected_lang_code)

                    if not text:
                         # Handle case where API returns success but no text (e.g., silence)
                         print("API returned empty transcription text (likely silence).")
                         # Return empty text but indicate success
                         return "", detected_lang_code, person
                         # Or raise ValueError("API returned empty transcription text.") if this is an error condition

                    print(f"API Detected Language: {detected_lang_code}")
                    print(f"API Transcribed Text: {text}")
                    print("=================================")

                    return text, detected_lang_code, person

        except aiohttp.ClientError as e:
            raise Exception(f"API call failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing audio via API: {str(e)}")

    async def translate_text_api(self, text, from_lang, person):
        """Translate text between the configured languages using Google Translate API via aiohttp"""
        # If the input text is empty (e.g., from silence detection), return immediately
        if not text:
            print("Skipping translation for empty text.")
            return {
                "type": "translation",
                "person": person,
                "original": {"text": "", "language": from_lang},
                "translated": {"text": "", "language": self.language2 if from_lang == self.language1 else self.language1},
                "languageSettings": {
                    "language1": self.language1,
                    "language2": self.language2
                }
            }

        try:
            if not self.language1 or not self.language2:
                raise ValueError("Languages not configured for translation")

            # Determine target language
            to_lang = self.language2 if from_lang == self.language1 else self.language1

            # Check cache first
            cache_key = f"{text}_{from_lang}_{to_lang}"
            if cache_key in self.translation_cache:
                translation_text = self.translation_cache[cache_key]
                print(f"Cache hit for translation: {text[:30]}...")
            else:
                print(f"Cache miss, calling translation API for: {text[:30]}...")
                # Use Google Translate API directly via HTTP GET
                # Ensure text is properly URL-encoded
                encoded_text = aiohttp.helpers.quote(text)
                url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={from_lang}&tl={to_lang}&dt=t&q={encoded_text}"


                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=30) as response: # Added timeout
                        if response.status != 200:
                            error_text = await response.text()
                            raise ValueError(f"Translation API error: {response.status} - {error_text}")

                        # Response is JSON, but might need careful parsing
                        try:
                            # Specify content_type=None to handle potential incorrect headers from Google
                            data = await response.json(content_type=None)
                        except json.JSONDecodeError:
                             raw_resp = await response.text()
                             raise ValueError(f"Translation API returned non-JSON response: {raw_resp}")

                        translation_text = ''
                        # Extract translation from the complex JSON structure Google returns
                        if data and isinstance(data, list) and data[0] and isinstance(data[0], list):
                             for sentence in data[0]:
                                 if sentence and isinstance(sentence, list) and sentence[0]:
                                     translation_text += sentence[0]

                        if not translation_text:
                            # Sometimes the translation is nested differently
                            if data and isinstance(data, list) and len(data) > 1 and data[1] and isinstance(data[1], list) and data[1][0] and isinstance(data[1][0], list) and len(data[1][0]) > 1 and data[1][0][1]:
                                translation_text = data[1][0][1] # Try alternative structure
                            else:
                                print(f"Warning: Empty translation response from API. Raw response: {data}")
                                # Return original text if translation fails but API call was successful
                                translation_text = text
                                # raise ValueError("Empty translation response from API") # Or raise error

                        # Clean up potential null characters
                        translation_text = translation_text.replace('\x00', '').strip()
                        # Cache the result
                        self.translation_cache[cache_key] = translation_text
                        print(f"Translation successful: {translation_text[:30]}...")

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

        except aiohttp.ClientError as e:
             error_msg = f"Translation API network error: {type(e).__name__}: {str(e)}"
             print(f"Translation Error: {error_msg}")
             # Return error structure or re-raise depending on desired handling
             return {"type": "error", "message": error_msg, "person": person}
        except Exception as e:
            error_msg = f"Translation failed: {type(e).__name__}: {str(e)}"
            print(f"Translation Error: {error_msg}")
            # Return error structure or re-raise
            return {"type": "error", "message": error_msg, "person": person}


# Create global service instance
speech_service = SpeechTranslationService()

# Example function demonstrating API usage (can be called from Flask/other framework)
async def handle_speech_api_request(audio_data_base64, audio_format, lang1, lang2):
    """
    Handles a single speech processing request using the API-based service.
    """
    try:
        # Set languages for this request
        if not speech_service.set_languages(lang1, lang2):
             return {"type": "error", "message": "Failed to set languages."}

        # 1. Transcribe audio using the API
        text, detected_lang, person = await speech_service.process_audio_api(audio_data_base64, audio_format)

        # 2. Translate the transcribed text (will handle empty text internally)
        translation_result = await speech_service.translate_text_api(text, detected_lang, person)

        return translation_result

    except ValueError as e:
         print(f"API Request Error (ValueError): {str(e)}")
         return {"type": "error", "message": str(e)}
    except Exception as e:
        print(f"API Request Error (Exception): {type(e).__name__} - {str(e)}")
        return {"type": "error", "message": f"An unexpected error occurred: {str(e)}"}