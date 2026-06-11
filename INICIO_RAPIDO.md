# Inicio Rápido

Esta guía permite descargar y ejecutar el proyecto en Windows o Linux.

---

# 1. Ejecución rápida con Docker Compose

Esta opción permite levantar la aplicación localmente de forma simple.

## Requisitos

* Git
* Docker
* Docker Compose

---

## Windows

Abrir PowerShell.

```powershell
git clone https://github.com/AnniaBenitez/proyecto_kubernetes.git
cd proyecto_kubernetes
git checkout bryan-test

Copy-Item .env.example .env

docker compose up -d --build
docker compose ps
```

Accesos:

| Servicio | URL                           |
| -------- | ----------------------------- |
| Frontend | http://localhost:5173         |
| Backend  | http://localhost:3000         |
| Health   | http://localhost:3000/health  |
| Version  | http://localhost:3000/version |
| Metrics  | http://localhost:3000/metrics |

Detener:

```powershell
docker compose down
```

---

## Linux

Abrir una terminal.

```bash
git clone https://github.com/AnniaBenitez/proyecto_kubernetes.git
cd proyecto_kubernetes
git checkout bryan-test

cp .env.example .env

docker compose up -d --build
docker compose ps
```

Accesos:

| Servicio | URL                           |
| -------- | ----------------------------- |
| Frontend | http://localhost:5173         |
| Backend  | http://localhost:3000         |
| Health   | http://localhost:3000/health  |
| Version  | http://localhost:3000/version |
| Metrics  | http://localhost:3000/metrics |

Detener:

```bash
docker compose down
```

---

# 2. Ejecución completa con Jenkins + Kubernetes

Esta opción ejecuta el flujo completo de CI/CD:

```text
GitHub → Jenkins → Docker Build → Docker Hub → Kubernetes → Validación
```

---

# 2.1 Requisitos

* Git
* Docker
* Docker Compose
* Kubernetes local

  * Windows: Kubernetes de Docker Desktop o Minikube
  * Linux: Minikube
* kubectl
* Jenkins
* Cuenta de Docker Hub

---

# 2.2 Preparar Kubernetes

## Windows

Si se usa Docker Desktop, activar Kubernetes desde:

```text
Docker Desktop → Settings → Kubernetes → Enable Kubernetes
```

Verificar:

```powershell
kubectl get nodes
```

Si se usa Minikube:

```powershell
minikube start --driver=docker
kubectl get nodes
```

---

## Linux

```bash
minikube start --driver=docker
kubectl get nodes
```

---

# 2.3 Generar kubeconfig para Jenkins

## Windows PowerShell

```powershell
kubectl config view --raw --flatten --minify | Set-Content -Encoding utf8 "$env:TEMP\kubeconfig-jenkins.yaml"

kubectl --kubeconfig "$env:TEMP\kubeconfig-jenkins.yaml" get nodes
```

Archivo generado:

```text
%TEMP%\kubeconfig-jenkins.yaml
```

---

## Linux

```bash
kubectl config view --raw --flatten > /tmp/kubeconfig-jenkins.yaml

KUBECONFIG=/tmp/kubeconfig-jenkins.yaml kubectl get nodes
```

Archivo generado:

```text
/tmp/kubeconfig-jenkins.yaml
```

---

# 2.4 Levantar Jenkins

## Windows

La forma más simple en Windows es usar Jenkins instalado localmente o una imagen Docker con acceso a Docker Desktop.

Si se usa Jenkins local instalado en Windows, verificar que tenga disponibles:

```powershell
git --version
node --version
npm --version
docker --version
kubectl version --client
```

Si falta Node.js, instalar Node.js LTS.

---

## Linux

Crear imagen Jenkins con herramientas necesarias:

```bash
mkdir -p jenkins
nano jenkins/Dockerfile
```

Pegar:

```dockerfile
FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y docker.io curl nodejs npm git && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl && \
    apt-get clean

USER root
```

Construir:

```bash
docker build -t proyecto-jenkins:local ./jenkins
```

Ejecutar Jenkins:

```bash
docker volume create jenkins_home

docker run -d \
  --name jenkins \
  --user root \
  --network host \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  proyecto-jenkins:local
```

Abrir:

```text
http://localhost:8080
```

Contraseña inicial:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Instalar plugins sugeridos y crear usuario administrador.

---

# 2.5 Configurar credenciales en Jenkins

Entrar a:

```text
Manage Jenkins
→ Credentials
→ System
→ Global credentials
→ Add Credentials
```

---

## Credencial Docker Hub

Crear token en Docker Hub:

```text
Docker Hub → Account Settings → Personal Access Tokens
```

En Jenkins crear:

| Campo    | Valor                  |
| -------- | ---------------------- |
| Kind     | Username with password |
| Username | Usuario Docker Hub     |
| Password | Token Docker Hub       |
| ID       | dockerhub-credentials  |

El ID debe ser exactamente:

```text
dockerhub-credentials
```

---

## Credencial Kubernetes

Crear credencial:

| Campo | Valor                   |
| ----- | ----------------------- |
| Kind  | Secret file             |
| File  | kubeconfig-jenkins.yaml |
| ID    | kubeconfig-minikube     |

Usar el archivo generado anteriormente:

* Windows: `%TEMP%\kubeconfig-jenkins.yaml`
* Linux: `/tmp/kubeconfig-jenkins.yaml`

El ID debe ser exactamente:

```text
kubeconfig-minikube
```

---

# 2.6 Crear job Pipeline

En Jenkins:

```text
New Item
```

Nombre sugerido:

```text
proyecto-kubernetes-bryan
```

Tipo:

```text
Pipeline
```

Configurar:

| Campo            | Valor                                                   |
| ---------------- | ------------------------------------------------------- |
| Definition       | Pipeline script from SCM                                |
| SCM              | Git                                                     |
| Repository URL   | https://github.com/AnniaBenitez/proyecto_kubernetes.git |
| Branch Specifier | */bryan-test                                            |
| Script Path      | Jenkinsfile                                             |

Guardar.

---

# 2.7 Ejecutar pipeline

Entrar al job y ejecutar:

```text
Build Now
```

Cuando Jenkins pida aprobación:

```text
Despliegue manual obligatorio: aplicar cambios en Kubernetes?
```

Presionar:

```text
Desplegar
```

---

# 2.8 Verificar despliegue

```bash
kubectl get pods -A
kubectl get svc -A
```

Backend:

```bash
kubectl run api-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n devops-lab -- curl -fsS http://backend:3000/health
```

Version:

```bash
kubectl run version-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n devops-lab -- curl -fsS http://backend:3000/version
```

---

# 2.9 Accesos

Si Jenkins finaliza correctamente, en la consola mostrará:

```text
Aplicacion:         http://localhost:30174
Prometheus:         http://localhost:30090
Prometheus targets: http://localhost:30090/targets
Grafana:            http://localhost:30300
kube-state-metrics: http://localhost:30176/metrics
```

Credenciales Grafana de demostración:

```text
Usuario: admin
Contraseña: change-me-grafana
```

---

# 3. Archivos principales

| Componente                                  | Ubicación                |
| ------------------------------------------- | ------------------------ |
| Frontend                                    | `fe/`                    |
| Backend                                     | `be/`                    |
| Dockerfile Frontend                         | `fe/Dockerfile`          |
| Dockerfile Backend                          | `be/Dockerfile`          |
| Docker Compose                              | `docker-compose.yml`     |
| Jenkins Pipeline                            | `Jenkinsfile`            |
| Kubernetes                                  | `k8s/`                   |
| PostgreSQL                                  | `k8s/01-postgres.yaml`   |
| Backend Kubernetes                          | `k8s/02-backend.yaml`    |
| Frontend Kubernetes                         | `k8s/03-frontend.yaml`   |
| Prometheus / Grafana                        | `k8s/04-monitoring.yaml` |
| Endpoints `/health`, `/version`, `/metrics` | `be/src/index.ts`        |

---

# 4. Problemas comunes

## Jenkins no encuentra npm

Error:

```text
npm: not found
```

Solución:

Instalar Node.js/npm en el agente Jenkins o usar la imagen personalizada de Jenkins indicada para Linux.

---

## Jenkins no accede a Kubernetes

Error:

```text
unable to read client-cert
```

o:

```text
connection refused
```

Solución:

Regenerar kubeconfig y volver a cargar la credencial `kubeconfig-minikube`.

---

## NodePort ocupado

Error:

```text
provided port is already allocated
```

Solución:

Eliminar despliegues anteriores:

```bash
kubectl delete namespace devops-lab
kubectl delete namespace monitoring
```

Luego ejecutar nuevamente el pipeline.

---

## Docker sin espacio

Verificar:

```bash
docker system df
df -h
```

Limpiar:

```bash
docker system prune -a -f
docker builder prune -a -f
```
