param(
  [Parameter(Mandatory = $true)][string]$Command,
  [string]$LogFile = "logs/terminal.log"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogFile) | Out-Null
"[$(Get-Date -Format o)] command: $Command" | Tee-Object -FilePath $LogFile -Append
powershell -NoProfile -Command $Command 2>&1 | Tee-Object -FilePath $LogFile -Append
