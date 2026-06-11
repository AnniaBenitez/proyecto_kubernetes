# Patient Management System - DevOps Task

Sistema de gestión de pacientes con arquitectura full-stack containerizada usando Docker.

## Arquitectura

- **Frontend**: React 19 + Vite + TypeScript + TanStack React Query
- **Backend**: Node.js + Express + TypeORM + PostgreSQL
- **Reverse Proxy**: Caddy 2
- **Base de datos**: PostgreSQL 15

## Estructura del Proyecto

```
.
├── be/                          # Backend API
│   ├── src/
│   │   ├── controllers/         # Controladores (PatientController)
│   │   ├── entities/            # Entidades TypeORM (Patient)
│   │   ├── services/            # Lógica de negocio (PatientService)
│   │   ├── middlewares/         # Middlewares (validación)
│   │   ├── schemas/             # Esquemas de validación (Zod)
│   │   ├── config/              # Configuración (dataSource)
│   │   └── index.ts             # Entry point
│   ├── Dockerfile               # Multi-stage build
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── fe/                          # Frontend React
│   ├── src/
│   │   ├── components/          # Componentes (PatientForm, PatientTable)
│   │   ├── hooks/               # Custom hooks (usePatients)
│   │   ├── api/                 # Cliente API (patientApi)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile               # Multi-stage build
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── Caddyfile                    # Configuración de Caddy reverse proxy
├── docker-compose.yml           # Orquestación de servicios
├── .env.example                 # Variables de entorno globales
└── .gitignore
```

## Prerequisitos

- Docker
- Docker Compose

## Configuración

### 1. Variables de Entorno

Crear archivos `.env` basados en los ejemplos:

```bash
cp .env.example .env
cp be/.env.example be/.env
cp fe/.env.example fe/.env
```

### 2. Variables Disponibles

**`.env` (global)**:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=patients_db
PORT=3000
```

**`be/.env` (backend)**:
```
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=patients_db
```

**`fe/.env` (frontend)**:
```
VITE_API_URL=/api
```

## Levantar los Servicios

### Desarrollo/Producción con Docker

Construir y levantar todos los servicios:

```bash
docker-compose up --build
```

En segundo plano:

```bash
docker-compose up -d --build
```

## Servicios y Puertos

| Servicio    | Puerto Interno | Puerto Externo | Descripción                          |
|-------------|----------------|----------------|--------------------------------------|
| Caddy       | 80             | 80, 443        | Reverse proxy (entrada única)        |
| Frontend    | 5173           | 5173           | App React (build servido por Caddy)  |
| Backend     | 3000           | 3000           | API REST (vía Caddy en /api)         |
| PostgreSQL  | 5432           | 5432           | Base de datos                        |

**Nota**: El Caddyfile actual está configurado para escuchar en el puerto 8081. Para que funcione correctamente con docker-compose, debe cambiarse a puerto 80 o actualizar el mapeo de puertos en docker-compose.yml.

## Accesos

- **Frontend**: http://localhost:8081 (vía Caddy)
- **API**: http://localhost:8081/api (vía Caddy reverse proxy)
- **API directa**: http://localhost:3000 (solo para desarrollo/debug)

## Características Técnicas

### Backend
- TypeScript con decoradores (TypeORM)
- Validación con Zod
- Arquitectura en capas (controllers, services, entities)
- CORS habilitado
- Conexión a PostgreSQL con TypeORM

### Frontend
- React 19 con TypeScript
- Vite como build tool
- TanStack React Query para estado del servidor
- Axios para peticiones HTTP
- Componentes modulares

### Docker
- Multi-stage builds para reducir tamaño de imágenes
- Usuario no-root en contenedores
- Healthcheck en PostgreSQL
- Volúmenes persistentes para datos y configuración de Caddy

## Comandos Útiles

Ver logs de todos los servicios:
```bash
docker-compose logs -f
```

Ver logs de un servicio específico:
```bash
docker-compose logs -f backend
```

Detener servicios:
```bash
docker-compose down
```

Reconstruir un servicio específico:
```bash
docker-compose up -d --build backend
```

Eliminar volúmenes (borra datos de DB):
```bash
docker-compose down -v
```

Acceder a la base de datos:
```bash
docker-compose exec db psql -U postgres -d patients_db
```

## Volúmenes

- `postgres_data`: Datos persistentes de PostgreSQL
- `caddy_data`: Certificados SSL de Caddy
- `caddy_config`: Configuración de Caddy

## .gitignore

# Despliegue en Kubernetes (Minikube)

## Prerrequisitos

* Docker
* Minikube
* kubectl

## Iniciar Minikube

```bash
minikube start --driver=docker
```

Verificar que el nodo esté disponible:

```bash
kubectl get nodes
```

## Aplicar los manifiestos

```bash
kubectl apply -f k8s/
```

Verificar el estado de los pods:

```bash
kubectl get pods -n devops-lab
```

Todos los pods deben aparecer en estado `Running`.

## Acceso a los servicios

### Frontend (vía Caddy)

```bash
minikube service caddy -n devops-lab --url
```

### Backend

```bash
minikube service backend -n devops-lab --url
```

### Prometheus

```bash
minikube service prometheus -n devops-lab --url
```

### Grafana

```bash
minikube service grafana -n devops-lab --url
```

## Verificación de la API

Health Check:

```bash
curl <BACKEND_URL>/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "backend"
}
```

Versión:

```bash
curl <BACKEND_URL>/api/version
```

Respuesta esperada:

```json
{
  "version": "1.0.0",
  "service": "patient-management-api"
}
```

# Jenkins CI/CD

## Construcción de la imagen Jenkins

```bash
docker build -t proyecto-jenkins:local ./jenkins
```

## Ejecución de Jenkins

```bash
docker run -d \
  --name jenkins \
  --user root \
  --network host \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/.kube:/root/.kube \
  -v $HOME/.minikube:/root/.minikube \
  proyecto-jenkins:local
```

Acceso:

```text
http://localhost:8080
```

## Configuración de Docker Hub

Crear una credencial de tipo:

```text
Username with password
```

Con los siguientes valores:

```text
ID: dockerhub-credentials
Username: <usuario Docker Hub>
Password: <Personal Access Token>
```

## Pipeline

El pipeline automatiza:

1. Obtención del código fuente desde GitHub.
2. Construcción de imágenes Docker.
3. Publicación de imágenes en Docker Hub.
4. Despliegue en Kubernetes.
5. Validación del despliegue.

## Arquitectura

```text
Frontend (React)
        │
        ▼
      Caddy
        │
 ┌──────┴──────┐
 ▼             ▼
Frontend     Backend
                 │
                 ▼
            PostgreSQL

Prometheus + Grafana
Jenkins CI/CD
Kubernetes (Minikube)
```


El proyecto ignora:
- `dist/` (builds)
- `node_modules/`
- `.env` (archivos con secretos)
