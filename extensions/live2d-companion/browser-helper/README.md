# Desktop Companion Browser Helper

This helper is intentionally narrow:

- It uses `activeTab`, not `<all_urls>`.
- It only attaches the tab the user explicitly selects.
- It forwards URL, title, and a visible text snapshot through Native Messaging.
- It never captures microphone audio.

Files in this directory:

- `manifest.json`: MV3 extension manifest
- `background.js`: attach or detach flow plus persistent follow for the attached tab
- `popup.html` and `popup.js`: explicit helper indicator and attach or detach controls
- `native-host/native-host.mjs`: stdio Native Messaging bridge into the Desktop Companion runtime
- `native-host/io.openclaw.desktop_companion.template.json`: host manifest template for Windows registration
