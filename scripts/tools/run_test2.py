import subprocess
out = subprocess.run(['npx.cmd', 'tsx', 'test2.mjs'], capture_output=True, text=True, encoding='utf-8')
with open('test2_out.txt', 'w', encoding='utf-8') as f:
    f.write(out.stdout + out.stderr)
