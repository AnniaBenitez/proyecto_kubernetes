# Manifiestos Kubernetes

Orden de aplicacion:

```bash
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-postgres.yaml
kubectl apply -f 02-backend.yaml
kubectl apply -f 03-frontend.yaml
kubectl apply -f 04-monitoring.yaml
```

Tambien se puede usar:

```bash
kubectl apply -f .
```

Verificacion:

```bash
kubectl get all -n devops-lab
kubectl get all -n monitoring
kubectl get pvc -n devops-lab
kubectl get configmap,secret -n devops-lab
```

Prueba interna de la API:

```bash
kubectl run curl-test --rm -it --restart=Never \
  --image=curlimages/curl:8.11.1 -n devops-lab \
  -- curl -fsS http://backend:3000/health
```
