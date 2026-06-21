# Windows-compatible Odra WASM build (cargo-odra uses Unix `cp` and expects wasm-opt/wasm-strip on PATH).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$Tools = Join-Path $Root "tools"
$BinaryenBin = Join-Path $Tools "binaryen-version_130\bin"
$WabtBin = Join-Path $Tools "wabt-1.0.37\bin"
$env:PATH = "$BinaryenBin;$WabtBin;$env:PATH"

foreach ($tool in @("wasm-opt.exe", "wasm-strip.exe")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Missing $tool. Run scripts/install-wasm-tools.ps1 first."
    }
}

$WasmDir = Join-Path $Root "wasm"
New-Item -ItemType Directory -Force -Path $WasmDir | Out-Null

$contracts = @(
    @{ Name = "Escrow"; Module = "escrow" },
    @{ Name = "Attestation"; Module = "attestation" }
)

$sourceWasm = Join-Path $Root "target\wasm32-unknown-unknown\release\agentvault_core_build_contract.wasm"

foreach ($contract in $contracts) {
    Write-Host "Building $($contract.Name)..."
    $env:ODRA_MODULE = $contract.Name
    Push-Location $Root
    try {
        cargo build --target wasm32-unknown-unknown --bin agentvault_core_build_contract --release
        if ($LASTEXITCODE -ne 0) { throw "cargo build failed for $($contract.Name)" }
    } finally {
        Pop-Location
    }

    $targetWasm = Join-Path $WasmDir "$($contract.Name).wasm"
    Copy-Item -Force $sourceWasm $targetWasm
    Write-Host "Saved $targetWasm"

    $optArgs = @(
        "--signext-lowering",
        "--enable-bulk-memory",
        "--llvm-memory-copy-fill-lowering",
        $targetWasm,
        "-o",
        $targetWasm
    )
    & wasm-opt @optArgs
    if ($LASTEXITCODE -ne 0) { throw "wasm-opt failed for $($contract.Name)" }

    & wasm-strip $targetWasm
    if ($LASTEXITCODE -ne 0) { throw "wasm-strip failed for $($contract.Name)" }
}

Write-Host "WASM build complete: Escrow.wasm, Attestation.wasm"