# Patient Management System - DevOps Task

Sistema de gestion de pacientes con frontend en React + Vite y backend en Node.js + Express + TypeORM, usando PostgreSQL como base de datos y Caddy como reverse proxy.

## Estructura

```
.
├── be/          # Backend API (Node.js + Express + TypeORM)
│   ├── Dockerfile
│   ├── .env.example
│   └── ...
├── fe/          # Frontend (React + Vite)
│   ├── Dockerfile
│   ├── .env.example
│   └── ...
├── caddy/       # Reverse Proxy
│   ├── Dockerfile
│   └── Caddyfile
└── docker-compose.yml
```

## Prerequisitos

- Docker
- Docker Compose

## Configuracion

1. Crear archivos `.env` basados en los ejemplos:

```bash
cp be/.env.example be/.env
cp fe/.env.example fe/.env
```

2. Editar las variables de entorno si es necesario (credenciales de base de datos, etc.)

## Levantar los servicios

Para construir las imagenes y levantar todos los servicios:

```bash
docker-compose up --build
```

Para correr en segundo plano:

```bash
docker-compose up -d --build
```

## Servicios y Puertos

| Servicio  | Puerto | Descripcion                    |
|-----------|--------|--------------------------------|
| Caddy     | 80     | Reverse proxy (entrada unica)  |
| Frontend  | 5173   | App React (via Caddy)          |
| Backend   | 3000   | API REST (via Caddy /api)      |
| PostgreSQL| 5432   | Base de datos                  |

## Accesos

- **Frontend**: http://localhost
- **API**: http://localhost/api

## Comandos utiles

Ver logs:
```bash
docker-compose logs -f
```

Detener servicios:
```bash
docker-compose down
```

Reconstruir un servicio especifico:
```bash
docker-compose up -d --build backend
```

Eliminar volumenes (borra datos de DB):
```bash
docker-compose down -v
```
