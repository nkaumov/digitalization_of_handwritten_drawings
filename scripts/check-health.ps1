$ErrorActionPreference = "Stop"

$checks = @(
  @{ Name = "web"; Url = "http://127.0.0.1:5173" },
  @{ Name = "api"; Url = "http://127.0.0.1:3001/health" },
  @{ Name = "api-v1"; Url = "http://127.0.0.1:3001/api/v1/health" },
  @{ Name = "ai"; Url = "http://127.0.0.1:8001/health" }
)

$failed = $false

foreach ($check in $checks) {
  try {
    $resp = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 5
    Write-Output ("[OK] {0} => {1}" -f $check.Name, $resp.StatusCode)
  }
  catch {
    $failed = $true
    Write-Output ("[FAIL] {0} => {1}" -f $check.Name, $_.Exception.Message)
  }
}

if ($failed) {
  exit 1
}