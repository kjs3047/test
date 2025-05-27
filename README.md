# Real-time Translator Web Application

## Description

This is a simple web application that provides a user interface for real-time text and speech translation. It currently uses a mock backend server to simulate translation responses. The primary purpose is to demonstrate frontend integration with translation and speech capabilities.

## Features

*   **Text Input and Output:** Translate typed text from a source language to a target language.
*   **Speech Input (Voice-to-Text):** Use your microphone to dictate text for translation (browser dependent, uses Web Speech API).
*   **Speech Output (Text-to-Speech):** Listen to the translated text spoken aloud (browser dependent, uses Web Speech API).
*   **Language Selection:** Choose from the following languages for input and output:
    *   Korean (`ko-KR`)
    *   English (US) (`en-US`)
    *   English (UK) (`en-GB`)
    *   Chinese (Simplified) (`zh-CN`)
    *   Japanese (`ja-JP`)
    *   French (`fr-FR`)
    *   Vietnamese (`vi-VN`)
*   **Mock Translation Backend:** The included Flask server simulates translation, returning the input text annotated with the selected languages.

## File Structure

*   `index.html`: The main HTML file for the web application interface.
*   `style.css`: Contains all the CSS rules for styling the application.
*   `script.js`: Handles frontend logic, including:
    *   Populating language dropdowns.
    *   Making API calls to the backend for translation.
    *   Implementing speech recognition (voice input) and speech synthesis (voice output) using the Web Speech API.
    *   Updating the UI with translations and error messages.
*   `app.py`: A mock backend server built with Flask (Python). It provides a `/translate` endpoint that simulates translation.
*   `requirements.txt`: Lists the Python dependencies required for the Flask backend (`Flask`, `Flask-CORS`).

## Setup and Running the Application

### Prerequisites

*   Python 3.x
*   `pip` (Python package installer, usually comes with Python)
*   A modern web browser with JavaScript enabled. Google Chrome is recommended for the best Web Speech API support.
*   Microphone and speakers for speech input/output features.

### Backend Setup

1.  **Navigate to the project directory:**
    Open your terminal or command prompt and change to the directory where you've saved these files.

2.  **Create a virtual environment (optional but recommended):**
    ```bash
    python -m venv venv
    ```
    Activate the virtual environment:
    *   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```
    *   On Windows:
        ```bash
        venv\Scripts\activate
        ```

3.  **Install Python dependencies:**
    Make sure your virtual environment is activated, then run:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask backend server:**
    ```bash
    python app.py
    ```
    The server will typically start on `http://127.0.0.1:5000/`. You should see output in your terminal indicating the server is running.

### Frontend Usage

1.  **Open `index.html`:**
    Navigate to the project directory in your file explorer and open the `index.html` file directly in your web browser (e.g., by double-clicking it or using "File > Open" in your browser).

2.  **Use the Translator:**
    *   Select your desired input and output languages from the dropdown menus.
    *   Type text into the "Input Language" textarea and click the "Translate" button. The mock translation will appear in the "Output Language" textarea.
    *   Click "Record Voice" to use speech input (if your browser supports it and you grant microphone permission).
    *   Click "Play Translation" to hear the text in the output textarea spoken (if your browser supports it).

## Notes

*   **Mock Backend:** The current version of `app.py` provides **mock translations only**. It does not connect to any real translation service. To implement actual translation, you would need to modify `app.py` to integrate with a third-party translation API (e.g., Google Translate API, DeepL API, etc.).
*   **Web Speech API:** The speech input (SpeechRecognition) and speech output (SpeechSynthesis) features rely on the Web Speech API, which is not uniformly supported across all browsers. Functionality and language support may vary. Google Chrome generally offers the best compatibility.
*   **Internet Connection:** While the mock backend runs locally, real translation services and potentially some Web Speech API features (like server-side recognition for some browsers) might require an active internet connection.
