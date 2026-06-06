@echo off
setlocal

set "LIVE_EXT_HOST=C:\ProgramData\Ableton\Live 12 Beta\Program\ExtensionHost"
set "EXTENSION_DIR=%LOCALAPPDATA%\Ableton\Extensions\nagisa-dozono.chord-extension"

if not exist "%LIVE_EXT_HOST%\node.exe" (
  echo Ableton Extension Host node.exe was not found:
  echo %LIVE_EXT_HOST%\node.exe
  pause
  exit /b 1
)

if not exist "%LIVE_EXT_HOST%\ExtensionHostNodeModule.node" (
  echo Ableton ExtensionHostNodeModule.node was not found:
  echo %LIVE_EXT_HOST%\ExtensionHostNodeModule.node
  pause
  exit /b 1
)

if not exist "%EXTENSION_DIR%\manifest.json" (
  echo chord-extension is not installed:
  echo %EXTENSION_DIR%
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$hostModule = '%LIVE_EXT_HOST%\ExtensionHostNodeModule.node'.Replace('\','/');" ^
  "$extensionDir = '%EXTENSION_DIR%'.Replace('\','/');" ^
  "$code = \"require('$hostModule').initialize({extensions:[{path:'$extensionDir'}]});\";" ^
  "& '%LIVE_EXT_HOST%\node.exe' -e $code"

pause
