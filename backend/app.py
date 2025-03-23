from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import sqlite3
import jwt
import datetime

SECRET_KEY = "YOUR_RANDOM_SECRET_KEY"

app = Flask(__name__)
CORS(app, origins=["http://localhost:5174"], supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")


def init_db():
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()

    # Ensure tables exist, do NOT drop them on every startup
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        receiver TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')

    conn.commit()
    conn.close()


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
        conn.close()
        socketio.emit("user_registered")
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
        token = jwt.encode(
            {"username": username, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            SECRET_KEY,
            algorithm="HS256"
        )
        return jsonify({"token": token}), 200

    return jsonify({"message": "Invalid credentials"}), 401


@app.route("/verify", methods=["POST"])
def verify_token():
    token = request.headers.get("Authorization")

    if not token or not token.startswith("Bearer "):
        return jsonify({"valid": False}), 401

    try:
        token = token.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"valid": True, "username": decoded["username"]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"valid": False, "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"valid": False, "message": "Invalid token"}), 401


@app.route("/users/<username>", methods=["GET"])
def get_users(username):
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username != ?", (username,))
    users = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(users), 200

@app.route("/messages", methods=["POST"])
def save_message():
    data = request.json
    sender, receiver, content = data.get("sender"), data.get("receiver"), data.get("content")

    if not sender or not receiver or not content:
        return jsonify({"message": "Invalid message"}), 400

    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)", 
                   (sender, receiver, content))
    conn.commit()
    conn.close()

    socketio.emit("new_message", data, room=receiver)
    return jsonify({"message": "Message sent"}), 201


@app.route("/messages/<sender>/<receiver>", methods=["GET"])
def get_messages(sender, receiver):
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sender, receiver, content, timestamp FROM messages 
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) 
        ORDER BY timestamp
    """, (sender, receiver, receiver, sender))
    messages = [{"sender": row[0], "receiver": row[1], "content": row[2], "timestamp": row[3]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(messages), 200


@socketio.on("join")
def on_join(data):
    username = data["username"]
    join_room(username)


@socketio.on("send_message")
def handle_send_message(data):
    sender = data["sender"]
    receiver = data["receiver"]
    content = data["content"]

    # Save message in the database
    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)",
                   (sender, receiver, content))
    conn.commit()
    conn.close()

    # Emit the message to the correct users
    socketio.emit("new_message", data, room=receiver)  # Send to receiver
    socketio.emit("new_message", data, room=sender)  # Send to sender


if __name__ == "__main__":
    init_db()  # Only runs once to ensure database stability
    socketio.run(app, host="0.0.0.0", port=6969)
