$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $root "logs"
$pidFile = Join-Path $logsDir "dev-all.pids.json"

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

function Get-LiveEntries {
  param([array]$Entries)

  $live = @()
  foreach ($entry in $Entries) {
    if (-not $entry.Pid) { continue }
    $proc = Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue
    if ($null -ne $proc) { $live += $entry }
  }
  return $live
}

if (Test-Path $pidFile) {
  $existing = Get-Content -Raw -Encoding UTF8 $pidFile | ConvertFrom-Json
  $live = Get-LiveEntries -Entries $existing
  if ($live.Count -gt 0) {
    Write-Output "dev:all is already running. Use 'npm run status:all' or 'npm run stop:all'."
    exit 1
  }
}

$services = @(
  @{ Name = "web"; Args = @("run", "dev:web") },
  @{ Name = "api"; Args = @("run", "dev:api") },
  @{ Name = "ai"; Args = @("run", "dev:ai:managed") }
)

$started = @()

foreach ($service in $services) {
  $outLog = Join-Path $logsDir ("dev-{0}.out.log" -f $service.Name)
  $errLog = Join-Path $logsDir ("dev-{0}.err.log" -f $service.Name)

  $proc = Start-Process -FilePath "npm.cmd" -ArgumentList $service.Args -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog

  $started += [pscustomobject]@{
    Name = $service.Name
    Pid = $proc.Id
    OutLog = $outLog
    ErrLog = $errLog
    StartedAt = (Get-Date).ToString("o")
  }

  Write-Output ("Started {0} (PID: {1})" -f $service.Name, $proc.Id)
}

$started | ConvertTo-Json | Set-Content -Encoding UTF8 $pidFile
Write-Output ("PID file: {0}" -f $pidFile)
Write-Output "Use 'npm run stop:all' to stop all services."
