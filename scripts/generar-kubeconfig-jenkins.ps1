$ErrorActionPreference = 'Stop'

$outputPath = Join-Path $env:TEMP 'kubeconfig-jenkins.yaml'

kubectl config view --raw --flatten --minify |
    Set-Content -Encoding utf8 -LiteralPath $outputPath

kubectl --kubeconfig $outputPath cluster-info | Out-Host

Write-Host ''
Write-Host "Kubeconfig generado y verificado: $outputPath"
Write-Host 'Subilo a Jenkins como Secret file con ID: kubeconfig-minikube'
Write-Host 'Borra el archivo local despues de cargarlo porque contiene credenciales.'
