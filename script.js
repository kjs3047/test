// JavaScript logic will be added in a later step.

const supportedLanguages = [
    { name: "Korean", value: "ko-KR" },
    { name: "English (US)", value: "en-US" },
    { name: "Chinese (Simplified)", value: "zh-CN" },
    { name: "Japanese", value: "ja-JP" },
    { name: "French", value: "fr-FR" },
    { name: "English (UK)", value: "en-GB" },
    { name: "Vietnamese", value: "vi-VN" }
];

const inputLangSelect = document.getElementById('input-lang');
const outputLangSelect = document.getElementById('output-lang');
const recordVoiceBtn = document.getElementById('record-voice-btn');
const playVoiceBtn = document.getElementById('play-voice-btn');
const translateBtn = document.getElementById('translate-btn');
const inputTextarea = document.getElementById('input-text');
const outputTextarea = document.getElementById('output-text');

window.addEventListener('load', () => {
    supportedLanguages.forEach(lang => {
        const inputOption = document.createElement('option');
        inputOption.value = lang.value;
        inputOption.textContent = lang.name;
        inputLangSelect.appendChild(inputOption);

        const outputOption = document.createElement('option');
        outputOption.value = lang.value;
        outputOption.textContent = lang.name;
        outputLangSelect.appendChild(outputOption);
    });

    // Set default languages
    if (supportedLanguages.length > 0) {
        inputLangSelect.value = supportedLanguages[0].value; // Default to Korean
        outputLangSelect.value = supportedLanguages[1].value; // Default to English (US)
    }
});

translateBtn.addEventListener('click', () => {
    console.log("Translate button clicked");
    const inputText = inputTextarea.value;
    const inputLang = inputLangSelect.value;
    const outputLang = outputLangSelect.value;
    console.log("Input Text:", inputText);
    console.log("Input Language:", inputLang);
    console.log("Output Language:", outputLang);

    if (!inputText.trim()) {
        alert("Input text cannot be empty.");
        return;
    }

    const data = {
        text: inputText,
        source_lang: inputLang,
        target_lang: outputLang
    };

    async function fetchTranslation() {
        try {
            const response = await fetch('http://127.0.0.1:5000/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                outputTextarea.value = result.translated_text;
            } else {
                const errorResult = await response.json();
                console.error("Translation API error:", response.status, errorResult);
                outputTextarea.value = `Error: ${errorResult.error || response.statusText}`;
            }
        } catch (error) {
            console.error("Network or other error during translation:", error);
            outputTextarea.value = `Error: Could not connect to the translation service. ${error.message}`;
        }
    }

    fetchTranslation();
});

recordVoiceBtn.addEventListener('click', () => {
    console.log("Record voice button clicked");
    // Later, this will initiate speech recognition
});

playVoiceBtn.addEventListener('click', () => {
    console.log("Play voice button clicked");
    // Later, this will initiate speech synthesis
});

// Web Speech API Setup
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Transcript:", transcript);
        inputTextarea.value = transcript; // Populate input textarea with transcript
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recordVoiceBtn.addEventListener('click', () => {
        console.log("Record voice button clicked - starting recognition");
        try {
            recognition.lang = inputLangSelect.value; // Set recognition language
            recognition.start();
        } catch (error) {
            console.error("Error starting recognition:", error);
        }
    });
} else {
    console.warn("SpeechRecognition API not supported in this browser.");
    recordVoiceBtn.disabled = true;
    recordVoiceBtn.textContent = "Voice Input Not Supported";
}

if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;

    playVoiceBtn.addEventListener('click', () => {
        console.log("Play voice button clicked - initiating synthesis");
        const textToSpeak = outputTextarea.value;
        if (textToSpeak.trim() !== "") {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = outputLangSelect.value;
            utterance.onerror = (event) => {
                console.error("Speech synthesis error:", event.error);
            };
            synth.speak(utterance);
        } else {
            console.log("Output text is empty, nothing to speak.");
        }
    });
} else {
    console.warn("SpeechSynthesis API not supported in this browser.");
    playVoiceBtn.disabled = true;
    playVoiceBtn.textContent = "Voice Output Not Supported";
}
