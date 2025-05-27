# To run this Flask app:
# 1. Make sure you have Python installed.
# 2. Install the dependencies: pip install -r requirements.txt
# 3. Run the app: python app.py
# The server will start, usually on http://127.0.0.1:5000/

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def home():
    return "Mock translation server is running"

@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' in request body"}), 400
    if 'source_lang' not in data:
        return jsonify({"error": "Missing 'source_lang' in request body"}), 400
    if 'target_lang' not in data:
        return jsonify({"error": "Missing 'target_lang' in request body"}), 400

    text_to_translate = data['text']
    source_lang = data['source_lang']
    target_lang = data['target_lang']

    # Mock translation logic
    translated_text = f"{text_to_translate} (translated from {source_lang} to {target_lang})"

    return jsonify({"translated_text": translated_text})

if __name__ == '__main__':
    app.run(debug=True)
