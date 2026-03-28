import subprocess
result = subprocess.run(['pnpm.cmd', 'run', 'config:schema:gen'], capture_output=True, text=True, encoding='utf-8')
with open('debug_err.txt', 'w', encoding='utf-8') as f:
    f.write("OUT:\n" + result.stdout + "\nERR:\n" + result.stderr)
