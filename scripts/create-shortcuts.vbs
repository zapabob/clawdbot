Set WshShell = CreateObject("WScript.Shell")
desktopPath = WshShell.SpecialFolders("Desktop")

Set sc = WshShell.CreateShortcut(desktopPath & "\OpenClaw.lnk")
sc.TargetPath = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\openclaw-launch-new-window.bat"
sc.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
sc.Description = "OpenClaw AI Assistant"
sc.Save
WScript.Echo "Desktop shortcut created: " & desktopPath & "\OpenClaw.lnk"

startupPath = WshShell.ExpandEnvironmentStrings("%APPDATA%") & "\Microsoft\Windows\Start Menu\Programs\Startup"
Set sc2 = WshShell.CreateShortcut(startupPath & "\OpenClaw.lnk")
sc2.TargetPath = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\openclaw-launch-new-window.bat"
sc2.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
sc2.Description = "OpenClaw AI Assistant (Auto-Start)"
sc2.Save
WScript.Echo "Startup shortcut created: " & startupPath & "\OpenClaw.lnk"
