from flask import Flask, request
import requests
import json
import os
import redis
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
REDIS_URL = os.getenv("REDIS_URL")
DEFAULT_COUNTRY_CODE = os.getenv("DEFAULT_COUNTRY_CODE", "+250")

if REDIS_URL:
    redis_client = redis.from_url(REDIS_URL)
else:
    redis_client = None

# A phone alone has no email address, so one is built from the number.
EMAIL_DOMAIN = "beralcare.local"


def ussd_email(phone):
    return f"ussd_{phone.replace('+', '')}@{EMAIL_DOMAIN}"


def ussd_login(phone, password):
    return requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"email": ussd_email(phone), "password": password},
    )


@app.route('/', methods=['GET'])
def home():
    return "USSD Service is running!", 200

@app.route('/ussd', methods=['POST'])
def ussd_callback():
    session_id = request.form.get('sessionId')
    service_code = request.form.get('serviceCode')
    phone_number = request.form.get('phoneNumber')
    text = request.form.get('text')

    user_response = text.strip().split('*')
    response = ""

    # Format phone number to match API expectations
    formatted_phone = phone_number
    if phone_number.startswith('+'):
        # Already has country code
        formatted_phone = phone_number
    elif phone_number.startswith('0'):
        # Local format like 0788000000 -> +250788000000 (uses configured country code)
        formatted_phone = DEFAULT_COUNTRY_CODE + phone_number[1:]
    elif phone_number.isdigit() and len(phone_number) >= 9:
        # Just digits, prepend configured country code
        formatted_phone = DEFAULT_COUNTRY_CODE + phone_number

    # Retrieve token and user_id from Redis if available
    user_session_data = {}
    if redis_client:
        stored_data = redis_client.get(session_id)
        if stored_data:
            user_session_data = json.loads(stored_data)
    
    user_token = user_session_data.get('token')
    user_id = user_session_data.get('user_id')
    user_name = user_session_data.get('user_name', '')

    if text == "":
        # Main menu
        response = "CON Welcome to Beral Care\n"
        response += "1. Register\n"
        response += "2. Login"
        
    elif user_response[0] == "1":  # Registration flow
        if len(user_response) == 1:
            response = "CON Enter your full name:"
        elif len(user_response) == 2:
            response = "CON Enter your password (min 8 chars, include upper, lower, number):"
        elif len(user_response) == 3:
            full_name = user_response[1]
            password = user_response[2]

            try:
                register_data = {
                    "full_name": full_name,
                    "phone": formatted_phone,
                    "password": password,
                    "email": ussd_email(formatted_phone),
                    "role": "patient"
                }
                api_response = requests.post(f"{API_BASE_URL}/api/auth/register", json=register_data)
                api_response.raise_for_status()
                
                response_data = api_response.json()
                
                if redis_client:
                    redis_client.set(session_id, json.dumps({
                        'token': response_data.get('token'),
                        'user_id': response_data.get('user', {}).get('id'),
                        'user_name': full_name
                    }), ex=3600)

                response = f"END Thanks {full_name}, registration successful!"
            except requests.exceptions.HTTPError:
                response = "END Registration failed. Please try again."
            except Exception:
                response = "END Registration failed due to an unexpected error."
                
    elif user_response[0] == "2":  # Login flow
        if len(user_response) == 1:
            response = "CON Enter your password:"
        elif len(user_response) == 2:
            password = user_response[1]
            
            try:
                api_response = ussd_login(formatted_phone, password)
                api_response.raise_for_status()

                response_data = api_response.json()
                user_full_name = response_data['user']['full_name']
                
                if redis_client:
                    redis_client.set(session_id, json.dumps({
                        'token': response_data.get('token'),
                        'user_id': response_data.get('user', {}).get('id'),
                        'user_name': user_full_name
                    }), ex=3600)

                # Show logged-in menu
                response = f"CON Welcome {user_full_name}!\n"
                response += "1. Request consultation\n"
                response += "2. Consultation history\n"
                response += "3. Logout"
                
            except requests.exceptions.HTTPError:
                response = "END Login failed. Please try again."
            except Exception:
                response = "END Login failed due to an unexpected error."
        
        # Handle logged-in menu options
        elif len(user_response) == 3:
            if not user_token or not user_id:
                response = "END Error: You are not logged in."
                return response, 200, {'Content-Type': 'text/plain'}
                
            menu_choice = user_response[2]
            
            if menu_choice == "1":  # Book consultation
                response = "CON Enter your health concern briefly:"
            elif menu_choice == "2":  # Consultation history
                try:
                    headers = {"Authorization": f"Bearer {user_token}"}
                    api_response = requests.get(f"{API_BASE_URL}/api/patient/consultations", headers=headers)
                    api_response.raise_for_status()
                    
                    consultations = api_response.json()
                    if consultations:
                        response = "END Consultation history:\n"
                        for i, consultation in enumerate(consultations[-3:], 1):
                            date = consultation.get('consultation_date', 'N/A')
                            status = consultation.get('status', 'N/A')
                            response += f"{i}. {date} - {status}\n"
                    else:
                        response = "END No consultation history found."
                except Exception:
                    response = "END Failed to load history. Please try again."
                    
            elif menu_choice == "3":  # Logout
                if redis_client:
                    redis_client.delete(session_id)
                response = "END Logged out successfully."
            else:
                response = "END Invalid option selected."
        
        # Handle consultation booking after logged-in menu
        elif len(user_response) == 4 and user_response[2] == "1":
            consultation_description = user_response[3]
            
            if not user_token or not user_id:
                response = "END Error: You are not logged in."
                return response, 200, {'Content-Type': 'text/plain'}

            try:
                # Get first available doctor or create a default consultation
                headers = {"Authorization": f"Bearer {user_token}"}
                doctors_response = requests.get(f"{API_BASE_URL}/api/patient/doctors", headers=headers)
                doctors_response.raise_for_status()
                doctors = doctors_response.json()
                
                # Use first doctor if available, otherwise fail gracefully
                if not doctors or len(doctors) == 0:
                    response = "END No doctors available. Please try again later."
                else:
                    doctor_id = doctors[0]['id']
                    
                    # Create consultation
                    consultation_data = {
                        "doctor_id": doctor_id,
                        "notes": consultation_description,
                        "status": "pending",
                        "consultation_date": datetime.now().strftime('%Y-%m-%d')
                    }
                    consultation_response = requests.post(f"{API_BASE_URL}/api/patient/appointments", json=consultation_data, headers=headers)
                    consultation_response.raise_for_status()
                    response = "END Consultation request submitted successfully. A doctor will contact you."
                
            except requests.exceptions.RequestException:
                response = "END Consultation request failed. Please try again."
    else:
        response = "END Invalid option selected."

    return response, 200, {'Content-Type': 'text/plain'}