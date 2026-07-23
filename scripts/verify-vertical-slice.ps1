#!/usr/bin/env pwsh
# Script de verificación del vertical slice (requiere Supabase configurado)

param(
    [string]$SupabaseUrl = $env:SUPABASE_URL,
    [string]$AnonKey = $env:SUPABASE_ANON_KEY
)

if (-not $SupabaseUrl -or -not $AnonKey) {
    Write-Error "Define SUPABASE_URL y SUPABASE_ANON_KEY"
    exit 1
}

$base = "$SupabaseUrl/functions/v1"
$headers = @{
    "apikey" = $AnonKey
    "Content-Type" = "application/json"
}

Write-Host "=== KeyLaunch Vertical Slice Check ===" -ForegroundColor Cyan

# 1. Process scan queue
Write-Host "`n[1/3] Procesando cola de escaneo VT..."
try {
    $scan = Invoke-RestMethod -Uri "$base/process-scan-queue" -Method POST -Headers $headers -Body "{}"
    Write-Host "  Procesados: $($scan.processed)" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Yellow
}

# 2. Check activate-key endpoint reachable
Write-Host "`n[2/3] Verificando endpoint activate-key..."
try {
    Invoke-RestMethod -Uri "$base/activate-key" -Method POST -Headers $headers `
        -Body '{"code":"INVALID","device_name":"TEST","device_fingerprint":"test"}' `
        -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  Endpoint activo (clave inválida rechazada correctamente)" -ForegroundColor Green
    } else {
        Write-Host "  Respuesta: $_" -ForegroundColor Yellow
    }
}

# 3. Check get-library endpoint
Write-Host "`n[3/3] Verificando endpoint get-library..."
try {
    Invoke-RestMethod -Uri "$base/get-library" -Method POST -Headers $headers `
        -Body '{"activation_ids":[]}' | Out-Null
    Write-Host "  Endpoint activo" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Completado ===" -ForegroundColor Cyan
Write-Host "Para prueba E2E completa, sigue docs/VERTICAL-SLICE.md"
