import sys
try:
    with open('check_out_final_2.txt', 'rb') as f:
        content = f.read().decode('utf-16le', errors='ignore')
    with open('check_out_final_2_utf8.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully converted check_out_final_2.txt to check_out_final_2_utf8.txt")
except Exception as e:
    print(f"Error: {e}")
