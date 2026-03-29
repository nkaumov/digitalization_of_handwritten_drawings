$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root "logs/dev-all.pids.json"

if (Test-Path $pidFile) {
  $entries = Get-Content -Raw -Encoding UTF8 $pidFile | ConvertFrom-Json
  foreach ($entry in $entries) {
    $proc = Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue
    if ($null -ne $proc) {
      Write-Output ("RUNNING  {0}  PID={1}" -f $entry.Name, $entry.Pid)
    } else {
      Write-Output ("STOPPED  {0}  PID={1}" -f $entry.Name, $entry.Pid)
    }
  }
} else {
  Write-Output "No PID file found. Services are not managed by dev:all right now."
}

$ports = @(
  @{ Name = "web"; Port = 5173 },
  @{ Name = "api"; Port = 3001 },
  @{ Name = "ai"; Port = 8001 }
)

foreach ($service in $ports) {
  $listeners = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    $pids = ($listeners | Select-Object -ExpandProperty OwningProcess -Unique) -join ","
    Write-Output ("PORT-UP   {0}  {1}  PID={2}" -f $service.Name, $service.Port, $pids)
  } else {
    Write-Output ("PORT-DOWN {0}  {1}" -f $service.Name, $service.Port)
  }
}