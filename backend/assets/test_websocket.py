import asyncio
import websockets
import json
import os
import wave
import base64

async def test_audio_processing():
    """Test the audio processing functionality with conference.wav"""
    uri = "ws://localhost:8766"
    try:
        async with websockets.connect(
            uri,
            origin="http://localhost:5000",
            user_agent_header="Mozilla/5.0"
        ) as websocket:
            print("\nTesting audio processing service...")
            
            # Wait for initialization message
            init_response = await websocket.recv()
            init_data = json.loads(init_response)
            print(f"Initialization response: {json.dumps(init_data, indent=2)}")
            
            # Process conference.wav file
            audio_file = 'conference.wav'
            if not os.path.exists(audio_file):
                print(f"Error: {audio_file} not found")
                return
                
            print(f"\nProcessing {audio_file}...")
            
            try:
                # Read and process WAV file
                with wave.open(audio_file, 'rb') as wav_file:
                    # Get WAV file parameters
                    channels = wav_file.getnchannels()
                    sample_width = wav_file.getsampwidth()
                    framerate = wav_file.getframerate()
                    n_frames = wav_file.getnframes()
                    
                    # Read the actual audio data
                    audio_data = wav_file.readframes(n_frames)
                
                # Convert to base64
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                
                # Send the audio data with format information
                message = {
                    "audio": audio_base64,
                    "format": {
                        "channels": channels,
                        "sample_width": sample_width,
                        "framerate": framerate,
                        "n_frames": n_frames
                    }
                }
                print("Sending audio data...")
                print(f"Audio format: {channels} channels, {framerate}Hz, {sample_width} bytes per sample")
                await websocket.send(json.dumps(message))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                result = json.loads(response)
                
                print("\nProcessing Results:")
                if result.get("type") == "error":
                    print(f"Error: {result.get('message')}")
                else:
                    print(f"Original Language: {result['original']['language']}")
                    print(f"Original Text: {result['original']['text']}")
                    print(f"Translated Language: {result['translated']['language']}")
                    print(f"Translated Text: {result['translated']['text']}")
                
            except asyncio.TimeoutError:
                print("Timeout waiting for response")
            except Exception as e:
                print(f"Error processing audio: {str(e)}")
                raise  # Re-raise to see full traceback
            
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed - Make sure the speech WebSocket server is running")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise  # Re-raise to see full traceback 