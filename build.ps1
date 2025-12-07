# Script PowerShell pour construire SWGuilds.asar
# Utilise node depuis node_modules ou le PATH

$ErrorActionPreference = "Stop"

Write-Host "Building SWGuilds plugin..." -ForegroundColor Cyan

# Chercher node.exe
$nodeExe = $null
$nodePaths = @(
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles(x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe"
)

foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeExe = $path
        break
    }
}

if (-not $nodeExe) {
    try {
        $nodeExe = (Get-Command node -ErrorAction Stop).Source
    } catch {
        Write-Host "Error: Node.js not found. Please install Node.js." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Using Node.js: $nodeExe" -ForegroundColor Green

# Supprimer l'ancien fichier s'il existe
if (Test-Path "SWGuilds.asar") {
    Write-Host "Removing old SWGuilds.asar..." -ForegroundColor Yellow
    Remove-Item "SWGuilds.asar" -Force -ErrorAction SilentlyContinue
}

# Construire le plugin
Write-Host "Creating SWGuilds.asar..." -ForegroundColor Cyan
& $nodeExe build-plugin.js

if (Test-Path "SWGuilds.asar") {
    $fileInfo = Get-Item "SWGuilds.asar"
    $fileSizeKB = [math]::Round($fileInfo.Length / 1024, 2)
    Write-Host ""
    Write-Host "SUCCESS: Plugin created: SWGuilds.asar" -ForegroundColor Green
    Write-Host "  Size: $fileSizeKB KB" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install:" -ForegroundColor Cyan
    Write-Host "  1. Copy SWGuilds.asar to SWExporter's plugins folder" -ForegroundColor White
    Write-Host "  2. Restart SWExporter" -ForegroundColor White
} else {
    Write-Host "ERROR: SWGuilds.asar was not created" -ForegroundColor Red
    exit 1
}

