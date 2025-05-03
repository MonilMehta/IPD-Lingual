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
from datetime import date, timedelta # Added date and timedelta

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

def get_todays_challenge_word():
    """Helper function to get today's challenge word."""
    challenge_file_path = os.path.join('utils', 'quiz', 'daily_challenges.json')
    if not os.path.exists(challenge_file_path):
        print("Error: Daily challenge data file not found.")
        return None
    try:
        with open(challenge_file_path, 'r', encoding='utf-8') as f:
            all_challenges = json.load(f)
        if not all_challenges:
            print("Error: No challenges found in the file.")
            return None

        today = date.today()
        day_of_month = today.day # Use day of the month

        # Find the challenge for the current day of the month
        # Assumes structure like [{"day": 1, "challenge": "word"}, ...]
        todays_challenge = next((item['challenge'] for item in all_challenges if item.get('day') == day_of_month), None)

        if not todays_challenge:
            print(f"Warning: No challenge found for day {day_of_month}. Using fallback.")
            # Fallback: use day of year modulo length if day of month fails
            day_of_year = today.timetuple().tm_yday
            if not all_challenges: # Avoid division by zero if file is empty after checks
                 return None
            challenge_index = (day_of_year - 1) % len(all_challenges)
            # Assuming the structure is {"day": N, "challenge": "word"}
            # Need to access the 'challenge' key from the selected object
            selected_challenge_obj = all_challenges[challenge_index]
            todays_challenge = selected_challenge_obj.get('challenge') if selected_challenge_obj else None


        return todays_challenge.lower() if todays_challenge else None # Return lowercase word or None

    except Exception as e:
        print(f"Error reading or processing daily challenge file: {e}")
        return None

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
# Health Check Endpoints
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    Returns a simple JSON response indicating the service is up.
    """
    return jsonify({"status": "ok"}), 200

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
        new_user['daily_challenge_streak'] = 0 # Initialize streak
        new_user['last_challenge_completed_at'] = None # Initialize completion date (as None initially)
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

@app.route("/api/set_language", methods=["PUT"])
@jwt_required()
def set_user_language():
    """
    Set the target language for the current user.
    Request body: {"target_language": "language_code"}
    Returns: Success message or error.
    """
    data = request.json
    current_user = get_jwt_identity()

    if not data or 'target_language' not in data:
        return jsonify({"msg": "Missing 'target_language' in request body"}), 400

    new_language = data['target_language']

    if new_language not in language_mapping.values():
        return jsonify({"msg": f"Invalid target language code. Allowed: {list(language_mapping.values())}"}), 400

    try:
        result = users_collection.update_one(
            {"username": current_user},
            {"$set": {"target_language": new_language}}
        )
        if result.matched_count == 0:
            return jsonify({"msg": "User not found"}), 404
        return jsonify({"msg": f"User target language updated to {new_language}"}), 200
    except Exception as e:
        print(f"Error updating target language for user {current_user}: {e}")
        return jsonify({"msg": "Error updating target language"}), 500

# =============================================================================
# Language Management Endpoints (New)
# =============================================================================

@app.route("/api/current_language", methods=["GET"])
@jwt_required()
def get_current_language():
    """
    Get the target language for the current user.
    Returns: {"target_language": "language_code"} or error.
    """
    current_user = get_jwt_identity()
    user = users_collection.find_one({"username": current_user}, {"target_language": 1})

    if not user:
        return jsonify({"msg": "User not found"}), 404

    target_language = user.get('target_language', 'en') # Default to 'en' if not set

    return jsonify({"target_language": target_language}), 200

# =============================================================================
# Detection Management Endpoints
# =============================================================================

@app.route("/api/store_detection", methods=["POST"]) # Renamed route
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

@app.route("/api/detections", methods=["GET"]) # Renamed route
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

@app.route("/api/delete_detection/<detection_id>", methods=["DELETE"]) # Renamed route and added ID parameter
@jwt_required()
def delete_detection(detection_id): # Added detection_id parameter
    """
    Delete a specific detection result for the current user by its ID.
    Path param: detection_id (string representation of MongoDB ObjectId)
    Returns: Success message or error
    """
    current_user = get_jwt_identity()
    try:
        # Convert string ID to ObjectId
        obj_id = ObjectId(detection_id)
    except Exception: # Catches invalid ObjectId format
        return jsonify({"status": "error", "message": "Invalid detection ID format"}), 400

    # Delete the specific detection belonging to the current user
    result = detection_collection.delete_one({'_id': obj_id, 'user': current_user})

    if result.deleted_count > 0:
        return jsonify({"status": "success", "message": f"Detection with ID {detection_id} deleted"}), 200
    else:
        # Could be because the ID doesn't exist or it doesn't belong to the user
        return jsonify({"status": "error", "message": "Detection not found or user does not have permission to delete"}), 404

# =============================================================================
# Quiz Management Endpoints
# =============================================================================

@app.route("/api/quiz", methods=["GET"])
@jwt_required()
def get_quiz():
    """
    Get quiz questions for user's current level and targegt language
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
# Daily Challenge Endpoints (Modified and New)
# =============================================================================

@app.route("/api/daily_challenge", methods=["GET"])
@jwt_required()
def get_daily_challenge():
    """
    Get the daily language learning challenge word for the user.
    Selects a challenge based on the current day of the month.
    Returns: {"challenge_word": "..."} or error.
    """
    todays_word = get_todays_challenge_word()

    if todays_word:
        return jsonify({"challenge_word": todays_word}), 200
    else:
        # Handle case where word couldn't be determined
        return jsonify({"msg": "Could not determine today's challenge word."}), 500


@app.route("/api/daily_challenge/status", methods=["GET"])
@jwt_required()
def get_daily_challenge_status():
    """
    Get the user's daily challenge status including streak, last completion,
    today's word, and completion status for today.
    Returns: JSON object with challenge status or error.
    """
    current_user = get_jwt_identity()
    # Ensure we fetch the necessary fields
    user = users_collection.find_one({"username": current_user},
                                     {"daily_challenge_streak": 1, "last_challenge_completed_at": 1})

    if not user:
        return jsonify({"msg": "User not found"}), 404

    streak = user.get('daily_challenge_streak', 0)
    last_completed_dt = user.get('last_challenge_completed_at') # This is a datetime object or None

    todays_word = get_todays_challenge_word()
    if not todays_word:
        # If we can't get the word, we can still return status but indicate the word is missing
         return jsonify({
            "streak": streak,
            "last_completed": last_completed_dt.isoformat() if last_completed_dt else None,
            "todays_word": None,
            "completed_today": False,
            "message": "Could not determine today's challenge word."
        }), 200 # Or 500 if this is considered a server error

    completed_today = False
    if last_completed_dt:
        # Compare only the date part with today's date
        if last_completed_dt.date() == date.today():
            completed_today = True

    return jsonify({
        "streak": streak,
        "last_completed": last_completed_dt.isoformat() if last_completed_dt else None,
        "todays_word": todays_word,
        "completed_today": completed_today
    }), 200


# =============================================================================
# AI Detection and Speech Processing Endpoints
# =============================================================================

@app.route("/api/detect", methods=["POST"])
@jwt_required()
def api_detect():
    """
    Detect objects in an image with optional translation and daily challenge check.
    Form data: image, profile, confidence, iou, target_language
    Returns: Detection results (including completed_challenge status) or error
    """
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image file provided"}), 400

    file = request.files['image']
    profile = request.form.get('profile', 'general')
    confidence = request.form.get('confidence', '0.3')
    iou = request.form.get('iou', '0.6')
    target_language_param = request.form.get('target_language')

    current_user = get_jwt_identity()

    # Fetch user data once, including challenge fields
    user_data = users_collection.find_one(
        {"username": current_user},
        {"target_language": 1, "daily_challenge_streak": 1, "last_challenge_completed_at": 1}
    )
    if not user_data:
         # Should not happen if JWT is valid, but good practice to check
         return jsonify({"status": "error", "message": "User not found"}), 404

    # Determine target language
    final_target_language = None
    if target_language_param:
        if target_language_param in ALLOWED_LANGUAGES:
            final_target_language = target_language_param
        else:
            return jsonify({"status": "error", "message": f"Invalid target_language. Must be one of: {', '.join(ALLOWED_LANGUAGES)}"}), 400
    else:
        if 'target_language' in user_data and user_data['target_language'] in ALLOWED_LANGUAGES:
            final_target_language = user_data['target_language']
        else:
            final_target_language = 'en' # Default to English if not set or invalid

    # --- Daily Challenge Logic Prep ---
    challenge_completed_today = False
    todays_challenge_word = get_todays_challenge_word()
    last_completed_dt = user_data.get('last_challenge_completed_at') # Get from fetched user_data
    current_streak = user_data.get('daily_challenge_streak', 0) # Get from fetched user_data
    update_user_challenge_in_db = False # Flag to update DB later

    # Check if already completed today based on date part
    if last_completed_dt and last_completed_dt.date() == date.today():
        challenge_completed_today = True
    # --- End Daily Challenge Logic Prep ---

    try:
        # Run detection - Assuming _run_detection returns a dict like:
        # {'detections': [{'label': '...', 'label_en': 'original_label', ...}], 'image_base64': '...'}
        # The 'label_en' key is crucial here.
        results = asyncio.run(_run_detection(file, profile, confidence, iou, final_target_language, current_user))

        # --- Daily Challenge Check Post-Detection ---
        if todays_challenge_word and not challenge_completed_today: # Only check if word exists and not already completed today
            detected_labels_en = []
            # Check the correct key 'objects' instead of 'detections'
            if 'objects' in results and isinstance(results.get('objects'), list):
                 # Extract original English labels (case-insensitive)
                 # Ensure 'label_en' exists and is a string before lowercasing
                 detected_labels_en = [
                     det.get('label_en', '').lower()
                     # Access items within the 'objects' list
                     for det in results['objects'] if isinstance(det.get('label_en'), str)
                 ]

            if todays_challenge_word in detected_labels_en:
                # Challenge word detected! Update streak and timestamp.
                challenge_completed_today = True # Mark as completed now
                update_user_challenge_in_db = True # Set flag to update DB
                today_date = date.today()
                yesterday_date = today_date - timedelta(days=1)

                if last_completed_dt and last_completed_dt.date() == yesterday_date:
                    # Completed yesterday, increment streak
                    current_streak += 1
                elif last_completed_dt and last_completed_dt.date() == today_date:
                    # This case should technically be handled by the initial check,
                    # but adding for robustness. Don't increment streak again.
                    pass
                else:
                    # Didn't complete yesterday (or first time), reset streak to 1
                    current_streak = 1

                # Update last completed time to now (use datetime for precision)
                last_completed_dt = datetime.datetime.now(datetime.timezone.utc) # Use timezone-aware UTC

        # Add challenge completion status to the response JSON
        results['completed_challenge'] = challenge_completed_today

        # Update user in DB if challenge was completed in *this* request
        if update_user_challenge_in_db:
            users_collection.update_one(
                {"username": current_user},
                {"$set": {
                    "daily_challenge_streak": current_streak,
                    "last_challenge_completed_at": last_completed_dt # Store the new datetime object
                }}
            )
            print(f"User {current_user} completed daily challenge '{todays_challenge_word}'. New streak: {current_streak}") # Logging

        return jsonify(results), 200
    except ValueError as ve:
        # Add challenge status even in case of error? Default to false.
        error_response = {"status": "error", "message": str(ve), "completed_challenge": challenge_completed_today}
        return jsonify(error_response), 400
    except Exception as e:
        import traceback
        print(f"Error in /api/detect: {e}\n{traceback.format_exc()}")
        # Add challenge status even in case of error? Default to false.
        error_response = {"status": "error", "message": f"Detection failed: {str(e)}", "completed_challenge": challenge_completed_today}
        return jsonify(error_response), 500

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
        groq_api_key = os.environ.get('GROQ_API_KEY') or None
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