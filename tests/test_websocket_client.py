"""
Test WebSocket client for debugging connection issues
"""
import asyncio
import json
import cv2
import base64
import websockets
import os

async def send_test_frame(ws_url="ws://localhost:8765", username="monil"):
    """Send a test frame to the WebSocket server"""
    try:
        async with websockets.connect(ws_url) as websocket:
            print(f"Connected to {ws_url}")

            # Step 1: Start detection
            await websocket.send(json.dumps({
                'type': 'start',
                'username': username
            }))
            
            response = await websocket.recv()
            print(f"Start response: {response}")
            
            # Step 2: Load a test image
            test_image_path = os.path.join(os.path.dirname(__file__), "test_image.jpg")
            
            if not os.path.exists(test_image_path):
                print(f"Test image not found at {test_image_path}")
                # Create a simple test image
                img = cv2.imread("D:/IPD2/IPD-Lingual/yolov12l.pt")
                if img is None:
                    img = cv2.imread("D:/IPD2/IPD-Lingual/model_manager.py")
                if img is None:
                    img = np.ones((480, 640, 3), dtype=np.uint8) * 255
                    cv2.putText(img, "Test Image", (100, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 2)
                cv2.imwrite(test_image_path, img)
                print(f"Created test image at {test_image_path}")
            
            # Read the image and convert to base64
            img = cv2.imread(test_image_path)
            if img is None:
                print(f"Error: Could not load image from {test_image_path}")
                return
                
            _, buffer = cv2.imencode('.jpg', img)
            base64_image = base64.b64encode(buffer).decode('utf-8')
            
            # Send the frame with proper format
            print(f"Sending image with size: {len(base64_image)} bytes")
            await websocket.send(json.dumps({
                'type': 'frame',
                'data': base64_image  # Send just the raw base64 without prefix
            }))
            
            # Wait for response
            response = await websocket.recv()
            print(f"Detection response received, length: {len(response)} characters")
            detection_data = json.loads(response)
            
            if 'results' in detection_data:
                print(f"Detected {len(detection_data['results'])} objects:")
                for item in detection_data['results']:
                    print(f"- {item['label']} ({item['translated']}): {item['confidence']:.2f}")
            
            # Step 3: Stop detection
            await websocket.send(json.dumps({
                'type': 'stop'
            }))
            
            response = await websocket.recv()
            print(f"Stop response: {response}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing WebSocket connection with a test frame...")
    asyncio.run(send_test_frame())
