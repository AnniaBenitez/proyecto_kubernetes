param(
    [Parameter(Mandatory = $true)]
    [string]$Kubeconfig,

    [int]$LocalPort = 30174
)

$ErrorActionPreference = 'Stop'
$servicePort = 5173
$namespace = 'devops-lab'
$service = 'frontend'

$listener = Get-NetTCPConnection -State Listen -LocalPort $LocalPort -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($listener) {
    $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue

    if ($owner -and $owner.ProcessName -eq 'kubectl') {
        Stop-Process -Id $owner.Id -Force
        Start-Sleep -Seconds 1
    } else {
        $processName = if ($owner) { $owner.ProcessName } else { 'desconocido' }
        throw "El puerto $LocalPort esta ocupado por $processName. Elegir otro puerto o cerrar ese proceso."
    }
}

$logDirectory = Join-Path $env:ProgramData 'Jenkins\port-forward'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$stdout = Join-Path $logDirectory 'frontend.out.log'
$stderr = Join-Path $logDirectory 'frontend.err.log'

$env:KUBECONFIG = $Kubeconfig
$env:JENKINS_NODE_COOKIE = 'frontend-port-forward'

$process = Start-Process -FilePath 'kubectl.exe' `
    -ArgumentList @(
        'port-forward',
        '-n', $namespace,
        "service/$service",
        "${LocalPort}:${servicePort}",
        '--address', '127.0.0.1'
    ) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -PassThru

$ready = $false

for ($attempt = 0; $attempt -lt 15; $attempt++) {
    Start-Sleep -Milliseconds 500

    if ($process.HasExited) {
        $errorText = Get-Content -Raw -LiteralPath $stderr -ErrorAction SilentlyContinue
        throw "kubectl port-forward termino inesperadamente. $errorText"
    }

    if (Get-NetTCPConnection -State Listen -LocalPort $LocalPort -ErrorAction SilentlyContinue) {
        $ready = $true
        break
    }
}

if (-not $ready) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    throw "El port-forward no abrio el puerto $LocalPort dentro del tiempo esperado."
}

$response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$LocalPort" -TimeoutSec 10

if ($response.StatusCode -ne 200) {
    throw "El frontend respondio con HTTP $($response.StatusCode)."
}

Write-Host "Frontend publicado correctamente."
Write-Host "Aplicacion: http://localhost:$LocalPort"
Write-Host "Proceso kubectl: $($process.Id)"
