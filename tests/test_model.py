"""
Simple script to test if the YOLOv12l model can be loaded correctly
"""
import os
from ultralytics import YOLO

def test_direct_loading():
    """Test loading the model directly without the model_manager"""
    print("Current working directory:", os.getcwd())
    model_path = "yolov12l.pt"
    
    print(f"Checking if model exists at path: {os.path.abspath(model_path)}")
    if os.path.exists(model_path):
        print(f"Model file exists. Size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
    else:
        print("Model file not found at this path.")
        
    try:
        print("Attempting to load model directly...")
        model = YOLO(model_path)
        print("Model loaded successfully!")
        print(f"Model has {len(model.names)} classes")
        return True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return False

def test_model_manager():
    """Test loading with our model_manager module"""
    from model_manager import load_model
    
    try:
        print("Attempting to load model with model_manager...")
        model = load_model("yolov12l.pt")
        print("Model loaded successfully!")
        print(f"Model has {len(model.names)} classes")
        return True
    except Exception as e:
        print(f"Failed to load model with model_manager: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Direct Model Loading ===")
    direct_result = test_direct_loading()
    
    print("\n=== Testing Model Manager Loading ===")
    manager_result = test_model_manager()
    
    if direct_result and manager_result:
        print("\n✅ All tests passed! Your model can be loaded correctly.")
    else:
        print("\n❌ Some tests failed. Please check the error messages above.")
