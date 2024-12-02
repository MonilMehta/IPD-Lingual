import cv2
import torch
from googletrans import Translator
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from ultralytics import YOLO

model = YOLO("yolov8s.pt")

def translate_text(text, target_language):
    translator = Translator()
    translation = translator.translate(text, dest=target_language)
    return translation.text

cap = cv2.VideoCapture(0)

font_path = "NotoSansDevanagari-VariableFont_wdth,wght.ttf"
font_size = 20

translation_cache = {}  
vertical_offset = 30 

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_resized = cv2.resize(frame, (640, 480))

    results = model(frame_resized, conf=0.4)

    pil_img = Image.fromarray(frame)
    draw = ImageDraw.Draw(pil_img)

    try:
        font = ImageFont.truetype(font_path, font_size)
    except IOError:
        print(f"Font {font_path} not found. Using default font.")
        font = ImageFont.load_default()

    used_positions = []

    for result in results:
        boxes = result.boxes
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])  
            cls = int(box.cls[0])  
            label = model.names[cls] 

            if label not in translation_cache:
                translated_label = translate_text(label, 'hi')
                translation_cache[label] = translated_label
            else:
                translated_label = translation_cache[label]

            adjusted_y = y1
            for used_x, used_y in used_positions:
                if abs(used_x - x1) < 50 and abs(used_y - adjusted_y) < 30:
                    adjusted_y += vertical_offset

            draw.text((x1, adjusted_y - 10), translated_label, font=font, fill=(0, 255, 0))  # Green text

            used_positions.append((x1, adjusted_y))

    frame = np.array(pil_img)

    cv2.imshow('Object Detection with Translation', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()