Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\opc-os"
WshShell.Run "cmd /k C:\opc-os\launch.bat", 1, False
