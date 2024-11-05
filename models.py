import cv2
import torch
from translate import Translator
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import requests

# Load the YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'yolov5s')  # Load the small YOLOv5 model

# Function to translate text using the translate library
def translate_text(text, target_language):
    translator = Translator(to_lang=target_language)
    translation = translator.translate(text)
    return translation

api_endpoint = 'http://localhost:5000/store_detection'

# Initialize video capture
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Perform object detection
    results = model(frame)
    
    detections=[]

    # Extract the bounding boxes and labels
    for result in results.xyxy[0]:  # results.xyxy[0] gives you the detections
        x1, y1, x2, y2, conf, cls = result  # Extract coordinates and class ID
        label = model.names[int(cls)]  # Get the label from the model

        # Debug: Print the detected label
        print(f"Detected label: {label}")  # Print the detected label

        # Translate the label to Hindi
        translated_label = translate_text(label, 'hi')  # Change 'hi' to Hindi

        # Debug: Print the translated label
        print(f"Translated label: {translated_label}")  # Print the translated label

        # Draw the bounding box on the frame
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)

        # Convert the frame to PIL for drawing text
        pil_img = Image.fromarray(frame)
        draw = ImageDraw.Draw(pil_img)

        # Use a suitable font; adjust the font size as needed
        font = ImageFont.truetype("arial.ttf", 20)  # Ensure the font supports Hindi characters

        # Draw the translated label
        draw.text((int(x1), int(y1) - 10), translated_label, font=font, fill=(0, 255, 0))

        # Convert back to OpenCV format
        frame = np.array(pil_img)
        
        detection_data = {
            'label': label,
            'translated_label': translated_label,
            'coordinates': {
                'x1': int(x1),
                'y1': int(y1),
                'x2': int(x2),
                'y2': int(y2)
            },
            'confidence': float(conf)
        }
        
        detections.append(detection_data)
        
    if detections:
        response=requests.post(api_endpoint,json={'detections':detections})
        # print(f"Response from server:{response.json()}")

    # Display the frame with detection
    cv2.imshow('Object Detection with Translation', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()