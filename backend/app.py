import os
from dotenv import load_dotenv
load_dotenv()
from pymongo import MongoClient
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))

db = client["user_behavior_db"]
collection = db["events"]

@app.route("/")
def home():
    return "Backend Running"

@app.route("/track", methods=["POST"])
def track_event():
    data = request.get_json()

    print("RECEIVED:", data)

    collection.insert_one(data)

    print("Stored in MongoDB:", data)

    return jsonify({"message": "Event stored in MongoDB"})

@app.route("/get-data", methods=["GET"])
def get_data():
    data = list(collection.find({}, {"_id": 0}))
    return jsonify(data)

# 🔥 ALWAYS KEEP THIS AT BOTTOM
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)