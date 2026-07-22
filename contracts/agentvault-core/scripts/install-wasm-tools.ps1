# Downloads binaryen + wabt for Windows WASM builds (not committed to git).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Tools = Join-Path $Root "tools"
New-Item -ItemType Directory -Force -Path $Tools | Out-Null

$BinaryenVersion = "version_130"
$WabtVersion = "1.0.37"

function Expand-ArchiveIfNeeded($ZipPath, $DestDir) {
    if (Test-Path $DestDir) { return }
    Expand-Archive -Path $ZipPath -DestinationPath $Tools -Force
}

$BinaryenZip = Join-Path $Tools "binaryen-$BinaryenVersion-x86_64-windows.tar.gz"
$BinaryenDir = Join-Path $Tools "binaryen-$BinaryenVersion"
if (-not (Test-Path (Join-Path $BinaryenDir "bin\wasm-opt.exe"))) {
    if (-not (Test-Path $BinaryenZip)) {
        $BinaryenUrl = "https://github.com/WebAssembly/binaryen/releases/download/$BinaryenVersion/binaryen-$BinaryenVersion-x86_64-windows.tar.gz"
        Write-Host "Downloading binaryen..."
        Invoke-WebRequest -Uri $BinaryenUrl -OutFile $BinaryenZip
    }
    tar -xzf $BinaryenZip -C $Tools
}

$WabtZip = Join-Path $Tools "wabt-$WabtVersion-windows.tar.gz"
$WabtDir = Join-Path $Tools "wabt-$WabtVersion"
if (-not (Test-Path (Join-Path $WabtDir "bin\wasm-strip.exe"))) {
    if (-not (Test-Path $WabtZip)) {
        # wabt 1.0.37 ships windows binaries as .tar.gz (no .zip asset).
        $WabtUrl = "https://github.com/WebAssembly/wabt/releases/download/$WabtVersion/wabt-$WabtVersion-windows.tar.gz"
        Write-Host "Downloading wabt..."
        Invoke-WebRequest -Uri $WabtUrl -OutFile $WabtZip
    }
    tar -xzf $WabtZip -C $Tools
}

Write-Host "WASM tools ready under $Tools"
Write-Host "Run: .\scripts\build-windows.ps1"