$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root "logs/dev-all.pids.json"

function Stop-ProcessTree {
  param([int]$ProcessId)

  cmd /c "taskkill /PID $ProcessId /T /F" | Out-Null
}

$stopped = 0

if (Test-Path $pidFile) {
  $entries = Get-Content -Raw -Encoding UTF8 $pidFile | ConvertFrom-Json

  foreach ($entry in $entries) {
    if (-not $entry.Pid) { continue }

    $proc = Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue
    if ($null -ne $proc) {
      Stop-ProcessTree -ProcessId $entry.Pid
      Write-Output ("Stopped {0} tree (PID: {1})" -f $entry.Name, $entry.Pid)
      $stopped++
    } else {
      Write-Output ("Already stopped {0} (PID: {1})" -f $entry.Name, $entry.Pid)
    }
  }
}

# Fallback: free known service ports even if processes were started outside dev:all.
$ports = @(5173, 3001, 8001)
foreach ($port in $ports) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $listeners) { continue }

  $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($id in $pids) {
    Stop-ProcessTree -ProcessId $id
    Write-Output ("Stopped process tree on port {0} (PID: {1})" -f $port, $id)
    $stopped++
  }
}

if (Test-Path $pidFile) {
  Remove-Item -LiteralPath $pidFile -Force
}

Write-Output ("Stopped services/process trees: {0}" -f $stopped)