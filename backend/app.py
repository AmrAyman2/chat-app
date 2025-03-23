from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import sqlite3
import jwt
import datetime
from functools import wraps

# SECRET KEY for JWT (Generate your own secret key)
SECRET_KEY = "a1b2c3d4e5f6g7h8i9j0"

app = Flask(__name__)
CORS(app, origins=["http://localhost:5174"], supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

def init_db():
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS users;")
    cursor.execute("DROP TABLE IF EXISTS messages;")

    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )''')

    cursor.execute('''
    CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        receiver TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')

    conn.commit()
    conn.close()

# Middleware to protect routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        
        try:
            token = token.split(" ")[1]  # Remove 'Bearer'
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = decoded
        except:
            return jsonify({"message": "Invalid token!"}), 401

        return f(*args, **kwargs)
    return decorated

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username, password = data.get("username"), data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password cannot be empty"}), 400

    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already exists"}), 400
    finally:
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username, password = data.get("username"), data.get("password")

    if not username or not password:
        return jsonify({"message": "Invalid credentials"}), 400

    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        token = jwt.encode({"username": username, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, SECRET_KEY, algorithm="HS256")
        return jsonify({"token": token, "user": {"username": username}}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route("/verify-token", methods=["POST"])
def verify_token():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"valid": False}), 401
    
    try:
        token = token.split(" ")[1]  # Remove 'Bearer'
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"valid": True, "user": {"username": decoded["username"]}}), 200
    except:
        return jsonify({"valid": False}), 401

@app.route("/users", methods=["GET"])
@token_required  # Protect this route
def get_users():
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users")
    users = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(users), 200

if __name__ == "__main__":
    init_db()
    socketio.run(app, host="0.0.0.0", port=6969)
