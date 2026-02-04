
import subprocess
import os
import re

def find_broken_files():
    # Find files containing ======= or >>>>>>>
    result = subprocess.run(['rg', '-l', '=======|>>>>>>>', 'src/'], capture_output=True, text=True)
    return result.stdout.splitlines()

def reset_to_upstream(files):
    count = 0
    for f in files:
        print(f"Resetting broken file to upstream: {f}")
        subprocess.run(['git', 'checkout', 'HEAD^2', '--', f])
        count += 1
    return count

if __name__ == "__main__":
    files = find_broken_files()
    count = reset_to_upstream(files)
    print(f"Reset {count} files in src/ to upstream version.")
