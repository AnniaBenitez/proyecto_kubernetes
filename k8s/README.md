# Despliegue en Kubernetes (Minikube)

## 1) Construir y cargar imagenes

Usa estos nombres de imagen para que coincidan con los manifiestos:

```bash
docker build -t patient-backend:latest ./be
docker build -t patient-frontend:latest ./fe
minikube image load patient-backend:latest
minikube image load patient-frontend:latest
```

Importante para frontend: antes de construir, usa `VITE_API_URL=http://localhost:3000/api` en `fe/.env`.

## 2) Aplicar manifiestos

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend.yaml
```

## 3) Verificacion

```bash
kubectl get pods -n devops-lab
kubectl get svc -n devops-lab
kubectl get deploy -n devops-lab
```

## 4) Port Fordwarding

```bash
kubectl port-forward svc/backend 3000:3000 -n devops-lab
```

Accesos:

- Frontend: `http://localhost:30173`
- Backend API: `http://localhost:30080/api/patients`

Si Minikube no expone en localhost, usa:

```bash
minikube service frontend -n devops-lab --url
minikube service backend -n devops-lab --url
```

## 4) Escalado y resiliencia

```bash
kubectl scale deployment backend -n devops-lab --replicas=3
kubectl get pods -n devops-lab -l app=backend
kubectl delete pod -n devops-lab -l app=backend --field-selector=status.phase=Running
kubectl get pods -n devops-lab -l app=backend -w
```
