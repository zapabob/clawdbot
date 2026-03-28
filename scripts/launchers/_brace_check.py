path = r"C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launchers\Sovereign-Portal.ps1"
lines = open(path, encoding="utf-8").read().splitlines()
depth = 0
for i, line in enumerate(lines[:200], 1):
    o = line.count("{")
    c = line.count("}")
    depth += o - c
    if depth < 0:
        print("negative at", i, line)
        break
    if i <= 165 and (o or c):
        print(f"{i:3} d={depth:2} {line[:72]}")
print("depth after line 200:", depth)
