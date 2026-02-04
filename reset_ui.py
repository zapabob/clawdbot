
import subprocess
import os

def get_conflicted_files():
    # Use git diff to find files that WERE conflicted in the merge commit
    # Since we are ON the merge commit, HEAD^1 and HEAD^2 are the parents.
    result = subprocess.run(['git', 'diff', '--name-only', 'HEAD^1', 'HEAD^2'], capture_output=True, text=True)
    return result.stdout.splitlines()

def reset_to_upstream(files):
    count = 0
    for f in files:
        if f.startswith('ui/'):
            print(f"Resetting UI file to upstream: {f}")
            subprocess.run(['git', 'checkout', 'HEAD^2', '--', f])
            count += 1
    return count

if __name__ == "__main__":
    files = get_conflicted_files()
    count = reset_to_upstream(files)
    print(f"Reset {count} UI files to upstream version.")
