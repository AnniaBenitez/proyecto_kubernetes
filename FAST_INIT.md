# Ejecución Rápida

## Opción 1: Docker Compose

### Prerrequisitos

* Docker
* Docker Compose

### Clonar el repositorio

```bash
git clone https://github.com/AnniaBenitez/proyecto_kubernetes.git
cd proyecto_kubernetes
git checkout annia-ubuntu
```

### Crear archivos de configuración

```bash
cp .env.example .env
cp be/.env.example be/.env
cp fe/.env.example fe/.env
```

### Levantar el sistema

```bash
docker compose up -d --build
```

### Acceso

Frontend:

```text
http://localhost:8081
```

API:

```text
http://localhost:8081/api
```

Health Check:

```bash
curl http://localhost:8081/api/health
```

Versión:

```bash
curl http://localhost:8081/api/version
```

---

## Opción 2: Kubernetes (Minikube)

### Prerrequisitos

* Docker
* Minikube
* kubectl

### Iniciar Minikube

```bash
minikube start --driver=docker
```

### Clonar el repositorio

```bash
git clone https://github.com/AnniaBenitez/proyecto_kubernetes.git
cd proyecto_kubernetes
git checkout annia-ubuntu
```

### Desplegar la aplicación

```bash
kubectl apply -f k8s/
```

### Verificar despliegue

```bash
kubectl get pods -n devops-lab
```

Todos los pods deben encontrarse en estado:

```text
Running
```

### Abrir la aplicación

```bash
minikube service caddy -n devops-lab
```

### Verificar backend

```bash
BACKEND_URL=$(minikube service backend -n devops-lab --url)

curl $BACKEND_URL/api/health
curl $BACKEND_URL/api/version
```

### Monitoreo

Prometheus:

```bash
minikube service prometheus -n devops-lab
```

Grafana:

```bash
minikube service grafana -n devops-lab
```

---

## Jenkins CI/CD (Opcional)

El proyecto incluye un pipeline Jenkins para:

* Build de imágenes Docker.
* Push a Docker Hub.
* Despliegue automático en Kubernetes.
* Validación del despliegue.

Acceso:

```text
http://localhost:8080
```

Se requiere una credencial Jenkins:

```text
ID: dockerhub-credentials
Tipo: Username with password
```

utilizando un Personal Access Token de Docker Hub.
