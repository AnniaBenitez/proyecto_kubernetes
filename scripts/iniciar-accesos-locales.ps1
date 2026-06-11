param(
    [Parameter(Mandatory = $true)]
    [string]$Kubeconfig
)

$ErrorActionPreference = 'Stop'
$env:KUBECONFIG = $Kubeconfig
$env:JENKINS_NODE_COOKIE = 'devops-port-forwards'

$logDirectory = Join-Path $env:ProgramData 'Jenkins\port-forward'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$services = @(
    @{
        Name = 'Aplicacion'
        Namespace = 'devops-lab'
        Service = 'frontend'
        LocalPort = 30174
        ServicePort = 5173
        Path = '/'
    },
    @{
        Name = 'Prometheus'
        Namespace = 'monitoring'
        Service = 'prometheus'
        LocalPort = 30090
        ServicePort = 9090
        Path = '/-/ready'
    },
    @{
        Name = 'Grafana'
        Namespace = 'monitoring'
        Service = 'grafana'
        LocalPort = 30300
        ServicePort = 3000
        Path = '/api/health'
    },
    @{
        Name = 'kube-state-metrics'
        Namespace = 'monitoring'
        Service = 'kube-state-metrics'
        LocalPort = 30176
        ServicePort = 8080
        Path = '/metrics'
    }
)

foreach ($item in $services) {
    $startPortForward = $true
    $url = "http://127.0.0.1:$($item.LocalPort)$($item.Path)"

    Write-Output "Verificando $($item.Name) en $url ..."

    $listener = Get-NetTCPConnection -State Listen -LocalPort $item.LocalPort -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($listener) {
        $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue

        if ($owner -and $owner.ProcessName -eq 'kubectl') {
            try {
                $existingResponse = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
                $startPortForward = $existingResponse.StatusCode -ne 200
            } catch {
                $startPortForward = $true
            }

            if ($startPortForward) {
                try {
                    Stop-Process -Id $owner.Id -Force
                    Start-Sleep -Milliseconds 500
                } catch {
                    if (Get-Process -Id $owner.Id -ErrorAction SilentlyContinue) {
                        & cmd.exe /d /c "taskkill /PID $($owner.Id) /F >nul 2>&1"
                        Start-Sleep -Milliseconds 500
                    }

                    if (Get-Process -Id $owner.Id -ErrorAction SilentlyContinue) {
                        throw "El port-forward existente de $($item.Name) no responde y no se pudo reiniciar. Cerrar el proceso kubectl PID $($owner.Id)."
                    }
                }
            }
        } else {
            $processName = if ($owner) { $owner.ProcessName } else { 'desconocido' }
            throw "El puerto $($item.LocalPort) esta ocupado por $processName."
        }
    }

    if ($startPortForward) {
        $stdout = Join-Path $logDirectory "$($item.Service).out.log"
        $stderr = Join-Path $logDirectory "$($item.Service).err.log"

        $process = Start-Process -FilePath 'kubectl.exe' `
            -ArgumentList @(
                'port-forward',
                '-n', $item.Namespace,
                "service/$($item.Service)",
                "$($item.LocalPort):$($item.ServicePort)",
                '--address', '127.0.0.1'
            ) `
            -WindowStyle Hidden `
            -RedirectStandardOutput $stdout `
            -RedirectStandardError $stderr `
            -PassThru

        $ready = $false

        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            Start-Sleep -Milliseconds 500

            if ($process.HasExited) {
                $errorText = Get-Content -Raw -LiteralPath $stderr -ErrorAction SilentlyContinue
                throw "$($item.Name) no pudo publicarse. $errorText"
            }

            if (Get-NetTCPConnection -State Listen -LocalPort $item.LocalPort -ErrorAction SilentlyContinue) {
                $ready = $true
                break
            }
        }

        if (-not $ready) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            throw "$($item.Name) no abrio el puerto $($item.LocalPort)."
        }
    }

    $httpReady = $false
    $lastError = ''

    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5

            if ($response.StatusCode -eq 200) {
                $httpReady = $true
                break
            }

            $lastError = "HTTP $($response.StatusCode)"
        } catch {
            $lastError = $_.Exception.Message
        }

        Start-Sleep -Seconds 1
    }

    if (-not $httpReady) {
        if ($startPortForward -and $process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }

        throw "$($item.Name) no respondio despues de 20 intentos. Ultimo error: $lastError"
    }

    Write-Output "$($item.Name): OK"
}

Write-Output ''
Write-Output 'Accesos publicados correctamente:'
Write-Output 'Aplicacion:         http://localhost:30174'
Write-Output 'Prometheus:         http://localhost:30090'
Write-Output 'Prometheus targets: http://localhost:30090/targets'
Write-Output 'Grafana:            http://localhost:30300'
Write-Output 'kube-state-metrics: http://localhost:30176/metrics'
