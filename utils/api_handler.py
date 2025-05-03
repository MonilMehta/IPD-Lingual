"""
Flask API for Image Detection and Language Learning Application
Features:
- User authentication with JWT
- Object detection with translation
- Speech processing
- Quiz functionality
- MongoDB integration
"""

from flask import Flask, jsonify, session, request, redirect, url_for, render_template
from pymongo import MongoClient
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_cors import CORS
from decouple import config
import datetime
import hashlib
import asyncio
import threading
import cv2
import numpy as np
import base64
import json
import os
from utils.detection_service import DetectionService
from utils.speech_service import handle_speech_api_request
from googletrans import Translator
from bson import ObjectId
from groq import Groq # Added Groq import

# =============================================================================
# Helper Functions and Constants
# =============================================================================

# Language code mappings
language_mapping = {
    'English': 'en',
    'Hindi': 'hi',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
}

# Allowed languages for detection translation
ALLOWED_LANGUAGES = ['en', 'hi', 'gu', 'mr', 'kn']

def get_language_name_from_code(code):
    """
    Convert language code to language name
    """
    for name, lang_code in language_mapping.items():
        if lang_code == code:
            return name.lower()  # e.g., 'english'
    return 'english'  # Default

async def _run_detection(file, profile, confidence, iou, target_language, username):
    """
    Helper async function for object detection with translation
    """
    image_bytes = await asyncio.to_thread(file.read)
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = await asyncio.to_thread(cv2.imdecode, nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Could not decode image")
    # Pass target_language and username to the service
    return await detection_service.detect_objects_api(
        frame,
        profile=profile,
        confidence=confidence,
        iou=iou,
        target_language=target_language,
        username=username
    )

async def _run_speech(file, audio_format, lang1, lang2):
    """
    Helper async function for speech processing
    """
    audio_binary = await asyncio.to_thread(file.read)
    return await handle_speech_api_request(audio_binary, audio_format, lang1, lang2)

# =============================================================================
# App Initialization
# =============================================================================

app = Flask(__name__)
CORS(app)

# JWT Configuration
jwt = JWTManager(app)
app.config['JWT_SECRET_KEY'] = config('JWT_SECRET', default='default_secret_key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=1)

# MongoDB Configuration
client = MongoClient(config('MONGODB_URL'))
db = client['IPDatabase']
users_collection = db['users']
detection_collection = db['detectionResults']
blacklist_collection = db['token_blacklist']

# Services initialization
detection_service = DetectionService()
model = None
model_active = False

# =============================================================================
# Authentication Endpoints
# =============================================================================

@app.route("/register", methods=["POST"])
def register():
    """
    Register a new user
    Request body: {username, password}
    Returns: Success message or error if user already exists
    """
    new_user = request.get_json()
    new_user['password'] = hashlib.sha256(new_user['password'].encode('utf-8')).hexdigest()
    doc = users_collection.find_one({'username': new_user['username']})
    
    if not doc:
        new_user['target_language'] = 'en'  # Default to English
        new_user['quiz_index'] = 0
        users_collection.insert_one(new_user)
        return jsonify({'msg': 'User created successfully'}), 201
    else:
        return jsonify({'msg': 'User already exists'}), 409

@app.route("/login/", methods=["POST"])
def login():
    """
    Authenticate a user and provide JWT token
    Request body: {username, password}
    Returns: JWT access token or error
    """
    login_details = request.get_json()
    user_from_db = users_collection.find_one({'username': login_details['username']})
    
    if user_from_db:
        encrypted_password = hashlib.sha256(login_details['password'].encode('utf-8')).hexdigest()
        if encrypted_password == user_from_db['password']:
            access_token = create_access_token(identity=user_from_db['username'])
            return jsonify(access_token=access_token), 200
    return jsonify({'msg': 'Username or password is incorrect'}), 401

@app.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Invalidate JWT token and log user out
    Returns: Success message
    """
    jti = get_jwt()['jti']
    blacklist_collection.insert_one({'jti': jti, 'created_at': datetime.datetime.now()})
    return jsonify({"msg": "Successfully logged out"}), 200

# =============================================================================
# User Management Endpoints
# =============================================================================

@app.route("/user", methods=["GET"])
@jwt_required()
def get_user():
    """
    Get current user information
    Returns: User object or error
    """
    current_user = get_jwt_identity()
    user = users_collection.find_one({"username": current_user})
    if user:
        user["_id"] = str(user["_id"])
        return jsonify(user), 200
    else:
        return jsonify({"msg": "User not found"}), 404

@app.route("/user_update", methods=["PUT"])
@jwt_required()
def update_user():
    """
    Update current user information
    Request body: {password, username, target_language}
    Returns: Success message or error
    """
    data = request.json
    current_user = get_jwt_identity()
    update_data = {}

    if 'password' in data:
        update_data['password'] = hashlib.sha256(data['password'].encode('utf-8')).hexdigest()
    if 'username' in data:
        if users_collection.find_one({'username': data['username']}):
            return jsonify({"msg": "Username already taken"}), 409
        update_data['username'] = data['username']
    if 'target_language' in data:
        if data['target_language'] not in language_mapping.values():
            return jsonify({"msg": f"Invalid target language code. Allowed: {list(language_mapping.values())}"}), 400
        update_data['target_language'] = data['target_language']

    if not update_data:
        return jsonify({"msg": "No update fields provided"}), 400

    try:
        result = users_collection.update_one({"username": current_user}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"msg": "User not found"}), 404
        return jsonify({"msg": "User updated successfully"}), 200
    except Exception as e:
        return jsonify({"msg": str(e)}), 400

@app.route("/user_delete", methods=["DELETE"])
@jwt_required()
def delete_user():
    """
    Delete current user account
    Returns: Success message or error
    """
    current_user = get_jwt_identity()
    result = users_collection.delete_one({"username": current_user})
    if result.deleted_count > 0:
        return jsonify({"msg": "User deleted successfully"}), 200
    else:
        return jsonify({"msg": "User not found"}), 404

# =============================================================================
# Detection Management Endpoints
# =============================================================================

@app.route("/store_detection", methods=["POST"])
@jwt_required()
def store_detection():
    """
    Store object detection results in database
    Request body: {detections: [detection objects]}
    Returns: Success with inserted IDs or error
    """
    data = request.json
 
    if not data or 'detections' not in data:
        return jsonify({"status": "error", "message": "No detections provided"}), 400
    detections = data['detections']
    current_user = get_jwt_identity()
    for detection in detections:
        detection['timestamp'] = datetime.datetime.now()
        detection['user'] = current_user
    result = detection_collection.insert_many(detections)
    return jsonify({
        "status": "success",
        "inserted_ids": [str(inserted_id) for inserted_id in result.inserted_ids]
    }), 201

@app.route("/detections", methods=["GET"])
@jwt_required()
def get_all_detections():
    """
    Get all detection results for current user
    Returns: List of detection objects or error
    """
    current_user = get_jwt_identity()
    detections = list(detection_collection.find({"user": current_user}))
    for detection in detections:
        detection["_id"] = str(detection["_id"])
    return jsonify(detections), 200

@app.route("/delete_detection", methods=["DELETE"])
@jwt_required()
def delete_detection():
    """
    Delete all detection results for current user
    Returns: Success message or error
    """
    current_user = get_jwt_identity()
    result = detection_collection.delete_one({'user': current_user})
    if result.deleted_count > 0:
        return jsonify({"status": "success", "message": "Detection(s) deleted"}), 200
    else:
        return jsonify({"status": "error", "message": "No detections found for the user"}), 404

# =============================================================================
# Quiz Management Endpoints
# =============================================================================

@app.route("/api/quiz", methods=["GET"])
@jwt_required()
def get_quiz():
    """
    Get quiz questions for user's current level and target language
    Returns: Quiz questions or error
    """
    current_user = get_jwt_identity()
    user = users_collection.find_one({"username": current_user})

    if not user:
        return jsonify({"msg": "User not found"}), 404

    quiz_index = user.get('quiz_index', 0)
    target_language_code = user.get('target_language', 'en')
    language_name = get_language_name_from_code(target_language_code)

    quiz_file_path = os.path.join('utils', 'quiz', f'{language_name}_quiz_dataset.json')  # Assumes files like english_quiz_dataset.json

    if not os.path.exists(quiz_file_path):
        quiz_file_path_alt = os.path.join('utils', 'quiz', f'{language_name}_quiz.json')
        if not os.path.exists(quiz_file_path_alt):
            return jsonify({"msg": f"Quiz file not found for language: {language_name}"}), 404
        quiz_file_path = quiz_file_path_alt  # Use the fallback path

    try:
        with open(quiz_file_path, 'r', encoding='utf-8') as f:
            all_questions = json.load(f)
    except Exception as e:
        print(f"Error reading quiz file {quiz_file_path}: {e}")
        return jsonify({"msg": "Error reading quiz file"}), 500

    total_questions = len(all_questions)
    start_index = quiz_index
    end_index = min(start_index + 10, total_questions)  # Get next 10 or fewer if at the end

    if start_index >= total_questions:
        questions_to_serve = []  # Or return a message indicating completion
    else:
        questions_to_serve = all_questions[start_index:end_index]

    return jsonify({
        "current_level": quiz_index,  # Send the starting index as current level
        "questions": questions_to_serve
    }), 200

@app.route("/api/complete_quiz", methods=["GET"])
@jwt_required()
def complete_quiz():
    """
    Update user's quiz progress
    Query params: quiz_index
    Returns: Success message or error
    """
    current_user = get_jwt_identity()
    new_quiz_index_str = request.args.get('quiz_index')

    if new_quiz_index_str is None:
        return jsonify({"msg": "Missing 'quiz_index' query parameter"}), 400

    try:
        new_quiz_index = int(new_quiz_index_str)
        if new_quiz_index < 0:
            raise ValueError("Quiz index cannot be negative")
    except ValueError:
        return jsonify({"msg": "Invalid 'quiz_index' parameter. Must be a non-negative integer."}), 400

    try:
        result = users_collection.update_one(
            {"username": current_user},
            {"$set": {"quiz_index": new_quiz_index}}
        )
        if result.matched_count == 0:
            return jsonify({"msg": "User not found"}), 404
        return jsonify({"msg": "Quiz index updated successfully"}), 200
    except Exception as e:
        print(f"Error updating quiz index for user {current_user}: {e}")
        return jsonify({"msg": "Error updating quiz index"}), 500

# =============================================================================
# AI Detection and Speech Processing Endpoints
# =============================================================================

@app.route("/api/detect", methods=["POST"])
@jwt_required()
def api_detect():
    """
    Detect objects in an image with optional translation
    Form data: image, profile, confidence, iou, target_language
    Returns: Detection results or error
    """
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image file provided"}), 400

    file = request.files['image']
    profile = request.form.get('profile', 'general')
    confidence = request.form.get('confidence', '0.3')
    iou = request.form.get('iou', '0.6')
    target_language_param = request.form.get('target_language')  # Get optional language param

    current_user = get_jwt_identity()  # Get user identity

    final_target_language = None
    if target_language_param:
        if target_language_param in ALLOWED_LANGUAGES:
            final_target_language = target_language_param
        else:
            return jsonify({"status": "error", "message": f"Invalid target_language. Must be one of: {', '.join(ALLOWED_LANGUAGES)}"}), 400
    else:
        user_data = users_collection.find_one({"username": current_user})
        if user_data and 'target_language' in user_data and user_data['target_language'] in ALLOWED_LANGUAGES:
            final_target_language = user_data['target_language']
        else:
            final_target_language = 'en'  # Default to English

    try:
        results = asyncio.run(_run_detection(file, profile, confidence, iou, final_target_language, current_user))
        return jsonify(results), 200
    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)}), 400
    except Exception as e:
        import traceback
        print(f"Error in /api/detect: {e}\n{traceback.format_exc()}")
        return jsonify({"status": "error", "message": f"Detection failed: {str(e)}"}), 500

@app.route("/api/speech", methods=["POST"])
@jwt_required()
def api_speech():
    """
    Process speech audio for translation or transcription
    Form data: audio, format, lang1, lang2
    Returns: Processing results or error
    """
    if 'audio' not in request.files:
        return jsonify({"status": "error", "message": "No audio file provided"}), 400

    file = request.files['audio']
    audio_format = request.form.get('format')
    lang1 = request.form.get('lang1')
    lang2 = request.form.get('lang2')

    if not audio_format or not lang1 or not lang2:
        return jsonify({"status": "error", "message": "Missing required parameters: format, lang1, lang2"}), 400

    try:
        result = asyncio.run(_run_speech(file, audio_format, lang1, lang2))
        return jsonify(result), 200
    except Exception as e:
        import traceback
        print(f"Error in /api/speech: {e}\n{traceback.format_exc()}")
        return jsonify({"status": "error", "message": f"Speech processing failed: {str(e)}"}), 500

@app.route("/api/speech/config", methods=["GET"])
@jwt_required()
def api_speech_config():
    """
    Get speech processing configuration
    Returns: Supported languages and options
    """
    supported_languages = ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru']  # Example list
    return jsonify({
        "supported_languages": supported_languages
    }), 200

# --- Phrase Generation Endpoint ---

@app.route("/api/phrase", methods=["POST"])
@jwt_required()
async def generate_phrase(): # Make the function async
    data = request.get_json()
    word = data.get('word')
    target_language = data.get('target_language')

    if not word or not target_language:
        return jsonify({"msg": "Missing 'word' or 'target_language' in request body"}), 400

    # Validate target language if necessary (using existing language_mapping)
    if target_language not in language_mapping.values():
         return jsonify({"msg": f"Invalid target language code. Allowed: {list(language_mapping.values())}"}), 400

    try:
        # Initialize Groq client - ensure GROQ_API_KEY is set in your environment/.env file
        groq_api_key = config('GROQ_API_KEY', default=None)
        if not groq_api_key:
            print("Error: GROQ_API_KEY environment variable not set.")
            return jsonify({"msg": "Server configuration error: Missing API key"}), 500
        
        client = Groq(api_key=groq_api_key)

        prompt = f"""
        You are a language learning assistant. You will receive a word.
        Based on the word \"{word}\", create two English sentences.
        The first sentence should be easy (A1/A2 level).
        The second sentence should be of intermediate difficulty (B1/B2 level).
        Generate ONLY these two sentences.
        Return them in JSON format with keys \"sentence1\" and \"sentence2\".
        Example for word 'book':
        {{\"sentence1\": \"I read a book.\", \"sentence2\": \"The library contains a vast collection of historical books.\"}}
        """

        # Note: Groq SDK might not be async, run in thread if it blocks
        # For simplicity, assuming it's okay for now or non-blocking enough
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": f"Generate sentences for the word: {word}"
                }
            ],
            model="llama3-8b-8192",
            temperature=0.7, # Adjust as needed
            max_tokens=150, # Adjust as needed
            top_p=1,
            stop=None,
            stream=False,
            response_format={"type": "json_object"} # Request JSON output
        )

        groq_response_content = chat_completion.choices[0].message.content
        
        # Parse the JSON string from Groq
        try:
            sentences_data = json.loads(groq_response_content)
            sentence1_en = sentences_data.get('sentence1')
            sentence2_en = sentences_data.get('sentence2')
            if not sentence1_en or not sentence2_en:
                 raise ValueError("Groq response did not contain sentence1 or sentence2")
        except (json.JSONDecodeError, ValueError) as json_err:
            print(f"Error parsing Groq JSON response: {json_err}")
            print(f"Groq raw response: {groq_response_content}")
            return jsonify({"msg": "Error processing response from language model"}), 500

        # Translate if target language is not English
        if target_language != 'en':
            try:
                translator = Translator()
                # Create translation tasks
                sentence1_translated_task = translator.translate(sentence1_en, dest=target_language)
                sentence2_translated_task = translator.translate(sentence2_en, dest=target_language)

                # Run translations concurrently and await results
                results = await asyncio.gather(sentence1_translated_task, sentence2_translated_task)

                sentence1_translated = results[0].text
                sentence2_translated = results[1].text
                
                response_data = {
                    "sentence1": sentence1_translated,
                    "sentence2": sentence2_translated,
                    "original_word": word # Add original word
                }
            except Exception as trans_err:
                print(f"Error translating sentences: {trans_err}")
                # Fallback to English if translation fails?
                return jsonify({"msg": "Error during translation"}), 500
        else:
            response_data = {
                "sentence1": sentence1_en,
                "sentence2": sentence2_en,
                "original_word": word # Add original word
            }

        return jsonify(response_data), 200

    except Exception as e:
        import traceback
        print(f"Error in /api/phrase: {e}\n{traceback.format_exc()}")
        return jsonify({"msg": f"An unexpected error occurred: {str(e)}"}), 500

# --- End Phrase Generation Endpoint ---

# =============================================================================
# Test Endpoints
# =============================================================================

@app.route("/speech_test")
def speech_test():
    """
    Render speech test page with WebSocket configuration
    Returns: HTML page
    """
    host = request.host.split(':')[0]  # Extract host without port
    speech_websocket_url = f"ws://{host}:8766"  # Speech service runs on port 8766
    return render_template('speech_test.html', speech_websocket_url=speech_websocket_url)