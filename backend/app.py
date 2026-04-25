from pymongo import MongoClient
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://yashvi_test_user:yashvitest1@ac-do8yb4a-shard-00-00.l7xtbf4.mongodb.net:27017,ac-do8yb4a-shard-00-01.l7xtbf4.mongodb.net:27017,ac-do8yb4a-shard-00-02.l7xtbf4.mongodb.net:27017/?ssl=true&replicaSet=atlas-esz1l5-shard-0&authSource=admin&appName=Cloud-Cluster")

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