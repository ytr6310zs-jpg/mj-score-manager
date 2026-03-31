<#
.SYNOPSIS
  Bootstrap GitHub Actions runner on Windows and register it as a service via NSSM.

.USAGE
  Run as Administrator:
    .\setup-windows-runner.ps1 -RepoUrl 'https://github.com/OWNER/REPO' -RegistrationToken '<TOKEN>'

  The script downloads the runner and NSSM, registers the runner, and creates a Windows service
  named 'actions-runner' that runs the runner's `run.cmd`.

SECURITY
  Do NOT hardcode tokens. Provide the registration token at runtime and remove it after use.
#>

param(
  [Parameter(Mandatory=$true)] [string]$RepoUrl,
  [Parameter(Mandatory=$true)] [string]$RegistrationToken,
  [string]$RunnerDir = 'C:\actions-runner',
  [string]$RunnerVersion = '2.308.0',
  [string]$Labels = 'self-hosted,windows,mj-db-runner'
)

function Abort($msg){ Write-Error $msg; exit 1 }

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Abort 'This script must be run as Administrator.'
}

Write-Host "Bootstrapping GitHub Actions runner into $RunnerDir"

New-Item -ItemType Directory -Path $RunnerDir -Force | Out-Null
Push-Location $RunnerDir

try {
  $zipName = "actions-runner-win-x64-$RunnerVersion.zip"
  $runnerUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/$zipName"
  Write-Host "Downloading runner $runnerUrl"
  Invoke-WebRequest -Uri $runnerUrl -OutFile "$RunnerDir\runner.zip" -UseBasicParsing
  Expand-Archive -Path "$RunnerDir\runner.zip" -DestinationPath $RunnerDir -Force

  Write-Host 'Configuring runner (unattended)'
  & "$RunnerDir\config.cmd" --url $RepoUrl --token $RegistrationToken --labels $Labels --unattended

  # NSSM
  $nssmZip = "nssm-2.24.zip"
  $nssmUrl = 'https://nssm.cc/release/nssm-2.24.zip'
  $nssmDir = 'C:\nssm'
  New-Item -ItemType Directory -Path $nssmDir -Force | Out-Null
  Write-Host "Downloading NSSM $nssmUrl"
  Invoke-WebRequest -Uri $nssmUrl -OutFile "$RunnerDir\nssm.zip" -UseBasicParsing
  Expand-Archive -Path "$RunnerDir\nssm.zip" -DestinationPath $nssmDir -Force

  $nssmExe = Join-Path $nssmDir 'nssm-2.24\win64\nssm.exe'
  if (-not (Test-Path $nssmExe)) {
    # fallback common path
    $nssmExe = Join-Path $nssmDir 'win64\nssm.exe'
  }
  if (-not (Test-Path $nssmExe)) { Abort "nssm.exe not found under $nssmDir" }

  Write-Host 'Installing runner as service via NSSM'
  & $nssmExe install actions-runner 'C:\Windows\System32\cmd.exe' "/c $RunnerDir\run.cmd"
  & $nssmExe set actions-runner AppDirectory $RunnerDir
  & $nssmExe set actions-runner Start SERVICE_AUTO_START
  & $nssmExe start actions-runner

  Write-Host 'Service installed and started: actions-runner'
  Write-Host 'Verify in GitHub: Settings → Actions → Runners (label mj-db-runner).'

} catch {
  Write-Error "Error: $_"
  Pop-Location
  Exit 1
} finally {
  Pop-Location
}

Write-Host 'Bootstrap completed. Remove the registration token from history and rotate if necessary.'
