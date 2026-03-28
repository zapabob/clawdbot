import sys
with open('check_out.txt', 'r', encoding='utf-16le', errors='ignore') as f:
    text = f.read()
with open('check_out_utf8.txt', 'w', encoding='utf-8') as f:
    f.write(text)
