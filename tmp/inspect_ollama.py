import ollama
import json

try:
    resp = ollama.list()
    print(f"Response Type: {type(resp)}")
    
    # Check if it's the new ModelResponse object
    if hasattr(resp, 'models'):
        print("Found 'models' attribute (New API)")
        model_names = [m.model for m in resp.models]
        print(f"Models: {model_names}")
    elif isinstance(resp, dict) and 'models' in resp:
        print("Found 'models' key in dict (Old API)")
        model_names = [m['name'] for m in resp['models']]
        print(f"Models: {model_names}")
    else:
        print(f"Unknown structure: {resp}")

except Exception as e:
    print(f"Error: {e}")
