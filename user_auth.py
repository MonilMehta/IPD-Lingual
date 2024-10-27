from flask import Flask
from pymongo import MongoClient
from flask import Flask, jsonify, session, request, redirect, url_for
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import datetime
import hashlib
# import urllib

app = Flask('__ipd__')

jwt = JWTManager(app)
app.config['JWT_SECRET_KEY']='bdbb33de02888335b0ed10c9038f40d2581fd7f6f95afef1c42c51de76c566a4'
app.config['JWT_ACCESS_TOKEN_EXPIRES']= datetime.timedelta(days=1)  

client= MongoClient('mongodb+srv://mehekmde23:UWloBpc8M2znH9qT@ipd.cw6h2.mongodb.net/?retryWrites=true&w=majority&appName=IPD')
db= client['IPDatabase']
users_collection= db['users']

@app.route("/register", methods=["POST"])
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
def login():
    login_details= request.get_json()
    user_from_db= users_collection.find_one({'username':login_details['username']})
    
    if user_from_db:
        encrypted_password= hashlib.sha256(login_details['password'].encode('utf-8')).hexdigest()
        if encrypted_password==user_from_db['password']:
            access_token=create_access_token(identity=user_from_db['username'])
            return jsonify(access_token=access_token),200
    return jsonify({'msg':'Username or password is incorrect'}),401


if __name__ == '__main__':
    app.run(debug=True)