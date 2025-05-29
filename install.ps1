#!/usr/bin/env pwsh
# Copyright 2019-2025 the Deno authors. All rights reserved. MIT license.
# Copyright 2025 runreal. All rights reserved. MIT license.
# Adopted from https://github.com/denoland/deno_install

$ErrorActionPreference = 'Stop'

if ($v) {
  $Version = "v${v}"
}
if ($Args.Length -eq 1) {
  $Version = $Args.Get(0)
}

$RunrealInstall = $env:RUNREAL_INSTALL
$BinDir = if ($RunrealInstall) {
  "${RunrealInstall}\bin"
} else {
  "${Home}\.runreal\bin"
}

$RunrealExe = "$BinDir\runreal.exe"
$Target = 'win-x64'

$Version = if (!$Version) {
  curl.exe --ssl-revoke-best-effort -s "https://api.github.com/repos/runreal/cli/releases/latest" | 
  ConvertFrom-Json | 
  Select-Object -ExpandProperty tag_name
} else {
  $Version
}

Write-Output "Installing runreal ${Version} for ${Target}"

$DownloadUrl = "https://github.com/runreal/cli/releases/download/${Version}/runreal-${Target}.exe"

if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

curl.exe --ssl-revoke-best-effort -Lo $RunrealExe $DownloadUrl

$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

Write-Output "runreal was installed successfully to ${RunrealExe}"
Write-Output "Run 'runreal --help' to get started"
