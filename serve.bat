@echo off
rem The Sherlock Games - one click server for The Notch's Mystery.
rem (Chrome/Edge block folder reading from double-clicked pages; Firefox
rem  does not - either fix works.)
cd /d "%~dp0"
start "Sherlock server" /min node tools\serve.js
>nul timeout /t 1
start "" "http://localhost:8437/case-cleared.html"
