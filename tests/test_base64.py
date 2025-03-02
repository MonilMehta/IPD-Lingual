"""
Test script to debug base64 encoding/decoding
"""
import base64
import cv2
import numpy as np
import os
from PIL import Image
import json

def test_base64_encoding():
    """Test different base64 encoding methods"""
    # Create a test image
    img = np.ones((100, 100, 3), dtype=np.uint8) * 255
    cv2.putText(img, "Test", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    # Method 1: OpenCV
    _, buffer = cv2.imencode('.jpg', img)
    cv2_base64 = base64.b64encode(buffer).decode('utf-8')
    print(f"OpenCV base64 (first 50 chars): {cv2_base64[:50]}...")
    
    # Method 2: With data URL prefix
    data_url = f"data:image/jpeg;base64,{cv2_base64}"
    print(f"Data URL (first 50 chars): {data_url[:50]}...")
    
    # Test decoding with different methods
    test_decode(cv2_base64, "OpenCV base64")
    test_decode(data_url, "Data URL")

def test_decode(base64_data, method_name):
    """Test decoding a base64 string"""
    print(f"\nTesting decoding {method_name}")
    
    try:
        # Method 1: Direct decode
        print("Direct decode attempt...")
        try:
            img_data = base64.b64decode(base64_data)
            print("✅ Direct decode successful")
        except Exception as e:
            print(f"❌ Direct decode failed: {e}")
        
        # Method 2: Split by comma first
        print("\nSplit by comma attempt...")
        try:
            if ',' in base64_data:
                parts = base64_data.split(',')
                if len(parts) > 1:
                    img_data = base64.b64decode(parts[1])
                    print("✅ Split and decode successful")
                else:
                    print("❌ Split resulted in no second part")
            else:
                print("❓ No comma found in string")
        except Exception as e:
            print(f"❌ Split decode failed: {e}")
        
        # Method 3: Very defensive approach
        print("\nDefensive approach attempt...")
        try:
            if ',' in base64_data:
                parts = base64_data.split(',')
                if len(parts) > 1:
                    img_data = base64.b64decode(parts[1])
                else:
                    img_data = base64.b64decode(parts[0])
            else:
                img_data = base64.b64decode(base64_data)
            
            # Try to convert to image to verify
            np_arr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if frame is not None:
                print(f"✅ Defensive decode worked! Image shape: {frame.shape}")
            else:
                print("❌ Defensive decode failed: Could not convert to image")
        except Exception as e:
            print(f"❌ Defensive decode failed: {e}")
    
    except Exception as e:
        print(f"❌ Overall test failed: {e}")

if __name__ == "__main__":
    print("Testing base64 encoding and decoding...")
    test_base64_encoding()
