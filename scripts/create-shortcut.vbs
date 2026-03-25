Set WshShell = CreateObject("WScript.Shell")
Set shortcut = WshShell.CreateShortcut("C:\Users\downl\Desktop\ASI-Internet.lnk")
shortcut.TargetPath = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\start-asi-internet.bat"
shortcut.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
shortcut.IconLocation = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\assets\clawdbot.ico"
shortcut.Description = "ASI Gateway Internet Mode with Hypura"
shortcut.Save
WScript.Echo "Shortcut created"
