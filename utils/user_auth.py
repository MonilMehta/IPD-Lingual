from flask import Flask
from pymongo import MongoClient
from flask import Flask, jsonify, session, request, redirect, url_for, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import datetime
import hashlib
from bson import ObjectId
from flasgger import Swagger, swag_from
from decouple import config
from flask_cors import CORS
# from ultralytics import YOLO  # Commented out local model import
# from utils.model_manager import load_model  # Commented out local model loader
import asyncio
import threading
import cv2 # Added import
import numpy as np # Added import
import base64 # Added import
from utils.detection_service import DetectionService # Added import
from utils.speech_service import handle_speech_api_request # Added import
from googletrans import Translator # Add translator import if not already present

app = Flask(__name__)
swagger = Swagger(app)
CORS(app)

model= None
model_active= False

jwt = JWTManager(app)
app.config['JWT_SECRET_KEY']=config('JWT_SECRET', default='default_secret_key')
app.config['JWT_ACCESS_TOKEN_EXPIRES']= datetime.timedelta(days=1)  

client= MongoClient(config('MONGODB_URL'))
db= client['IPDatabase']
users_collection= db['users']
detection_collection = db['detectionResults']
blacklist_collection = db['token_blacklist']
language_collection= db['languageSelection']

@app.route("/register", methods=["POST"])
@swag_from({
    'tags': ['User Management'],
    'description': 'Register a new user with username and password.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'username': {'type': 'string'},
                    'password': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        '201': {'description': 'User created successfully'},
        '409': {'description': 'User already exists'}
    }
})
def register():
    new_user= request.get_json()
    new_user['password']= hashlib.sha256(new_user['password'].encode('utf-8')).hexdigest()
    doc= users_collection.find_one({'username': new_user['username']})
    
    if not doc:
        users_collection.insert_one(new_user)
        return jsonify({'msg':'User created successfully'}), 201
    else:
        return jsonify({'msg':'User already exists'}),409
    
@app.route("/login/",methods=["POST"])
@swag_from({
    'tags': ['User Management'],
    'description': 'User login to obtain access token.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'username': {'type': 'string'},
                    'password': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        '200': {
            'description': 'User logged in successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'access_token': {'type': 'string'}
                }
            }
        },
        '401': {'description': 'Username or password is incorrect'}
    }
})
def login():
    login_details= request.get_json()
    user_from_db= users_collection.find_one({'username':login_details['username']})
    
    if user_from_db:
        encrypted_password= hashlib.sha256(login_details['password'].encode('utf-8')).hexdigest()
        if encrypted_password==user_from_db['password']:
            access_token=create_access_token(identity=user_from_db['username'])
            return jsonify(access_token=access_token),200
    return jsonify({'msg':'Username or password is incorrect'}),401

@app.route("/logout", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['User Management'],
    'description': 'Logout the user by blacklisting their access token.',
    'responses': {
        '200': {'description': 'Successfully logged out'}
    }
})
def logout():
    jti = get_jwt()['jti'] 
    blacklist_collection.insert_one({'jti': jti, 'created_at': datetime.datetime.now()})  
    return jsonify({"msg": "Successfully logged out"}), 200

@app.route("/user", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['User Management'],
    'description': 'Retrieve the profile of the logged-in user.',
    'responses': {
        '200': {
            'description': 'User profile retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    '_id': {'type': 'string'},
                    'username': {'type': 'string'},
                    'other_fields': {'type': 'string'}
                }
            }
        },
        '404': {'description': 'User not found'}
    }
})
def get_user():
    current_user = get_jwt_identity()  
    user = users_collection.find_one({"username": current_user})
    if user:
        user["_id"] = str(user["_id"])  
        return jsonify(user), 200
    else:
        return jsonify({"msg": "User not found"}), 404

@app.route("/user_update", methods=["PUT"])
@jwt_required()
@swag_from({
    'tags': ['User Management'],
    'description': 'Update the profile information of the logged-in user.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'username': {'type': 'string'},
                    'password': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        '200': {'description': 'User updated successfully'},
        '400': {'description': 'Update error'}
    }
})
def update_user():
    data = request.json
    current_user = get_jwt_identity()  
    try:
        if 'password' in data:
            data['password'] = hashlib.sha256(data['password'].encode('utf-8')).hexdigest()
        users_collection.update_one({"username": current_user}, {"$set": data})
        return jsonify({"msg": "User updated successfully"}), 200
    except Exception as e:
        return jsonify({"msg": str(e)}), 400
    
@app.route("/user_delete", methods=["DELETE"])
@jwt_required()
@swag_from({
    'tags': ['User Management'],
    'description': 'Delete the logged-in user\'s profile.',
    'responses': {
        '200': {'description': 'User deleted successfully'},
        '404': {'description': 'User not found'}
    }
})
def delete_user():
    current_user = get_jwt_identity()  
    result = users_collection.delete_one({"username": current_user})
    if result.deleted_count > 0:
        return jsonify({"msg": "User deleted successfully"}), 200
    else:
        return jsonify({"msg": "User not found"}), 404

#this api to load model   
@app.route("/start_model", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['Model'],
    'description': 'Start the YOLOv12 model for real-time detection.',
    'responses': {
        '200': {
            'description': 'Model started successfully.',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        },
        '400': {
            'description': 'Model is already running.',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def start_model():
    #load model for real time detection
    global model, model_active
    if model_active:
        return jsonify({"status": "Error", "message":"Model is already running"}),400
    
    try:
        # Using Hugging Face API instead of local model
        # model = load_model("yolov12l.pt")  # Commented out local model loading
        model_active = True
        return jsonify({"status":"Success","message":"Model is successfully running via Hugging Face API"}),200
    except Exception as e:
        return jsonify({"status":"Error","message":f"Failed to start model: {str(e)}"}),500

#this api to store the detections of yolov8
@app.route("/store_detection", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['Detections'],
    'description': 'Store detections made by model for particular logged-in user.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'detections': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'data': {'type': 'string'},
                                'timestamp': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        }
    ],
    'responses': {
        '201': {'description': 'Detections stored successfully'},
        '400': {'description': 'No detections provided'}
    }
})
def store_detection():
    data= request.json
 
    if not data or 'detections' not in data:
        return jsonify({"status": "error", "message": "No detections provided"}), 400
    detections = data['detections']
    current_user = get_jwt_identity()
    for detection in detections:
        detection['timestamp'] = datetime.datetime.now()
        detection['user']= current_user
    result= detection_collection.insert_many(detections)
    return jsonify({
        "status": "success",
        "inserted_ids": [str(inserted_id) for inserted_id in result.inserted_ids]
    }), 201

#this api to check status of the model
@app.route("/check_model", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Model'],
    'description': 'Check if the YOLOv8 model is running.',
    'responses': {
        '200': {
            'description': 'Returns the status of the model.',
            'schema': {
                'type': 'object',
                'properties': {
                    'model_active': {'type': 'boolean'}
                }
            }
        }
    }
})
def check_status():
    # tells whether the model is running or not true/false
    return jsonify({"model_active": model_active}),200
    
#this api to stop the model
@app.route("/stop_model", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['Model'],
    'description': 'Stop the YOLOv8 model.',
    'responses': {
        '200': {
            'description': 'Model stopped successfully.',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        },
        '400': {
            'description': 'Model is not running.',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        }
    }
})
def stop_model():
    global model, model_active
    if not model_active:
        return jsonify({"status":"error","message":"Model is not running"}),400
    
    model = None
    model_active = False
    
    return jsonify({"status":"success","message":"Model stopped successfully"}),200
    

@app.route("/detections", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Detections'],
    'description': 'Retrieve all detections made by the logged-in user.',
    'responses': {
        '200': {
            'description': 'Detections retrieved successfully',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        '_id': {'type': 'string'},
                        'data': {'type': 'string'},
                        'timestamp': {'type': 'string'},
                        'user': {'type': 'string'}
                    }
                }
            }
        }
    }
})
def get_all_detections():
    current_user = get_jwt_identity()  
    detections = list(detection_collection.find({"user": current_user}))  
    for detection in detections:
        detection["_id"] = str(detection["_id"])
    return jsonify(detections), 200

@app.route("/delete_detection", methods=["DELETE"])
@jwt_required()
@swag_from({
    'tags': ['Detections'],
    'description': 'Delete a detection entry for the logged-in user.',
    'responses': {
        '200': {'description': 'Detection(s) deleted successfully'},
        '404': {'description': 'No detections found for the user'}
    }
})
def delete_detection():
    current_user = get_jwt_identity() 
    result = detection_collection.delete_one({'user': current_user})  
    if result.deleted_count > 0:
        return jsonify({"status": "success", "message": "Detection(s) deleted"}), 200
    else:
        return jsonify({"status": "error", "message": "No detections found for the user"}), 404
    
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
    
@app.route("/set_language", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['Language'],
    'description': 'Set the preferred language for the logged-in user.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'language': {'type': 'string'} #'enum': list(language_mapping.keys())
                }
            }
        }
    ],
    'responses': {
        '200': {'description': 'Language preference updated'},
        '400': {'description': 'Invalid or missing language'}
    }
})
def set_language():
    # data = request.get_json()
    data = request.get_json()
    language_name = data.get('language')
    if not data:
        return jsonify({"status": "error", "message": "No language provided"}), 400
    # language_code = language_mapping.get(language)
    # if not language:
    #     return jsonify({"status": "error", "message": "Invalid language provided"}), 400
    current_user = get_jwt_identity()  
    language_code = language_mapping.get(language_name)
    language_data = {
        'username': current_user,
        'language': language_code
    }
    language_collection.insert_one(language_data)
    return jsonify({"status": "success", "message": "Language preference updated", "language": language_code}), 200

@app.route("/languages", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Language'],
    'description': 'Retrieve all preferred languages set by the logged-in user.',
    'responses': {
        '200': {
            'description': 'Languages retrieved successfully',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        '_id': {'type': 'string'},
                        'language': {'type': 'string'}
                    }
                }
            }
        }
    }
})
def language_get():
    current_user = get_jwt_identity() 
    languages = list(language_collection.find({"user": current_user})) 
    for lang in languages:
        lang["_id"] = str(lang["_id"])
    return jsonify(languages), 200

@app.route("/get_websocket_url", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Model'],
    'description': 'Get the WebSocket URL for continuous object detection.',
    'responses': {
        '200': {
            'description': 'WebSocket URL',
            'schema': {
                'type': 'object',
                'properties': {
                    'websocket_url': {'type': 'string'}
                }
            }
        }
    }
})
def get_websocket_url():
    # Return the WebSocket URL configured on the server
    host = request.host.split(':')[0]  # Extract host without port
    websocket_url = f"ws://{host}:8765"
    return jsonify({"websocket_url": websocket_url}), 200

@app.route("/current_language", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['Language'],
    'description': 'Get the current language preference for the logged-in user.',
    'responses': {
        '200': {
            'description': 'Current language preference',
            'schema': {
                'type': 'object',
                'properties': {
                    'language': {'type': 'string'}
                }
            }
        }
    }
})
def get_current_language():
    current_user = get_jwt_identity()
    language_data = language_collection.find_one({"username": current_user})
    
    if language_data and 'language' in language_data:
        language_code = language_data['language']
    else:
        # Default to English if no preference is set
        language_code = 'en'
    
    # Get display name from code
    language_name = next((name for name, code in language_mapping.items() 
                         if code == language_code), 'English')
    
    return jsonify({
        "language_code": language_code,
        "language_name": language_name
    }), 200

# --- New API Routes ---

detection_service = DetectionService() # Instantiate detection service

# Define allowed languages for detection translation
ALLOWED_LANGUAGES = ['en', 'hi', 'gu', 'mr', 'kn']

# Helper async function for detection logic
async def _run_detection(file, profile, confidence, iou, target_language, username): # Add target_language and username
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

@app.route("/api/detect", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['API'],
    'description': 'Detect objects in an uploaded image using the backend API. Optionally translate labels.',
    'consumes': ['multipart/form-data'],
    'parameters': [
        # ... existing parameters (image, profile, confidence, iou) ...
        {
            'name': 'image',
            'in': 'formData',
            'type': 'file',
            'required': True,
            'description': 'Image file to process.'
        },
        {
            'name': 'profile',
            'in': 'formData',
            'type': 'string',
            'required': False,
            'default': 'general',
            'description': 'Detection profile (e.g., general, kids).'
        },
        {
            'name': 'confidence',
            'in': 'formData',
            'type': 'string',
            'required': False,
            'default': '0.3',
            'description': 'Confidence threshold for detection (0.0 to 1.0).'
        },
        {
            'name': 'iou',
            'in': 'formData',
            'type': 'string',
            'required': False,
            'default': '0.6',
            'description': 'Intersection over Union (IoU) threshold for NMS (0.0 to 1.0).'
        },
        { # Add target_language parameter
            'name': 'target_language',
            'in': 'formData',
            'type': 'string',
            'required': False,
            'enum': ALLOWED_LANGUAGES,
            'description': f'Optional target language for labels ({", ".join(ALLOWED_LANGUAGES)}). Defaults to user preference or English.'
        }
    ],
    'responses': {
        '200': {'description': 'Detection successful', 'schema': {'type': 'object'}},
        '400': {'description': 'Bad request (e.g., missing image, invalid parameters, invalid language)'},
        '500': {'description': 'Internal server error during detection'}
    }
})
def api_detect(): # Changed back to sync def
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image file provided"}), 400

    file = request.files['image']
    profile = request.form.get('profile', 'general')
    confidence = request.form.get('confidence', '0.3')
    iou = request.form.get('iou', '0.6')
    target_language_param = request.form.get('target_language') # Get optional language param

    current_user = get_jwt_identity() # Get user identity

    final_target_language = None
    if target_language_param:
        if target_language_param in ALLOWED_LANGUAGES:
            final_target_language = target_language_param
        else:
            return jsonify({"status": "error", "message": f"Invalid target_language. Must be one of: {', '.join(ALLOWED_LANGUAGES)}"}), 400
    else:
        # Fetch user's preferred language from DB
        language_data = language_collection.find_one({"username": current_user})
        if language_data and 'language' in language_data and language_data['language'] in ALLOWED_LANGUAGES:
             final_target_language = language_data['language']
        else:
            final_target_language = 'en' # Default to English

    try:
        # Pass determined language and username to the async helper
        results = asyncio.run(_run_detection(file, profile, confidence, iou, final_target_language, current_user))
        return jsonify(results), 200
    except ValueError as ve:
         return jsonify({"status": "error", "message": str(ve)}), 400
    except Exception as e:
        # Log the full exception for debugging
        import traceback
        print(f"Error in /api/detect: {e}\n{traceback.format_exc()}")
        return jsonify({"status": "error", "message": f"Detection failed: {str(e)}"}), 500

# Helper async function for speech logic
async def _run_speech(file, audio_format, lang1, lang2):
    audio_bytes = await asyncio.to_thread(file.read)
    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
    return await handle_speech_api_request(audio_base64, audio_format, lang1, lang2)

@app.route("/api/speech", methods=["POST"])
@jwt_required()
@swag_from({
    'tags': ['API'],
    'description': 'Transcribe and translate speech from an uploaded audio file.',
    'consumes': ['multipart/form-data'],
    'parameters': [
        {
            'name': 'audio',
            'in': 'formData',
            'type': 'file',
            'required': True,
            'description': 'Audio file to process.'
        },
        {
            'name': 'format',
            'in': 'formData',
            'type': 'string',
            'required': True,
            'description': 'Format of the audio file (e.g., wav, mp3, aac).'
        },
        {
            'name': 'lang1',
            'in': 'formData',
            'type': 'string',
            'required': True,
            'description': 'Source language code (e.g., en, hi, es).'
        },
        {
            'name': 'lang2',
            'in': 'formData',
            'type': 'string',
            'required': True,
            'description': 'Target language code (e.g., en, hi, es).'
        }
    ],
    'responses': {
        '200': {'description': 'Speech processing successful', 'schema': {'type': 'object'}},
        '400': {'description': 'Bad request (e.g., missing audio, invalid parameters)'},
        '500': {'description': 'Internal server error during speech processing'}
    }
})
def api_speech(): # Changed back to sync def
    if 'audio' not in request.files:
        return jsonify({"status": "error", "message": "No audio file provided"}), 400

    file = request.files['audio']
    audio_format = request.form.get('format')
    lang1 = request.form.get('lang1')
    lang2 = request.form.get('lang2')

    if not audio_format or not lang1 or not lang2:
        return jsonify({"status": "error", "message": "Missing required parameters: format, lang1, lang2"}), 400

    try:
        # Run the async helper function using asyncio.run()
        result = asyncio.run(_run_speech(file, audio_format, lang1, lang2))
        return jsonify(result), 200
    except Exception as e:
        # Log the full exception for debugging
        import traceback
        print(f"Error in /api/speech: {e}\n{traceback.format_exc()}")
        return jsonify({"status": "error", "message": f"Speech processing failed: {str(e)}"}), 500

# New endpoint for speech configuration
@app.route("/api/speech/config", methods=["GET"])
@jwt_required()
@swag_from({
    'tags': ['API', 'Speech'],
    'description': 'Get supported languages and configuration for the speech API.',
    'responses': {
        '200': {
            'description': 'Speech configuration retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'supported_languages': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'description': 'List of supported language codes (e.g., en, hi, es).'
                    },
                    # Add other relevant config details here if needed
                }
            }
        }
    }
})
def api_speech_config():
    # Define supported languages (this could be dynamic later)
    supported_languages = ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru'] # Example list
    return jsonify({
        "supported_languages": supported_languages
        # Add other config details as necessary
    }), 200


# --- End New API Routes ---


@app.route("/speech_test")
@swag_from({
    'tags': ['Speech'],
    'description': 'Test speech functionality using word2vec.',
    'responses': {
        '200': {
            'description': 'Speech test page rendered successfully'
        }
    }
})
def speech_test():
    # Get the WebSocket URL for speech service
    host = request.host.split(':')[0]  # Extract host without port
    speech_websocket_url = f"ws://{host}:8766"  # Speech service runs on port 8766
    return render_template('speech_test.html', speech_websocket_url=speech_websocket_url)