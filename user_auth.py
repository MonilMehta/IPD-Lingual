from flask import Flask
from pymongo import MongoClient
from flask import Flask, jsonify, session, request, redirect, url_for
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import datetime
import hashlib
from bson import ObjectId
from flasgger import Swagger, swag_from
# import urllib

app = Flask('__ipd__')
swagger = Swagger(app)

jwt = JWTManager(app)
app.config['JWT_SECRET_KEY']='bdbb33de02888335b0ed10c9038f40d2581fd7f6f95afef1c42c51de76c566a4'
app.config['JWT_ACCESS_TOKEN_EXPIRES']= datetime.timedelta(days=1)  

client= MongoClient('mongodb+srv://mehekmde23:UWloBpc8M2znH9qT@ipd.cw6h2.mongodb.net/?retryWrites=true&w=majority&appName=IPD')
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
                    'language': {'type': 'string', 'enum': list(language_mapping.keys())}
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
    data = request.get_json()
    language = data.get('language')
    if not language:
        return jsonify({"status": "error", "message": "No language provided"}), 400
    language_code = language_mapping.get(language)
    if not language_code:
        return jsonify({"status": "error", "message": "Invalid language provided"}), 400
    current_user = get_jwt_identity()   
    language_collection.insert_one(
        {'username': current_user},
        {'language': language_code}
    )
    return jsonify({"status": "success", "message": "Language preference updated"}), 200

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

if __name__ == '__main__':
    app.run(debug=True)