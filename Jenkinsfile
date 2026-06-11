pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Iniciar Minikube') {
            steps {
                bat 'minikube delete'
                bat 'minikube start'
                bat 'minikube status'
            }
        }
        stage('Build & Cargar en Minikube') {
            steps {
                bat 'docker build -t patient-backend:latest ./be'
                bat 'docker build -t patient-frontend:latest ./fe'
                bat 'minikube image load patient-backend:latest'
                bat 'minikube image load patient-frontend:latest'
            }
        }
        stage('Deploy en Kubernetes') {
            steps {
                input message: '¿Desplegar en Kubernetes?', ok: 'Desplegar'

                bat 'kubectl apply -f k8s/'
                bat 'kubectl rollout status deployment/backend -n devops-lab --timeout=120s'
                bat 'kubectl rollout status deployment/frontend -n devops-lab --timeout=120s'
            }
        }
        stage('Validación') {
            steps {
                bat 'kubectl get pods -n devops-lab'
                bat 'kubectl get svc -n devops-lab'
                bat 'kubectl wait --for=condition=ready pod -l app=backend -n devops-lab --timeout=120s'
                bat 'kubectl wait --for=condition=ready pod -l app=frontend -n devops-lab --timeout=120s'
            }
        }
        stage('URLs de acceso') {
            steps {
                bat 'start /B minikube service backend -n devops-lab --url'
                bat 'start /B minikube service frontend -n devops-lab --url'
                bat 'start /B minikube service grafana -n devops-lab --url'
                bat 'echo Tunnels iniciados en background. Usa "taskkill /F /IM minikube.exe" para detenerlos.'
            }
        }
    }
    post {
        success {
            echo 'Pipeline finalizado correctamente. Imagenes construidas, cargadas en minikube y desplegadas.'
        }
        failure {
            echo 'El pipeline fallo. Revisar logs de Jenkins.'
        }
    }
}
