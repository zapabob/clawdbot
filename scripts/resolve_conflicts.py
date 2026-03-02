import subprocess
import sys
import os

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip().split('\n') if result.stdout else []

def main():
    print("Starting conflict resolution script (MILSPEC compliant)...")
    
    # 1. Get conflicted files
    conflicted_files = run_cmd("git diff --name-only --diff-filter=U")
    if not conflicted_files or not conflicted_files[0]:
        print("No conflicts found.")
        return
        
    print(f"Found {len(conflicted_files)} conflicted files.")
    
    # Files/directories where we ALWAYS favor our local modifications (Hakua ASI unique features)
    ours_patterns = [
        "src/line/",
        "src/telegram/",
        "scripts/",
        "assets/NFD/Hakua/",
        "brain/",
        "SOUL.md",
        "_docs/",
        "src/agents/tools/web-search.ts",
        "src/agents/system-prompt.ts"
    ]
    
    resolved_count = 0
    for file in conflicted_files:
        if not file: continue
        
        # Determine strategy
        strategy = "theirs"
        for pattern in ours_patterns:
            if file.startswith(pattern) or file == pattern:
                strategy = "ours"
                break
                
        print(f"Resolving {file} using strategy: {strategy}")
        
        if strategy == "ours":
            subprocess.run(f"git checkout --ours \"{file}\"", shell=True)
        else:
            subprocess.run(f"git checkout --theirs \"{file}\"", shell=True)
            
        subprocess.run(f"git add \"{file}\"", shell=True)
        resolved_count += 1
        
    print(f"Successfully resolved {resolved_count} conflicts.")

if __name__ == "__main__":
    main()
