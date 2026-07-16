@echo off
setlocal
cd /d "%~dp0"
title Creation Gestion Jauges Portable

echo ============================================
echo   GESTION JAUGES - VERSION PORTABLE
echo ============================================
echo.

echo [1/4] Verification des dependances...
call npm install
if errorlevel 1 goto :error

echo.
echo [2/4] Compilation React...
call npm run build
if errorlevel 1 goto :error

echo.
echo [3/4] Compilation Tauri sans installateur...
call npm run tauri build -- --no-bundle
if errorlevel 1 goto :error

echo.
echo [4/4] Creation du dossier Portable...
if not exist "Portable" mkdir "Portable"

set EXE=src-tauri\target\release\gestionjauges.exe
if not exist "%EXE%" set EXE=src-tauri\target\release\GestionJauges.exe

if not exist "%EXE%" (
  echo ERREUR : executable introuvable dans src-tauri\target\release
  goto :error
)

copy /Y "%EXE%" "Portable\GestionJauges.exe" >nul
copy /Y "public\gestion-jauges-logo.png" "Portable\gestion-jauges-logo.png" >nul

> "Portable\LIRE_MOI.txt" echo GESTION JAUGES - VERSION PORTABLE
>>"Portable\LIRE_MOI.txt" echo.
>>"Portable\LIRE_MOI.txt" echo Lancez GestionJauges.exe par double-clic.
>>"Portable\LIRE_MOI.txt" echo Aucune installation n'est necessaire.
>>"Portable\LIRE_MOI.txt" echo Une connexion Internet est necessaire pour Supabase.

echo.
echo ============================================
echo   TERMINE
 echo ============================================
echo Fichier : %CD%\Portable\GestionJauges.exe
start "" "%CD%\Portable"
pause
exit /b 0

:error
echo.
echo La creation a echoue. Lisez le message d'erreur ci-dessus.
echo Prerequis Windows : Rust, Microsoft C++ Build Tools et WebView2.
pause
exit /b 1
