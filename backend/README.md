# IPD-Lingual

IPD-Lingual is a comprehensive real-time translation and object detection system. It combines OpenAI's Whisper model for accurate speech recognition, Google Translate for translation, and YOLOv12 for object detection. The system supports multiple languages and provides WebSocket interfaces for real-time communication.

## Features

### Speech Translation
- Real-time speech recognition using OpenAI's Whisper model
- Accurate language detection and script validation
- Support for multiple languages including Hindi, English, Japanese, and more
- Handling of common phrases and proper nouns
- WebSocket interface for real-time communication
- Fallback mechanisms for robust operation

### Object Detection
- Real-time object detection using YOLOv12
- Automatic translation of detected object labels
- Frame similarity detection to optimize processing
- Rate limiting and queue management for efficient resource usage
- User-specific language preferences

## Requirements

- Python 3.8+
- FFmpeg (for audio processing)
- CUDA-compatible GPU (optional, for faster processing)
- MongoDB (for user language preferences)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/IPD-Lingual.git
   cd IPD-Lingual
   ```

2. Install FFmpeg (required for audio processing):
   
   **On Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```
   
   **On macOS (using Homebrew):**
   ```bash
   brew install ffmpeg
   ```
   
   **On Windows:**
   Download from [FFmpeg.org](https://ffmpeg.org/download.html) and add to PATH

3. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

5. Download the Whisper model (this happens automatically on first run, but you can pre-download):
   ```bash
   python -c "import whisper; whisper.load_model('small')"
   ```

6. Configure MongoDB connection:
   Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URL=mongodb://username:password@localhost:27017/
   ```

## Usage

1. Start the server:
   ```bash
   python run_server.py
   ```

   This will start:
   - A Flask REST API server on port 5000
   - A WebSocket server for detection services on port 8765
   - A WebSocket server for speech translation on port 8766

### Speech Translation Service

1. Connect to the speech translation WebSocket server:
   ```javascript
   const socket = new WebSocket('ws://localhost:8766');
   ```

2. Set the languages for translation:
   ```javascript
   socket.send(JSON.stringify({
     setLanguages: {
       language1: 'en',  // English
       language2: 'hi'   // Hindi
     }
   }));
   ```

3. Send audio for translation:
   ```javascript
   // Assuming you have base64-encoded AAC audio
   socket.send(JSON.stringify({
     audio: base64AudioData,
     format: 'aac'
   }));
   ```

4. Receive translation results:
   ```javascript
   socket.onmessage = (event) => {
     const data = JSON.parse(event.data);
     if (data.type === 'translation') {
       console.log('Original:', data.original.text);
       console.log('Translated:', data.translated.text);
     }
   };
   ```

### Object Detection Service

1. Connect to the detection WebSocket server:
   ```javascript
   const socket = new WebSocket('ws://localhost:8765');
   ```

2. Start detection and set user language:
   ```javascript
   socket.send(JSON.stringify({
     type: 'start',
     username: 'user123'  // Optional: to load user's preferred language
   }));
   ```

3. Set detection language (if not using username):
   ```javascript
   socket.send(JSON.stringify({
     type: 'set_language',
     language: 'hi'  // Language code
   }));
   ```

4. Send video frames for detection:
   ```javascript
   // Assuming you have base64-encoded image data
   socket.send(JSON.stringify({
     type: 'frame',
     data: base64ImageData
   }));
   ```

5. Receive detection results:
   ```javascript
   socket.onmessage = (event) => {
     const data = JSON.parse(event.data);
     if (data.type === 'detection') {
       console.log('Detected objects:', data.results);
       // Each result contains: box, class, label, translated, confidence
     }
   };
   ```

6. Stop detection:
   ```javascript
   socket.send(JSON.stringify({
     type: 'stop'
   }));
   ```

## Supported Languages

- English (en)
- Hindi (hi)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)
- Arabic (ar)
- Russian (ru)
- Gujarati (gu)
- Marathi (mr)
- Kannada (kn)

## Configuration

### Speech Recognition
You can modify the Whisper model size in `utils/speech_service.py` to balance accuracy and performance:
```python
# Options: "tiny", "base", "small", "medium", "large", "large-v2"
whisper_model = whisper.load_model("small", device=device)
```

### Object Detection
You can adjust detection parameters in `utils/detection_service.py`:
```python
# Confidence threshold for detection
results = self.model(frame_resized, conf=0.4)

# Frame similarity threshold (to skip similar frames)
self.similarity_threshold = 0.95

# Rate limiting (frames per second)
self.rate_limiter = RateLimiter(2.0)
```

## Troubleshooting

- **Audio not recognized correctly**: Try using a different Whisper model size or ensure the audio is clear
- **Language detection issues**: Add more patterns to the `correct_common_phrases` method for your specific use case
- **Performance issues**: Use a smaller Whisper model or ensure you have a CUDA-compatible GPU
- **Object detection slow**: Lower the detection confidence threshold or increase the similarity threshold
- **MongoDB connection errors**: Check your connection string and ensure MongoDB is running

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenAI Whisper](https://github.com/openai/whisper) for speech recognition
- [Google Translate](https://cloud.google.com/translate) for translation services
- [SpeechRecognition](https://github.com/Uberi/speech_recognition) for fallback recognition
- [Ultralytics YOLOv12](https://github.com/ultralytics/ultralytics) for object detection