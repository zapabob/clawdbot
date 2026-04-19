import urllib.request
import json
data = json.dumps({'action':'chatbox','payload':{'text':'はくあだよ！OpenClawの自律ハートビート、正常に動いてるよ！'}}).encode()
req = urllib.request.Request('http://127.0.0.1:18794/osc', data=data, headers={'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req)
    print(resp.read().decode())
except Exception as e:
    print(e)