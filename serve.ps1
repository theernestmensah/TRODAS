param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$port = 5500

# Static file server for the portal. Project data now lives in Convex (see README.md);
# the old /projects API was retired. data/projects.json is kept only as the import source.

function Send-Bytes([System.Net.HttpListenerResponse]$response, [int]$status, [string]$contentType, [byte[]]$bytes) {
  $response.StatusCode = $status
  $response.ContentType = $contentType
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.Close()
}

function Send-Text($response, [int]$status, [string]$contentType, [string]$text) {
  Send-Bytes $response $status $contentType ([System.Text.Encoding]::UTF8.GetBytes($text))
}

function Get-Mime([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.js'   { 'text/javascript; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.svg'  { 'image/svg+xml' }
    '.ico'  { 'image/x-icon' }
    '.png'  { 'image/png' }
    '.ttf'  { 'font/ttf' }
    '.woff' { 'font/woff' }
    '.woff2'{ 'font/woff2' }
    default { 'application/octet-stream' }
  }
}

# Folders and files that are part of the project but must not be served to browsers.
$private = @('node_modules', 'convex', 'data', 'scripts', '.git', '.impeccable', '.env.local', 'package.json', 'package-lock.json')

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
try {
  $listener.Prefixes.Add($prefix)
  $listener.Start()
} catch {
  Write-Host "Could not start on port $port. Try closing whatever is using it, then run serve.ps1 again."
  throw
}

Write-Host "Trodas portal running at $prefix"
Write-Host "Press Ctrl+C to stop."
if (-not $NoBrowser) { Start-Process $prefix }

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)

  try {
    if ($request.HttpMethod -ne 'GET') {
      Send-Text $response 405 'text/plain; charset=utf-8' 'Method not allowed'
      continue
    }

    $relative = if ($path -eq '/') { 'index.html' } else { $path.TrimStart('/') }
    $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
    $firstSegment = ($relative -split '[\\/]')[0]
    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or $private -contains $firstSegment) {
      Send-Text $response 403 'text/plain; charset=utf-8' 'Forbidden'
      continue
    }
    if (-not (Test-Path $full) -or (Get-Item $full).PSIsContainer) {
      Send-Text $response 404 'text/plain; charset=utf-8' 'Not found'
      continue
    }
    $bytes = [System.IO.File]::ReadAllBytes($full)
    Send-Bytes $response 200 (Get-Mime $full) $bytes
  } catch {
    # Usually the browser closed the connection mid-response (a reload or a cancelled
    # request). The response may be half-sent, so try a 500 and otherwise drop it;
    # either way, keep serving.
    try { Send-Text $response 500 'text/plain; charset=utf-8' 'Server error' }
    catch { try { $response.Abort() } catch {} }
  }
}
