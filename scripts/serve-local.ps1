<#
Serves the repo root over local HTTP so index.html's fetch('factory-data.json') actually works --
under file:// that fetch is CORS-blocked, so double-clicking index.html falls back to the
Fallback (embedded) data mode instead of File. Run this instead, then open the printed URL.

Usage:
  scripts\serve-local.ps1            # picks port 8000, or next free one
  scripts\serve-local.ps1 -Port 9000 # request a specific port
#>
param(
    [int]$Port = 8000
)

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-PortFree([int]$p) {
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $p)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) { $listener.Stop() }
    }
}

while (-not (Test-PortFree $Port)) { $Port++ }

$url = "http://localhost:$Port/index.html"
Write-Host "Serving $Root"
Write-Host "Open: $url  (should show 'File' in the top-right corner)"
Write-Host "Ctrl+C to stop."
Start-Process $url

python -m http.server $Port
