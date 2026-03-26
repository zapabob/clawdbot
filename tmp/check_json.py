import json
import sys

f_path = '.openclaw-desktop/openclaw.json'
try:
    with open(f_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    def sanitize(obj):
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [sanitize(v) for v in obj]
        elif isinstance(obj, str):
            # Replace physical newlines with escaped \n literals
            return obj.replace('\n', '\\n').replace('\r', '\\r')
        return obj

    sanitized_data = sanitize(data)
    
    with open(f_path, 'w', encoding='utf-8') as f:
        json.dump(sanitized_data, f, indent=2, ensure_ascii=False)
    
    print("Sanitization and Normalization COMPLETE")
        
except Exception as ex:
    print(f"Error: {ex}")
    sys.exit(1)
