$ErrorActionPreference = 'Stop'

$baseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:8082' }
$jaegerUrl = if ($env:JAEGER_URL) { $env:JAEGER_URL } else { 'http://localhost:16686' }

for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri "$baseUrl/healthz"
        if ($health.status -eq 'ok') {
            break
        }
    } catch {
    }

    Start-Sleep -Seconds 2
}

$health = Invoke-RestMethod -Uri "$baseUrl/healthz"
if ($health.status -ne 'ok') {
    throw 'Backend health check did not return ok.'
}

$metrics = Invoke-RestMethod -Uri "$baseUrl/metrics" | Out-String
if ($metrics -notmatch 'qr_http_requests_total') {
    throw 'Metrics endpoint did not expose qr_http_requests_total.'
}

$loginPayload = @{
    email = 'bob.admin@timesignal.demo'
    password = 'Admin123!'
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType 'application/json' -Body $loginPayload
if (-not $login.token) {
    throw 'Login smoke test did not return a token.'
}

$scanPayload = @{
    code = 'ALICE-DEMO-001'
} | ConvertTo-Json

$scan = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/scan" -ContentType 'application/json' -Headers @{ 'X-DEVICE-TOKEN' = 'scanner-demo-token' } -Body $scanPayload
if ($scan.action -notin @('checked_in', 'checked_out')) {
    throw 'Scan smoke test did not return a valid action.'
}

for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $services = Invoke-RestMethod -Uri "$jaegerUrl/api/services"
        if ($services.data -contains 'qr-incheck-backend') {
            exit 0
        }
    } catch {
    }

    Start-Sleep -Seconds 2
}

throw 'Jaeger did not report the qr-incheck-backend service in time.'
