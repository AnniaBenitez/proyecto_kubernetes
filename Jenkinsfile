pipeline {
    agent any

    environment {
        TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'cd be && npm ci && npm run build'
                sh 'cd fe && npm ci && npm run build'
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                    docker build -t "$DOCKER_USER/patient-backend:$TAG" ./be
                    docker build -t "$DOCKER_USER/patient-frontend:$TAG" ./fe

                    docker push "$DOCKER_USER/patient-backend:$TAG"
                    docker push "$DOCKER_USER/patient-frontend:$TAG"
                    '''
                }
            }
        }

        stage('Deploy en Kubernetes') {
            steps {
                sh '''
                kubectl apply -f k8s/
                kubectl rollout status deployment/backend -n devops-lab --timeout=120s
                kubectl rollout status deployment/frontend -n devops-lab --timeout=120s
                kubectl rollout status deployment/prometheus -n devops-lab --timeout=120s
                kubectl rollout status deployment/grafana -n devops-lab --timeout=120s
                '''
            }
        }

        stage('Validación') {
            steps {
                sh '''
                kubectl get pods -n devops-lab
                kubectl get svc -n devops-lab
                kubectl wait --for=condition=ready pod -l app=backend -n devops-lab --timeout=120s
                kubectl wait --for=condition=ready pod -l app=frontend -n devops-lab --timeout=120s
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline finalizado correctamente: imágenes publicadas y aplicación desplegada en Kubernetes.'
        }
        failure {
            echo 'El pipeline falló. Revisar logs de Jenkins.'
        }
    }
}
