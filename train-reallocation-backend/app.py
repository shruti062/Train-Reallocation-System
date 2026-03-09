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
    captcha_token = data.get("captcha_token")

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
            result = "Yes"
        else:
            result = "No"

        # ✅ Save in history
        prediction_history.append({
            "timestamp": datetime.now(),
            "seats_available": seats,
            "result": result
        })

        return jsonify({"seat_allocated": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ================= SAVE BOOKING (MongoDB) =================

@app.route("/save-booking", methods=["POST"])
@jwt_required()
def save_booking():

    data = request.json
    user_email = get_jwt_identity()

    pnr = str(random.randint(1000000000, 9999999999))
    current_time = datetime.now()
    train_no = data.get("TrainNo")
    notification = ""

    # Get train details
    train = trains_collection.find_one({"TrainNo": train_no})
# 🔥 Smart coach auto add check
    if train and train.get("Seats_Available",0) <= 0:
        smart_add_coach(train_no)
        notification = "🚆 Train was full. Extra coach added automatically."

    booking = {
    "PNR": pnr,
    "user_email": user_email,
    "TrainNo": data.get("TrainNo"),
    "TrainName": data.get("TrainName"),
    "Source": data.get("Source"),
    "Destination": data.get("Destination"),
    "Journey_Date": data.get("Journey_Date"),
    "Departure_Time": data.get("Departure_Time"),
    "Arrival_Time": data.get("Arrival_Time"),
    "Passenger_Name": data.get("Passenger_Name"),
    "Age": data.get("Age"),
    "Gender": data.get("Gender"),
    "Seat_Number": random.randint(1, 72),
    "Coach": "S1",
    "seat_status": "Confirmed",
    "booking_date": current_time.strftime("%Y-%m-%d"),
        "booking_time": current_time.strftime("%H:%M:%S")
}

    bookings_collection.insert_one(booking)
 # 🔥 Reduce seat count
    trains_collection.update_one(
        {"TrainNo": data.get("TrainNo")},
        {"$inc": {"Seats_Available": -1}}
    )
    return jsonify({
        "status": "Confirmed",
        "PNR": pnr,
         "notification": notification
    })
    # ================= GET TICKET BY PNR =================
@app.route("/ticket/<pnr>", methods=["GET"])
@jwt_required()
def get_ticket(pnr):

    user_email = get_jwt_identity()

    booking = bookings_collection.find_one({
        "PNR": pnr,
        "user_email": user_email
    })

    if not booking:
        return jsonify({"error": "Not found"}), 404

    booking["_id"] = str(booking["_id"])
    return jsonify(booking)
#=================== DOWNLOAD TICKET (PDF) =================
@app.route("/download-ticket/<pnr>", methods=["GET"])
@jwt_required()
def download_ticket(pnr):

    current_user_email = get_jwt_identity()

    booking = bookings_collection.find_one({
        "user_email": current_user_email,
        "PNR": pnr
    })

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer)
    elements = []

    styles = getSampleStyleSheet()
    elements.append(Paragraph("Railway E-Ticket", styles["Title"]))
    elements.append(Spacer(1, 12))

    data = [
        ["PNR", booking.get("PNR")],
        ["Train Name", booking.get("TrainName")],
        ["Train No", booking.get("TrainNo")],
        ["From", booking.get("Source")],
        ["To", booking.get("Destination")],
        ["Seat Status", booking.get("seat_status")],
        ["Coach", booking.get("Coach")],
        ["Seat Number", booking.get("Seat_Number")],
        ["Booking Time", str(booking.get("booking_time",""))]
    ]

    table = Table(data)
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Ticket_{pnr}.pdf",
        mimetype="application/pdf"
    )
#===================cancel booking==================

@app.route("/cancel-booking/<pnr>", methods=["DELETE"])
@jwt_required()
def cancel_booking(pnr):

    current_user_email = get_jwt_identity()

    booking = bookings_collection.find_one({
        "user_email": current_user_email,
        "PNR": pnr
    })

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.get("seat_status") == "Confirmed":

        trains_collection.update_one(
            {"TrainNo": booking.get("TrainNo")},
            {"$inc": {"Seats_Available": 1}}
        )

    bookings_collection.delete_one({
        "user_email": current_user_email,
        "PNR": pnr
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
        ).sort("booking_time", -1)   
    )

    return jsonify(bookings), 200



# ================= ANALYTICS =================
@app.route("/analytics", methods=["GET"])
def analytics():

    total_bookings = bookings_collection.count_documents({})

    confirmed = bookings_collection.count_documents({
        "seat_status": "Confirmed"
    })

    cancelled = bookings_collection.count_documents({
        "seat_status": "Cancelled"
    })

    return jsonify({
        "total": total_bookings,
        "allocated": confirmed,
        "not_allocated": cancelled
    })
# ================= TRAIN CANCEL + AUTO REALLOCATION =================

@app.route("/cancel-train/<train_no>", methods=["POST"])
def cancel_train(train_no):

    train_no = int(train_no)   # 🔥 IMPORTANT FIX

    passengers = list(
        bookings_collection.find({
            "TrainNo": train_no
        })
    )

    if not passengers:
        return jsonify({"message": "No passengers found for this train"})

    reallocated = 0

    for passenger in passengers:

        source = passenger.get("Source")
        destination = passenger.get("Destination")

        alt_train = trains_collection.find_one({
            "Source": source,
            "Destination": destination,
            "Seats_Available": {"$gt": 0},
            "TrainNo": {"$ne": train_no}
        })

        if alt_train:

            # reduce seat
            trains_collection.update_one(
                {"TrainNo": alt_train["TrainNo"]},
                {"$inc": {"Seats_Available": -1}}
            )
            smart_add_coach(alt_train["TrainNo"])
            # update passenger booking
            bookings_collection.update_one(
                {"_id": passenger["_id"]},
                {"$set": {
                    "TrainNo": alt_train["TrainNo"],
                    "TrainName": alt_train["TrainName"],
                    "Seat_Number": random.randint(1,72),
                    "seat_status": "Auto-Reallocated"
                }}
            )

            reallocated += 1
            
    return jsonify({
        "message": "Train cancelled and passengers reallocated",
        "total_passengers": len(passengers),
        "reallocated": reallocated
    })
# ================= FIND ALTERNATIVE TRAINS =================
@app.route("/find-alternative/<pnr>", methods=["GET"])
def find_alternative(pnr):

    booking = bookings_collection.find_one({"PNR": pnr})

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    source = booking.get("Source")
    destination = booking.get("Destination")

    alt_trains = list(
        trains_collection.find(
            {
                "Source": source,
                "Destination": destination,
                "Seats_Available": {"$gt": 0},
                "TrainNo": {"$ne": booking.get("TrainNo")}
            },
            {"_id": 0}
        )
    )

    return jsonify({
        "passenger": booking.get("Passenger_Name"),
        "original_train": booking.get("TrainName"),
        "alternative_trains": alt_trains
    })
# ================= TT REALLOCATE SEAT =================
@app.route("/tt-reallocate", methods=["POST"])
def tt_reallocate():

    data = request.json
    pnr = data.get("PNR")
    new_train = int(data.get("TrainNo"))

    booking = bookings_collection.find_one({"PNR": pnr})

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    train = trains_collection.find_one({"TrainNo": new_train})

    if not train:
        return jsonify({"error": "Train not found"}), 404

    if train["Seats_Available"] <= 0:
        return jsonify({"error": "No seats available"}), 400

    # reduce seat in new train
    trains_collection.update_one(
        {"TrainNo": new_train},
        {"$inc": {"Seats_Available": -1}}
    )
    smart_add_coach(new_train)
    # update booking
    bookings_collection.update_one(
        {"PNR": pnr},
        {"$set": {
            "TrainNo": new_train,
            "TrainName": train["TrainName"],
            "Seat_Number": random.randint(1,72),
            "seat_status": "Reallocated"
        }}
    )

    return jsonify({"message": "Seat reallocated successfully"})
# ================= PNR STATUS =================
@app.route("/pnr-status/<pnr>", methods=["GET"])
def pnr_status(pnr):

    booking = bookings_collection.find_one({"PNR": pnr})

    if not booking:
        return jsonify({"error": "PNR not found"}), 404

    booking["_id"] = str(booking["_id"])

    return jsonify({
        "PNR": booking.get("PNR"),
        "Passenger_Name": booking.get("Passenger_Name"),
        "TrainNo": booking.get("TrainNo"),
        "TrainName": booking.get("TrainName"),
        "Source": booking.get("Source"),
        "Destination": booking.get("Destination"),
        "Coach": booking.get("Coach"),
        "Seat_Number": booking.get("Seat_Number"),
        "seat_status": booking.get("seat_status")
    })
# ================= SMART COACH AUTO ADD =================
def smart_add_coach(train_no):

    train = trains_collection.find_one({"TrainNo": train_no})

    if not train:
        return

    if train.get("Seats_Available",0) > 0:
        return

    if train.get("extra_coaches_added",0) < train.get("max_extra_coaches",0):

        trains_collection.update_one(
            {"TrainNo": train_no},
            {
                "$inc": {
                    "Seats_Available": 72,
                    "extra_coaches_added": 1
                }
            }
        )

        print(f"🚆 Extra coach automatically added to train {train_no}")
# ================= RUN APP =================
if __name__ == "__main__":
    app.run(debug=True, port=5000)