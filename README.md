# Patient Management System - Examen Final DevOps

Proyecto integrador de la empresa ficticia **Salud Digital S.A.** Incluye una
aplicacion web para gestionar pacientes, CI/CD con Jenkins, imagenes Docker,
despliegue en Kubernetes y observabilidad con Prometheus y Grafana.

## Cumplimiento del enunciado

| Requisito | Implementacion |
|---|---|
| Control de versiones | Proyecto preparado para Git |
| Frontend web | React + Vite + TypeScript |
| Backend API REST | Node.js + Express + TypeORM |
| Base de datos | PostgreSQL 15 |
| `/health` y `/version` | Expuestos por el backend |
| Variables de configuracion | Variables de entorno y ConfigMap |
| Credenciales como secretos | Secrets de PostgreSQL y Grafana |
| Docker | Dockerfile para frontend y backend |
| Jenkins | Checkout, build, Docker build, push, despliegue manual y validacion |
| Kubernetes | Namespace, Deployments, Services, ConfigMaps, Secrets y PVC |
| Prometheus | Metricas de aplicacion, pods, CPU y memoria |
| Grafana | Datasource y dashboard provisionados automaticamente |

## Arquitectura

```text
Usuario
  |
  v
Frontend (Caddy + React) ---- /api ----> Backend (Express)
                                            |
                                            v
                                      PostgreSQL

Prometheus <---- /metrics + cAdvisor + kube-state-metrics
    |
    v
Grafana (dashboard Patient API - DevOps)
```

En Kubernetes se usan dos namespaces:

- `devops-lab`: frontend, backend y PostgreSQL.
- `monitoring`: Prometheus, kube-state-metrics y Grafana.

## Endpoints

```text
GET    /health
GET    /version
GET    /metrics
GET    /api/patients
GET    /api/patients/:id
POST   /api/patients
PUT    /api/patients/:id
DELETE /api/patients/:id
```

## Ejecucion local con Docker Compose

Requisitos: Docker Desktop con Docker Compose.

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Accesos:

- Aplicacion: <http://localhost:5173>
- API directa: <http://localhost:3000>
- Salud: <http://localhost:3000/health>
- Version: <http://localhost:3000/version>
- Metricas: <http://localhost:3000/metrics>

Detener:

```bash
docker compose down
```

## Despliegue manual en Kubernetes

Requisitos: un cluster Kubernetes, `kubectl` configurado y las imagenes
publicadas en Docker Hub.

El pipeline obtiene automaticamente el usuario de Docker Hub desde el campo
`username` de la credencial Jenkins `dockerhub-credentials`. No es necesario
escribir el usuario dentro del `Jenkinsfile`.

Los YAML usan nombres locales neutros como valores iniciales. Durante el stage
de despliegue, Jenkins los reemplaza con:

```text
<usuario-de-dockerhub>/patient-backend:<numero-de-build>
<usuario-de-dockerhub>/patient-frontend:<numero-de-build>
```

Cambiar tambien las contrasenas de demostracion en:

- `k8s/01-postgres.yaml`
- `k8s/04-monitoring.yaml`

Aplicar y verificar:

```bash
kubectl apply -f k8s/
kubectl get pods -n devops-lab
kubectl get pods -n monitoring
kubectl get svc -n devops-lab
kubectl get svc -n monitoring
```

Accesos NodePort en Docker Desktop:

- Frontend: <http://localhost:30173>
- Backend: <http://localhost:30080>
- Prometheus: <http://localhost:30090>
- Grafana: <http://localhost:30300>

En Minikube usar `minikube service <servicio> -n <namespace> --url`.

La cuenta inicial de Grafana se obtiene del Secret `grafana-admin`. En esta
version de demostracion es `admin` / `change-me-grafana`.

## Jenkins

El agente de Jenkins necesita:

- Git, Node.js, Docker y `kubectl`.
- Acceso al daemon de Docker.
- Credencial `dockerhub-credentials` de tipo Username/Password.
- Credencial `kubeconfig-minikube` de tipo Secret file.

### Configurar acceso de Jenkins a Minikube

El servicio de Jenkins se ejecuta con un usuario de Windows distinto al usuario
que creo Minikube. Por eso no debe depender de `C:\Users\<usuario>\.kube`.

Generar un kubeconfig autocontenido desde PowerShell:

```powershell
kubectl config view --raw --flatten --minify |
  Set-Content -Encoding utf8 "$env:TEMP\kubeconfig-jenkins.yaml"
```

Tambien se incluye un script que genera y verifica el archivo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generar-kubeconfig-jenkins.ps1
```

Comprobarlo antes de subirlo:

```powershell
kubectl --kubeconfig "$env:TEMP\kubeconfig-jenkins.yaml" cluster-info
```

En Jenkins:

1. Ir a **Manage Jenkins > Credentials > System > Global credentials**.
2. Seleccionar **Add Credentials**.
3. Elegir **Secret file**.
4. Subir `kubeconfig-jenkins.yaml`.
5. Usar exactamente el ID `kubeconfig-minikube`.
6. Borrar el archivo temporal después de cargarlo, porque contiene credenciales
   del cluster.

El `Jenkinsfile` asigna temporalmente ese archivo a `KUBECONFIG` durante los
stages de despliegue y validacion.

Etapas implementadas:

1. Checkout del repositorio.
2. Build del backend y lint/build del frontend.
3. Construccion de ambas imagenes Docker.
4. Push a Docker Hub con credenciales de Jenkins.
5. Aprobacion manual mediante el boton **Desplegar** y deploy con `kubectl`.
6. Validacion de rollouts, pods y endpoints desde pods temporales dentro del cluster.
7. Publicacion local automatica de la aplicacion y del monitoreo.

El numero de build de Jenkins se usa como tag de imagen y como respuesta de
`/version` despues del despliegue.

Antes de aplicar los manifiestos, el pipeline elimina valores directos antiguos
de `APP_VERSION` y `NODE_ENV` que pudieran haber sido creados por versiones
anteriores del pipeline. Luego actualiza `APP_VERSION` en `backend-config` y
reinicia el backend, manteniendo todas las variables administradas mediante
ConfigMap.

Al finalizar correctamente, Jenkins inicia varios `kubectl port-forward`
persistentes y muestra estas URL en el log:

```text
Aplicacion:         http://localhost:30174
Prometheus:         http://localhost:30090
Prometheus targets: http://localhost:30090/targets
Grafana:            http://localhost:30300
kube-state-metrics: http://localhost:30176/metrics
```

`kube-state-metrics` expone metricas en texto y no posee una interfaz grafica.
Cada ejecucion reemplaza los `port-forward` anteriores. Si alguno de los puertos
esta ocupado por un programa distinto de `kubectl`, el stage falla sin cerrar
ese programa y muestra el conflicto.

La validacion usa `kubectl rollout status` para los Deployments y no espera
todos los pods del namespace, porque durante un Rolling Update pueden coexistir
pods nuevos con pods antiguos en estado `Terminating`.

## Monitoreo

Prometheus recolecta:

- Metricas de la aplicacion desde `/metrics`.
- CPU y memoria de contenedores desde cAdvisor.
- Estado y fase de pods desde kube-state-metrics.

El dashboard **Patient API - DevOps** incluye:

- disponibilidad del backend;
- cantidad de pods en estado `Running`;
- requests HTTP por segundo;
- CPU por pod;
- memoria por pod;
- memoria RSS de la aplicacion.

Comandos para la defensa:

```bash
kubectl get pods -A
kubectl top pods -n devops-lab
kubectl logs -n devops-lab deployment/backend
kubectl describe deployment backend -n devops-lab
kubectl rollout status deployment/backend -n devops-lab
kubectl get configmap,secret -n devops-lab
```

`kubectl top` requiere Metrics Server; Grafana no depende de ese componente
porque obtiene CPU y memoria mediante Prometheus/cAdvisor.

## Evidencias requeridas antes de entregar

Agregar capturas reales en `docs/evidencias/`:

1. Pipeline Jenkins finalizado correctamente.
2. Aprobacion manual del stage de despliegue.
3. `kubectl get pods -A` con pods `Running`.
4. Frontend funcionando.
5. Respuestas de `/health` y `/version`.
6. Targets de Prometheus en estado `UP`.
7. Dashboard de Grafana con CPU, memoria, pods y aplicacion.

No se incluyen capturas inventadas: deben obtenerse del entorno usado durante
la demostracion.

## Problemas encontrados y resueltos

- Compose usaba `DB_HOST=postgres`, pero el servicio se llamaba `db`.
- El frontend se compilaba contra `localhost:3000`, lo que fallaba en Kubernetes.
- La imagen del frontend no coincidia entre Jenkins y Kubernetes.
- La validacion de Jenkins dependia de NodePort en la maquina del agente.
- El monitoreo solo exponia metricas Node.js y no cubria pods, CPU y memoria.
- Las credenciales de Grafana estaban puestas directamente en el Deployment.

## Limitaciones

- Los Secrets del repositorio contienen valores de demostracion. En un entorno
  real deben generarse fuera de Git o administrarse con Vault/Sealed Secrets.
- Las evidencias visuales y la ejecucion completa de Jenkins requieren el
  entorno local del equipo.
