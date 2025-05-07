import asyncio
import json
import aiohttp
import io

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

    async def process_speech_via_api(self, audio_binary, audio_format, lang1, lang2):
        """Process audio using the HuggingFace API call for transcription and translation."""
        try:
            print(f"Processing {audio_format} audio data via Hugging Face API ({lang1} -> {lang2})...")

            # Use the actual Hugging Face Space endpoint
            space_url = "https://monilm-lingual.hf.space/api/speech" 

            # Prepare the form data for the API request
            form_data = aiohttp.FormData()
            
            # Add the audio binary directly to the form
            form_data.add_field('audio', 
                               audio_binary,
                               filename=f'audio.{audio_format}',
                               content_type=f'audio/{audio_format}')
            
            form_data.add_field('lang1', lang1)
            form_data.add_field('lang2', lang2)
            form_data.add_field('format', audio_format)

            # Make the API request
            async with aiohttp.ClientSession() as session:
                async with session.post(space_url, data=form_data, timeout=90) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Speech Processing API Error {response.status}: {error_text}")

                    result = await response.json()

                    # Process the actual response format from the API
                    detected_lang = result.get("detected_language")
                    transcribed_text = result.get("transcribed_text", "")
                    translated_text = result.get("translated_text", "")

                    if not detected_lang:
                        print("Warning: API did not return detected_language. Falling back to lang1.")
                        detected_lang = lang1

                    # Get the person identifier based on the detected language
                    person = self.get_person(detected_lang)

                    print(f"API Result -> Detected: {detected_lang}, Person: {person}")
                    print(f"Transcribed: {transcribed_text[:50]}...")
                    print(f"Translated: {translated_text[:50]}...")
                    print("=================================")

                    # Return the response structure expected by frontend
                    return {
                        "type": "translation",
                        "person": person,
                        "original": {"text": transcribed_text, "language": detected_lang},
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

# Create global service instance
speech_service = SpeechTranslationService()

# Main entry point for handling speech API requests - modified to accept file binary directly
async def handle_speech_api_request(audio_binary, audio_format, lang1, lang2):
    """
    Handles a single speech processing request using the HuggingFace API.
    Accepts the audio binary directly rather than base64 encoded string.
    """
    try:
        # Set languages for this specific request context
        speech_service.set_languages(lang1, lang2)
        
        # Call the API endpoint with binary data directly
        result = await speech_service.process_speech_via_api(audio_binary, audio_format, lang1, lang2)
        
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