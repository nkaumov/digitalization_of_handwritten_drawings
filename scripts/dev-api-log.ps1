param(
  [string]$LogFile = "logs/api-dev.log"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogFile) | Out-Null
"[$(Get-Date -Format o)] starting api dev" | Tee-Object -FilePath $LogFile -Append
npx pnpm@10.6.2 --filter @app/api dev 2>&1 | Tee-Object -FilePath $LogFile -Append
