from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from datetime import datetime, timedelta
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Table
from io import BytesIO
from flask import send_file
import os
import random
import requests

from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# ================= MONGODB CONNECTION =================
client = MongoClient("mongodb://localhost:27017/")
db = client["railway_db"]
users_collection = db["users"]
bookings_collection = db["bookings"] 
trains_collection = db["trains"]
# ================= LOAD MODEL =================
try:
    model = joblib.load("seat_allocation_model.pkl")
    features = joblib.load("model_features.pkl")
    print("✅ Model loaded successfully")
except Exception as e:
    print("❌ Error loading model:", e)
    model = None
    features = None

# ================= MEMORY STORAGE =================
prediction_history = []
OTP_STORE = {}

# ================= HOME =================
@app.route("/", methods=["GET"])
def home():
    return "🚆 Train Reallocation Backend Running"

# ================= SEND OTP =================
@app.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.json
    phone = data.get("phone")

    if not phone:
        return jsonify({"error": "Phone number required"}), 400

    otp = str(random.randint(100000, 999999))
    expiry_time = datetime.now() + timedelta(minutes=2)

    OTP_STORE[phone] = {
        "otp": otp,
        "expiry": expiry_time
    }

    print(f"📱 OTP for {phone}: {otp}")

    return jsonify({"message": "OTP sent successfully (Check terminal)"})


# ================= VERIFY OTP =================
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    phone = data.get("phone")
    otp_entered = data.get("otp")

    if phone not in OTP_STORE:
        return jsonify({"error": "OTP not requested"}), 400

    stored_data = OTP_STORE[phone]

    if datetime.now() > stored_data["expiry"]:
        OTP_STORE.pop(phone)
        return jsonify({"error": "OTP expired"}), 400

    if stored_data["otp"] == otp_entered:
        OTP_STORE.pop(phone)
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Invalid OTP"}), 400


# ================= REGISTER =================
@app.route('/register', methods=['POST'])
def register():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")
    captcha_token = data.get("captcha")

    if not all([name, email, password, phone, captcha_token]):
        return jsonify({"message": "All fields required"}), 400

    # ===== CAPTCHA VERIFY =====
    secret_key = "6Lc7c24sAAAAAK80kiIYcDoIMRhneJSs1IaPbH28"   # 🔥 PUT YOUR SECRET KEY

    response = requests.post(
        "https://www.google.com/recaptcha/api/siteverify",
        data={
            "secret": secret_key,
            "response": captcha_token
        }
    )

    result = response.json()

    if not result.get("success"):
        return jsonify({"message": "Captcha failed"}), 400

    # ===== CHECK EXISTING USER =====
    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    # ===== HASH PASSWORD =====
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # ===== SAVE USER =====
    users_collection.insert_one({
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_password,
        "created_at": datetime.now()
    })

    return jsonify({"message": "Registered successfully"}), 201


# ================= LOGIN =================
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})

    if user and bcrypt.check_password_hash(user["password"], password):

        access_token = create_access_token(identity=email)

        return jsonify({
            "message": "Login successful",
            "token": access_token
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401


# ================= AVAILABLE TRAINS =================
@app.route("/available-trains", methods=["GET"])
def available_trains():
    try:
        trains = list(db.trains.find({}, {"_id": 0}))
        return jsonify(trains)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= PREDICT =================
@app.route("/predict", methods=["POST"])
def predict():

    try:
        data = request.json

        seats = data.get("Seats_Available", 0)

        if seats > 0:
            result = True
        else:
            result = False

        return jsonify({"seat_allocated": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= SAVE BOOKING (MongoDB) =================
@app.route("/save-booking", methods=["POST"])
@jwt_required()
def save_booking():

    data = request.get_json()
    train_no = data.get("TrainNo")

    if not train_no:
        return jsonify({"error": "Train number missing"}), 400

    train = db.trains.find_one({"TrainNo": train_no})

    if not train:
        return jsonify({"error": "Train not found"}), 404

    # 🚆 If train cancelled
    if train.get("Train_Status") == "Cancelled":
        return jsonify({"error": "Train is cancelled"}), 400

    # 🎫 Seat Allocation Logic
    if train["Seats_Available"] > 0:

        db.trains.update_one(
            {"TrainNo": train_no},
            {"$inc": {"Seats_Available": -1}}
        )

        seat_status = "CONFIRMED"

    else:
        db.trains.update_one(
            {"TrainNo": train_no},
            {"$inc": {"Waiting_List": 1}}
        )

        seat_status = "WAITING"

    # 💾 Save booking
    db.bookings.insert_one({
        "user_email": get_jwt_identity(),
        "TrainNo": train_no,
        "trainName": train["TrainName"],
        "seat_status": seat_status,
        "booking_time": datetime.utcnow()
    })

    return jsonify({"status": seat_status})
#=================== DOWNLOAD TICKET (PDF) =================

@app.route("/download-ticket/<train_name>", methods=["GET"])
@jwt_required()
def download_ticket(train_name):

    current_user_email = get_jwt_identity()

    booking = bookings_collection.find_one({
        "user_email": current_user_email,
        "trainName": train_name
    })

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer)

    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("🚆 Train Ticket", styles["Title"]))
    elements.append(Spacer(1, 0.5 * inch))

    data = [
        ["Train", booking["trainName"]],
        ["Train No", booking["TrainNo"]],
        ["Seat Status", booking["seat_status"]],
        ["Booking Time", str(booking["booking_time"])]
    ]

    table = Table(data)
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="ticket.pdf",
        mimetype="application/pdf"
    )
#===================cancel booking==================
@app.route("/cancel-booking/<train_name>", methods=["DELETE"])
@jwt_required()
def cancel_booking(train_name):

    current_user_email = get_jwt_identity()

    booking = bookings_collection.find_one({
        "user_email": current_user_email,
        "trainName": train_name
    })

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    trains_collection.update_one(
        {"trainName": train_name},
        {"$inc": {"available_seats": 1}}
    )

    bookings_collection.delete_one({
        "user_email": current_user_email,
        "trainName": train_name
    })

    return jsonify({"message": "Booking cancelled successfully"})
#==================Reallocastion ========================
@app.route("/reallocate/<train_id>", methods=["POST"])
def reallocate(train_id):

    diverted_passengers = list(
        bookings_collection.find({
            "train_id": train_id,
            "status": "DIVERTED"
        }).sort("booking_time", 1)
    )

    alternate_trains = list(
        trains_collection.find({
            "status": "RUNNING"
        })
    )

    for passenger in diverted_passengers:

        for train in alternate_trains:

            if train["available_seats"] > 0:

                trains_collection.update_one(
                    {"train_id": train["train_id"]},
                    {"$inc": {"available_seats": -1}}
                )

                bookings_collection.update_one(
                    {"_id": passenger["_id"]},
                    {"$set": {
                        "train_id": train["train_id"],
                        "train_name": train["train_name"],
                        "status": "CONFIRMED"
                    }}
                )

                break

            # 🔥 SMART COACH ADDITION
            elif train["extra_coaches_added"] < train["max_extra_coaches"]:

                trains_collection.update_one(
                    {"train_id": train["train_id"]},
                    {
                        "$inc": {
                            "available_seats": 72,
                            "extra_coaches_added": 1
                        }
                    }
                )

    return jsonify({"message": "Reallocation completed"})
# ================= GET BOOKING HISTORY =================
@app.route("/booking-history", methods=["GET"])
@jwt_required()
def booking_history():

    current_user_email = get_jwt_identity()

    bookings = list(
        bookings_collection.find(
            {"user_email": current_user_email},
            {"_id": 0}
        )
    )

    return jsonify(bookings), 200



# ================= ANALYTICS =================
@app.route("/analytics", methods=["GET"])
def analytics():
    total = len(prediction_history)
    yes = sum(1 for h in prediction_history if h["result"] == "Yes")
    no = total - yes

    return jsonify({
        "total": total,
        "allocated": yes,
        "not_allocated": no
    })


# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True, port=5000)
