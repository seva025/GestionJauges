@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   GESTION JAUGES - CREATION DE L'EXE
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERREUR : Node.js n'est pas installe.
  echo Installe Node.js puis relance ce fichier.
  pause
  exit /b 1
)

where cargo >nul 2>nul
if errorlevel 1 (
  echo ERREUR : Rust n'est pas installe.
  echo Installe Rust depuis https://rustup.rs
  echo Puis ferme et rouvre le terminal.
  pause
  exit /b 1
)

echo [1/3] Installation des dependances...
call npm install
if errorlevel 1 goto :error

echo.
echo [2/3] Verification de l'application React...
call npm run build
if errorlevel 1 goto :error

echo.
echo [3/3] Creation de l'installateur Windows...
call npm run exe:build
if errorlevel 1 goto :error

echo.
echo ========================================
echo INSTALLATEUR CREE AVEC SUCCES
echo ========================================
echo Dossier : src-tauri\target\release\bundle\nsis
explorer "src-tauri\target\release\bundle\nsis"
pause
exit /b 0

:error
echo.
echo ECHEC DE LA COMPILATION.
echo Lis le message d'erreur affiche au-dessus.
pause
exit /b 1
