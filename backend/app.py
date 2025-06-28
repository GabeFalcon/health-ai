from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI()

app = Flask(__name__)
CORS(app)  # Allow React frontend to connect

OpenAI.api_key = os.environ.get("OPENAI_API_KEY")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])
    health_type = data.get("healthType", "general")

    system_prompt = {
        "role": "system",
        "content": f"""You are a helpful and empathetic health assistant. Do not respond to anything other than health related queries. If a user goes off topic say:
        "Please keep the topic related to your health concerns".

    The user is asking for help with their {health_type} health concerns.

    Act like a consultant, help the user stay calm and informed. Gather as much info as you can to offer the best treatment and professional.

    When users describe symptoms, start by asking follow-up questions like but not limited to:
    - How long have they been experiencing the issue?
    - How intense is the pain or discomfort?
    - Has anything made it better or worse?
    - Is this a recurring issue?

    Always clearly mention the type of professional (e.g. chiropractor, specific therapist, dermatologist) in that sentence.

    Once you have enough context, say:
    'It sounds like you could benefit from seeing a [specialist]. Would you like help finding one nearby?'
    This will be used to find providers on a map.
    Do not ask the user for their zip code or address — their location is already known by the system."""
    }

    full_messages = [system_prompt] + messages

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=full_messages,
        temperature=0.7
    )

    reply = response.choices[0].message.content
    return jsonify({"reply": reply})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  
    app.run(host="0.0.0.0", port=port, debug=True)