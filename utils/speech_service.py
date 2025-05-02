import asyncio
import json
import base64
import io
import aiohttp

# Removed translation_cache as translation is now handled by the external API

class SpeechTranslationService:
    def __init__(self):
        # Supported languages might still be useful for validation or UI
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
        # Store target languages for determining person
        self.language1 = None
        self.language2 = None

    def set_languages(self, lang1, lang2):
        """Set the source and target languages"""
        if lang1 not in self.supported_languages or lang2 not in self.supported_languages:
            raise ValueError(f"Unsupported language provided. Supported: {list(self.supported_languages.keys())}")
        if lang1 == lang2:
            raise ValueError("Source and target languages must be different")
        self.language1 = lang1
        self.language2 = lang2
        print(f"Languages set for request: {lang1} -> {lang2}")
        return True

    def get_person(self, detected_lang):
        """Return person identifier based on detected language compared to set languages."""
        if not self.language1 or not self.language2:
             print("Warning: Languages not set for person determination, defaulting to 1")
             return "1"
        # Assume person 1 speaks language1, person 2 speaks language2
        return "1" if detected_lang == self.language1 else "2"

    async def process_speech_via_api(self, audio_data_base64, audio_format, lang1, lang2):
        """Process audio using a single Hugging Face API call for transcription and translation."""
        try:
            print(f"Processing {audio_format} audio data via Hugging Face API ({lang1} -> {lang2})...")

            # Define the Hugging Face Space endpoint (adjust if different)
            space_url = "https://monilm-lingual.hf.space/api/process_speech" # New assumed endpoint

            payload = {
                "audio": audio_data_base64, # Base64 encoded audio string
                "format": audio_format,
                "lang1": lang1, # Source language hint
                "lang2": lang2  # Target language for translation
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(space_url, json=payload, timeout=90) as response: # Increased timeout
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Speech Processing API Error {response.status}: {error_text}")

                    result = await response.json()

                    if result.get("status") == "error":
                        raise Exception(f"Speech Processing error from API: {result.get('message')}")

                    # --- Expected response structure from Hugging Face --- #
                    original_text = result.get("original_text")
                    detected_lang = result.get("detected_language") # Language code (e.g., 'en', 'hi')
                    translated_text = result.get("translated_text")
                    # ----------------------------------------------------- #

                    if not detected_lang:
                        print("Warning: API did not return detected_language. Falling back to lang1.")
                        detected_lang = lang1 # Fallback if API doesn't provide it

                    # Validate detected language against the expected ones for this conversation
                    if detected_lang not in [self.language1, self.language2]:
                        print(f"Warning: API detected language '{detected_lang}' which is not language1 ('{self.language1}') or language2 ('{self.language2}'). Using it anyway.")
                        # Decide if you want to force it to lang1 or trust the API
                        # For now, we trust the API's detection for the 'original' field

                    person = self.get_person(detected_lang)

                    if original_text is None or translated_text is None:
                        # Handle cases where transcription or translation might be missing (e.g., silence)
                        print(f"API returned partial result: Original: '{original_text}', Translated: '{translated_text}'")
                        # Ensure we return empty strings instead of None
                        original_text = original_text or ""
                        translated_text = translated_text or ""

                    print(f"API Result -> Detected: {detected_lang}, Person: {person}, Original: {original_text[:50]}..., Translated: {translated_text[:50]}...")
                    print("=================================")

                    # Return the structured data expected by the frontend/caller
                    return {
                        "type": "translation", # Keep type consistent if frontend expects it
                        "person": person,
                        "original": {"text": original_text, "language": detected_lang},
                        "translated": {"text": translated_text, "language": lang2 if detected_lang == lang1 else lang1},
                        "languageSettings": {
                            "language1": self.language1,
                            "language2": self.language2
                        }
                    }

        except aiohttp.ClientError as e:
            raise Exception(f"API call failed: {str(e)}")
        except Exception as e:
            # Log the full traceback for debugging
            import traceback
            print(f"Error processing speech via API: {str(e)}\n{traceback.format_exc()}")
            raise Exception(f"Error processing speech via API: {str(e)}")

    # Removed translate_text_api method as it's now handled by process_speech_via_api

# Create global service instance
speech_service = SpeechTranslationService()

# Updated function to use the single API call
async def handle_speech_api_request(audio_data_base64, audio_format, lang1, lang2):
    """
    Handles a single speech processing request using the consolidated API call.
    """
    try:
        # Set languages for this specific request context
        if not speech_service.set_languages(lang1, lang2):
             # This path might not be reachable if validation happens earlier
             return {"type": "error", "message": "Failed to set languages."}

        # Call the single API endpoint that handles both transcription and translation
        result = await speech_service.process_speech_via_api(audio_data_base64, audio_format, lang1, lang2)

        return result

    except ValueError as e:
         print(f"API Request Error (ValueError): {str(e)}")
         return {"type": "error", "message": str(e)}
    except Exception as e:
        # Log the full traceback for debugging
        import traceback
        print(f"API Request Error (Exception): {type(e).__name__} - {str(e)}\n{traceback.format_exc()}")
        # Return a user-friendly error message
        return {"type": "error", "message": f"An unexpected error occurred during speech processing."}