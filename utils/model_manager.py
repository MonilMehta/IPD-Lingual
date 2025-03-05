import os
import torch
import requests
from pathlib import Path
from tqdm import tqdm
from ultralytics import YOLO

# Set up paths - prioritize the root directory where yolov12l.pt already exists
ROOT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))
MODEL_DIRECTORY = os.path.join(ROOT_DIRECTORY, "models")
DEFAULT_MODEL = "yolov12l.pt"  # Use your existing YOLOv12l.pt

# Make sure the model directory exists
os.makedirs(MODEL_DIRECTORY, exist_ok=True)

def get_model_path(model_name):
    """Find the model path checking both root and model directories"""
    # First check if model exists in the root directory (where the user has it)
    root_model_path = os.path.join(ROOT_DIRECTORY, model_name)
    if os.path.exists(root_model_path):
        return root_model_path
        
    # Then check models directory
    models_dir_path = os.path.join(MODEL_DIRECTORY, model_name)
    if os.path.exists(models_dir_path):
        return models_dir_path
        
    return None

def download_model(model_name):
    """Download YOLOv8 model if it doesn't exist"""
    # Check if model already exists in any location
    existing_path = get_model_path(model_name)
    if existing_path:
        print(f"Model {model_name} already exists at {existing_path}")
        return existing_path
        
    # If not found, download to the models directory
    model_path = os.path.join(MODEL_DIRECTORY, model_name)
    print(f"Downloading {model_name}...")
    
    # YOLOv8 models can be downloaded from Ultralytics
    if model_name.startswith("yolov8"):
        url = f"https://github.com/ultralytics/assets/releases/download/v0.0.0/{model_name}"
    # YOLOv5 models
    elif model_name.startswith("yolov5"):
        url = f"https://github.com/ultralytics/assets/releases/download/v0.0.0/{model_name}"
    else:
        print(f"Model {model_name} not recognized. Using default model {DEFAULT_MODEL}")
        return get_model_path(DEFAULT_MODEL) or download_model(DEFAULT_MODEL)
    
    try:
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024
        progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True)
        
        with open(model_path, 'wb') as file:
            for data in response.iter_content(block_size):
                progress_bar.update(len(data))
                file.write(data)
        
        progress_bar.close()
        print(f"Model downloaded successfully to {model_path}")
        return model_path
    
    except Exception as e:
        print(f"Error downloading model: {e}")
        existing_default = get_model_path(DEFAULT_MODEL)
        if existing_default:
            return existing_default
        elif model_name != DEFAULT_MODEL:
            print(f"Falling back to default model {DEFAULT_MODEL}")
            return download_model(DEFAULT_MODEL)
        else:
            raise

def load_model(model_name=DEFAULT_MODEL):
    """Load YOLO model, using existing files first"""
    # First try to find the model in existing locations
    model_path = get_model_path(model_name)
    
    # If not found, try to download it
    if not model_path:
        model_path = download_model(model_name)
    
    try:
        # Force CPU usage to avoid CUDA compatibility issues
        model = YOLO(model_path)
        model.to('cpu')  # Explicitly move model to CPU
        print(f"Successfully loaded model: {model_name} from {model_path} on CPU")
        return model
    except Exception as e:
        print(f"Error loading model {model_name}: {e}")
        if model_name != DEFAULT_MODEL:
            default_path = get_model_path(DEFAULT_MODEL)
            if default_path:
                print(f"Falling back to default model {DEFAULT_MODEL}")
                return YOLO(default_path)
            else:
                print(f"Trying to download default model {DEFAULT_MODEL}")
                return load_model(DEFAULT_MODEL)
        else:
            raise

if __name__ == "__main__":
    # Test function - can be run standalone to verify model loading
    model = load_model("yolov12l.pt")
    print(f"Model loaded with {len(model.names)} classes")
