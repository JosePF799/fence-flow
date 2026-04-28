param(
  [string]$Configuration = "Release",
  [string]$AutoCADInstallDir = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$srcProject = Join-Path $projectRoot "src\FenceFlowCadPlugin\FenceFlowCadPlugin.csproj"
$bundleRoot = Join-Path $projectRoot "bundle\FenceFlowCadPlugin.bundle"
$contentsDir = Join-Path $bundleRoot "Contents"
$distDir = Join-Path $projectRoot "dist"
$zipPath = Join-Path $distDir "FenceFlowCadPlugin.bundle.zip"

if (-not (Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (-not (Test-Path $contentsDir)) {
  New-Item -ItemType Directory -Path $contentsDir | Out-Null
}

$buildArgs = @(
  "build",
  $srcProject,
  "-c", $Configuration
)

if ($AutoCADInstallDir) {
  $buildArgs += "/p:AutoCADInstallDir=$AutoCADInstallDir"
}

Write-Host "Building FenceFlowCadPlugin..."
dotnet @buildArgs

$dllDir = Join-Path $projectRoot "src\FenceFlowCadPlugin\bin\$Configuration\net48"
$dllPath = Join-Path $dllDir "FenceFlowCadPlugin.dll"

if (-not (Test-Path $dllPath)) {
  throw "Build completed but DLL was not found at $dllPath"
}

Copy-Item -LiteralPath $dllPath -Destination (Join-Path $contentsDir "FenceFlowCadPlugin.dll") -Force

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $bundleRoot "*") -DestinationPath $zipPath -Force

Write-Host "Bundle created:"
Write-Host $zipPath
