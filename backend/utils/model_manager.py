import os
# import torch  # Commented out for API-only mode
# from ultralytics import YOLO  # Commented out for API-only mode
import requests
from pathlib import Path
from tqdm import tqdm
import gc

# Dictionary to cache loaded models
_models_cache = {}

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
    """
    Load a model by name, caching it for future use
    
    Note: This function is now in API mode - it doesn't load models locally
    but instead returns a placeholder since we're using HF Spaces API
    """
    # Return early with API message
    print(f"API mode: Using remote API for {model_name} instead of loading locally")
    return {"name": model_name, "type": "api_mode"}
    
    # The code below is commented out since we're using API only mode
    """
    if model_name in _models_cache:
        print(f"Using cached model: {model_name}")
        return _models_cache[model_name]
    
    print(f"Loading model: {model_name}")
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    model_path = os.path.join(models_dir, model_name)
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    try:
        # For YOLO models
        if model_name.lower().startswith("yolo"):
            model = YOLO(model_path)
        else:
            raise ValueError(f"Unsupported model type: {model_name}")
        
        # Cache the model
        _models_cache[model_name] = model
        return model
    except Exception as e:
        print(f"Error loading model {model_name}: {e}")
        raise
    """
        
def unload_model(model_name):
    """
    Unload a model from memory and cache
    
    Note: In API mode, this is just a placeholder
    """
    if model_name in _models_cache:
        print(f"Unloading model: {model_name}")
        del _models_cache[model_name]
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        return True
    return False

def get_loaded_models():
    """Return list of loaded model names"""
    return list(_models_cache.keys())

if __name__ == "__main__":
    # Test function - can be run standalone to verify model loading
    model = load_model("yolov12l.pt")
    print(f"Model loaded with {len(model.names)} classes")
