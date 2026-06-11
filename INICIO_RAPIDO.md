# Guía Rápida de Ejecución desde Cero

Esta guía permite levantar el proyecto en una máquina nueva usando Docker, Minikube, Kubernetes y Jenkins.

---

## 1. Requisitos Previos

La máquina debe tener instalado:

* Git
* Docker
* Docker Compose
* Minikube
* kubectl

Verificar:

```bash
git --version
docker --version
docker compose version
minikube version
kubectl version --client
```

---

## 2. Clonar el Proyecto

```bash
cd ~/Documents

git clone https://github.com/AnniaBenitez/proyecto_kubernetes.git

cd proyecto_kubernetes

git checkout bryan-test
```

---

## 3. Prueba Rápida con Docker Compose

Este paso es opcional, pero sirve para verificar que la aplicación funciona localmente.

```bash
cp .env.example .env

docker compose up -d --build

docker compose ps
```

Probar backend:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/version
curl http://localhost:3000/api/patients
```

Abrir frontend:

```text
http://localhost:5173
```

Detener Docker Compose antes de seguir con Kubernetes:

```bash
docker compose down
```

---

## 4. Iniciar Kubernetes con Minikube

```bash
minikube start --driver=docker

kubectl get nodes
```

Debe aparecer un nodo en estado `Ready`.

---

## 5. Probar Kubernetes Manualmente

Aplicar manifiestos:

```bash
kubectl apply -f k8s/
```

Verificar pods:

```bash
kubectl get pods -n devops-lab
kubectl get pods -n monitoring
```

Verificar servicios:

```bash
kubectl get svc -n devops-lab
kubectl get svc -n monitoring
```

Abrir servicios con Minikube:

```bash
minikube service frontend -n devops-lab --url
minikube service backend -n devops-lab --url
minikube service prometheus -n monitoring --url
minikube service grafana -n monitoring --url
```

---

## 6. Preparar Jenkins

### 6.1 Crear una imagen Jenkins con herramientas necesarias

Crear carpeta:

```bash
mkdir -p jenkins
```

Crear archivo:

```bash
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

Construir imagen:

```bash
docker build -t proyecto-jenkins:local ./jenkins
```

---

### 6.2 Ejecutar Jenkins

```bash
docker volume create jenkins_home
```

```bash
docker run -d \
  --name jenkins \
  --user root \
  --network host \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  proyecto-jenkins:local
```

Abrir Jenkins:

```text
http://localhost:8080
```

Obtener contraseña inicial:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Instalar plugins sugeridos y crear usuario administrador.

---

## 7. Crear Kubeconfig para Jenkins

Generar kubeconfig autocontenido:

```bash
kubectl config view --raw --flatten > /tmp/kubeconfig-jenkins.yaml
```

Verificar que funciona:

```bash
KUBECONFIG=/tmp/kubeconfig-jenkins.yaml kubectl get nodes
```

Debe devolver el nodo de Minikube en estado `Ready`.

---

## 8. Crear Credenciales en Jenkins

Entrar a:

```text
Manage Jenkins
→ Credentials
→ System
→ Global credentials
→ Add Credentials
```

---

### 8.1 Credencial Docker Hub

Crear un token en Docker Hub:

```text
Docker Hub
→ Account Settings
→ Personal Access Tokens
```

En Jenkins cargar:

| Campo    | Valor                  |
| -------- | ---------------------- |
| Kind     | Username with password |
| Username | usuario de Docker Hub  |
| Password | token de Docker Hub    |
| ID       | dockerhub-credentials  |

El ID debe ser exactamente:

```text
dockerhub-credentials
```

---

### 8.2 Credencial Kubernetes

Agregar otra credencial:

| Campo | Valor                        |
| ----- | ---------------------------- |
| Kind  | Secret file                  |
| File  | /tmp/kubeconfig-jenkins.yaml |
| ID    | kubeconfig-minikube          |

El ID debe ser exactamente:

```text
kubeconfig-minikube
```

---

## 9. Crear Job Pipeline en Jenkins

En Jenkins:

```text
New Item
```

Nombre:

```text
proyecto-kubernetes-bryan
```

Tipo:

```text
Pipeline
```

En la configuración:

```text
Pipeline
→ Definition: Pipeline script from SCM
→ SCM: Git
```

Completar:

| Campo            | Valor                                                   |
| ---------------- | ------------------------------------------------------- |
| Repository URL   | https://github.com/AnniaBenitez/proyecto_kubernetes.git |
| Branch Specifier | */bryan-test                                            |
| Script Path      | Jenkinsfile                                             |

Guardar.

---

## 10. Ejecutar Pipeline

En el job:

```text
Build Now
```

Cuando aparezca la aprobación manual:

```text
Despliegue manual obligatorio: aplicar cambios en Kubernetes?
```

Presionar:

```text
Desplegar
```

---

## 11. Verificar Resultado

Ver pods:

```bash
kubectl get pods -A
```

Ver servicios:

```bash
kubectl get svc -A
```

Probar backend:

```bash
kubectl run api-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n devops-lab -- curl -fsS http://backend:3000/health
```

```bash
kubectl run version-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n devops-lab -- curl -fsS http://backend:3000/version
```

Abrir servicios:

```bash
minikube service frontend -n devops-lab
minikube service prometheus -n monitoring
minikube service grafana -n monitoring
```

Credenciales Grafana de demostración:

```text
Usuario: admin
Contraseña: change-me-grafana
```

---

## 12. URLs Publicadas por Jenkins

Si el pipeline finaliza correctamente, Jenkins muestra en consola:

```text
Aplicacion:         http://localhost:30174
Prometheus:         http://localhost:30090
Prometheus targets: http://localhost:30090/targets
Grafana:            http://localhost:30300
kube-state-metrics: http://localhost:30176/metrics
```

---

## 13. Limpieza

Detener Jenkins:

```bash
docker stop jenkins
```

Eliminar Jenkins:

```bash
docker rm jenkins
```

Apagar Minikube:

```bash
minikube stop
```

Eliminar cluster Minikube:

```bash
minikube delete
```

Eliminar recursos Docker no usados:

```bash
docker system prune -a
```

---

## 14. Problemas Comunes

### Jenkins no encuentra npm

Error:

```text
npm: not found
```

Solución:

Usar la imagen Jenkins personalizada de esta guía, que instala:

```text
nodejs
npm
git
docker
kubectl
```

---

### Jenkins no puede acceder a Kubernetes

Error típico:

```text
unable to read client-cert
```

o

```text
connection refused
```

Solución:

Regenerar kubeconfig:

```bash
kubectl config view --raw --flatten > /tmp/kubeconfig-jenkins.yaml
KUBECONFIG=/tmp/kubeconfig-jenkins.yaml kubectl get nodes
```

Luego volver a cargar la credencial `kubeconfig-minikube` en Jenkins.

---

### NodePort ocupado

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

Luego volver a correr el pipeline.

---

### Docker sin espacio

Ver uso:

```bash
docker system df
df -h
```

Limpiar:

```bash
docker system prune -a -f
docker builder prune -a -f
```
