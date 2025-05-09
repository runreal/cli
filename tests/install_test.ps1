#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

# Test that we can install the latest version at the default location.
Remove-Item "~\.runreal" -Recurse -Force -ErrorAction SilentlyContinue
$env:RUNREAL_INSTALL = ""
$v = $null; .\install.ps1
~\.runreal\bin\runreal.exe --version

# Test that we can install a specific version at a custom location.
Remove-Item "~\runreal-1.5.0" -Recurse -Force -ErrorAction SilentlyContinue
$env:RUNREAL_INSTALL = "$Home\runreal-1.5.0"
$v = "1.5.0"; .\install.ps1
$RunrealVersion = ~\runreal-1.5.0\bin\runreal.exe --version
if (!($RunrealVersion -like '*1.5.0*')) {
  throw $RunrealVersion
}

# Test that we can install at a relative custom location.
Remove-Item "bin" -Recurse -Force -ErrorAction SilentlyContinue
$env:RUNREAL_INSTALL = "."
$v = "1.5.0"; .\install.ps1
$RunrealVersion = bin\runreal.exe --version
if (!($RunrealVersion -like '*1.5.0*')) {
  throw $RunrealVersion
}

# Test that the old temp file installer still works.
Remove-Item "~\runreal-1.5.0" -Recurse -Force -ErrorAction SilentlyContinue
$env:RUNREAL_INSTALL = "$Home\runreal-1.5.0"
$v = $null; .\install.ps1 v1.5.0
$RunrealVersion = ~\runreal-1.5.0\bin\runreal.exe --version
if (!($RunrealVersion -like '*1.5.0*')) {
  throw $RunrealVersion
}
