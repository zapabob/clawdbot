
import os
import re

def clean_file(file_path):
    print(f"Cleaning: {file_path}")
    if not os.path.exists(file_path):
        return
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    new_lines = []
    # Remove ANY line starting with markers
    for line in lines:
        if line.startswith(("<<<<<<<", "=======", ">>>>>>>")):
            continue
        new_lines.append(line)
        
    # Deduplicate imports with priority for .ts extensions
    if file_path.endswith(('.ts', '.js', '.tsx')):
        imports = []
        others = []
        for line in new_lines:
            if line.strip().startswith("import "):
                imports.append(line)
            else:
                others.append(line)
        
        # Smart deduplicate imports
        unique_imports = []
        seen_import_key = {} # key: import content/target
        
        for imp in imports:
            # Try to normalize import target: "./app" -> "./app.ts"
            # match pattern: import { ... } from "target"
            match = re.search(r'from\s+["\'](.*?)["\']', imp)
            if match:
                target = match.group(1)
                inner = imp[:match.start()] # import { ... } 
                # Normalize target
                norm_target = target
                if not target.endswith('.ts') and not target.endswith('.js') and not target.endswith('.css'):
                    norm_target = target + ".ts"
                
                key = (inner, norm_target)
                if key not in seen_import_key:
                    # If we haven't seen this import with .ts, add it
                    # If the current imp has .ts, it wins.
                    seen_import_key[key] = imp
                else:
                    # If existing doesn't have .ts but current does, prefer current
                    if ".ts" in imp and ".ts" not in seen_import_key[key]:
                        seen_import_key[key] = imp
            else:
                unique_imports.append(imp)
        
        final_imports = list(seen_import_key.values())
        new_lines = final_imports + others

    with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    files = [
        "ui/src/ui/app-render.ts",
        "ui/src/ui/app-settings.ts",
        "ui/src/ui/app.ts",
        "ui/src/ui/app-polling.ts",
        "ui/src/ui/navigation.ts",
        "ui/src/ui/storage.ts",
        "ui/src/ui/theme.ts",
        "ui/src/ui/theme-transition.ts",
        "ui/src/ui/types.ts"
    ]
    for f in files:
        clean_file(f)
