@echo off
cd /d "%~dp0"
start "" /b "%~dp0node_modules\.bin\electron.cmd" .
