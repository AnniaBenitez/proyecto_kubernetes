pipeline {
    agent any

    environment {
        TAG = "${BUILD_NUMBER}"
        K8S_NAMESPACE = 'devops-lab'
    }

    stages {
        stage('Stage 1 - Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Stage 2 - Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('be') {
                            script {
                                if (isUnix()) {
                                    sh 'npm ci && npm run build'
                                } else {
                                    bat 'npm ci && npm run build'
                                }
                            }
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('fe') {
                            script {
                                if (isUnix()) {
                                    sh 'npm ci && npm run lint && npm run build'
                                } else {
                                    bat 'npm ci && npm run lint && npm run build'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Stage 3 - Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                docker build -t "$DOCKER_USER/patient-backend:$TAG" -t "$DOCKER_USER/patient-backend:latest" ./be
                                docker build -t "$DOCKER_USER/patient-frontend:$TAG" -t "$DOCKER_USER/patient-frontend:latest" ./fe
                            '''
                        } else {
                            bat '''
                                docker build -t %DOCKER_USER%/patient-backend:%TAG% -t %DOCKER_USER%/patient-backend:latest ./be
                                docker build -t %DOCKER_USER%/patient-frontend:%TAG% -t %DOCKER_USER%/patient-frontend:latest ./fe
                            '''
                        }
                    }
                }
            }
        }

        stage('Stage 4 - Push de imagen') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        if (isUnix()) {
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                            sh '''
                                docker push "$DOCKER_USER/patient-backend:$TAG"
                                docker push "$DOCKER_USER/patient-frontend:$TAG"
                                docker push "$DOCKER_USER/patient-backend:latest"
                                docker push "$DOCKER_USER/patient-frontend:latest"
                            '''
                        } else {
                            bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                            bat '''
                                docker push %DOCKER_USER%/patient-backend:%TAG%
                                docker push %DOCKER_USER%/patient-frontend:%TAG%
                                docker push %DOCKER_USER%/patient-backend:latest
                                docker push %DOCKER_USER%/patient-frontend:latest
                            '''
                        }
                    }
                }
            }
        }

        stage('Stage 5 - Deploy en Kubernetes') {
            steps {
                input message: 'Despliegue manual obligatorio: aplicar cambios en Kubernetes?', ok: 'Desplegar'
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    ),
                    file(
                        credentialsId: 'kubeconfig-minikube',
                        variable: 'KUBECONFIG_FILE'
                    )
                ]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                set -e
                                export KUBECONFIG="$KUBECONFIG_FILE"
                                kubectl cluster-info
                                kubectl apply -f k8s/
                                kubectl set image deployment/backend backend="$DOCKER_USER/patient-backend:$TAG" -n "$K8S_NAMESPACE"
                                kubectl set image deployment/frontend frontend="$DOCKER_USER/patient-frontend:$TAG" -n "$K8S_NAMESPACE"
                                kubectl set env deployment/backend APP_VERSION="$TAG" -n "$K8S_NAMESPACE"
                            '''
                        } else {
                            bat '''
                                @echo off
                                set "KUBECONFIG=%KUBECONFIG_FILE%"
                                kubectl cluster-info || exit /b 1
                                kubectl apply -f k8s/ || exit /b 1
                                kubectl set image deployment/backend backend=%DOCKER_USER%/patient-backend:%TAG% -n %K8S_NAMESPACE% || exit /b 1
                                kubectl set image deployment/frontend frontend=%DOCKER_USER%/patient-frontend:%TAG% -n %K8S_NAMESPACE% || exit /b 1
                                kubectl set env deployment/backend APP_VERSION=%TAG% -n %K8S_NAMESPACE% || exit /b 1
                            '''
                        }
                    }
                }
            }
        }

        stage('Stage 7 - Validacion') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig-minikube',
                    variable: 'KUBECONFIG_FILE'
                )]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                set -e
                                export KUBECONFIG="$KUBECONFIG_FILE"
                                kubectl rollout status deployment/postgres -n "$K8S_NAMESPACE" --timeout=180s
                                kubectl rollout status deployment/backend -n "$K8S_NAMESPACE" --timeout=180s
                                kubectl rollout status deployment/frontend -n "$K8S_NAMESPACE" --timeout=180s
                                kubectl rollout status deployment/prometheus -n monitoring --timeout=180s
                                kubectl rollout status deployment/kube-state-metrics -n monitoring --timeout=180s
                                kubectl rollout status deployment/grafana -n monitoring --timeout=180s
                                kubectl wait --for=condition=Ready pod --all -n "$K8S_NAMESPACE" --timeout=180s
                                kubectl get pods -n "$K8S_NAMESPACE" -o wide
                                kubectl get pods -n monitoring -o wide
                                kubectl run api-smoke-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n "$K8S_NAMESPACE" -- curl -fsS http://backend:3000/health
                                kubectl run version-smoke-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n "$K8S_NAMESPACE" -- curl -fsS http://backend:3000/version
                            '''
                        } else {
                            bat '''
                                @echo off
                                set "KUBECONFIG=%KUBECONFIG_FILE%"
                                kubectl rollout status deployment/postgres -n %K8S_NAMESPACE% --timeout=180s || exit /b 1
                                kubectl rollout status deployment/backend -n %K8S_NAMESPACE% --timeout=180s || exit /b 1
                                kubectl rollout status deployment/frontend -n %K8S_NAMESPACE% --timeout=180s || exit /b 1
                                kubectl rollout status deployment/prometheus -n monitoring --timeout=180s || exit /b 1
                                kubectl rollout status deployment/kube-state-metrics -n monitoring --timeout=180s || exit /b 1
                                kubectl rollout status deployment/grafana -n monitoring --timeout=180s || exit /b 1
                                kubectl wait --for=condition=Ready pod --all -n %K8S_NAMESPACE% --timeout=180s || exit /b 1
                                kubectl get pods -n %K8S_NAMESPACE% -o wide || exit /b 1
                                kubectl get pods -n monitoring -o wide || exit /b 1
                                kubectl run api-smoke-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n %K8S_NAMESPACE% -- curl -fsS http://backend:3000/health || exit /b 1
                                kubectl run version-smoke-test --rm -i --restart=Never --image=curlimages/curl:8.11.1 -n %K8S_NAMESPACE% -- curl -fsS http://backend:3000/version || exit /b 1
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline finalizado correctamente.'
        }
        failure {
            echo 'El pipeline fallo. Revisar logs de Jenkins, Docker o Kubernetes.'
        }
        always {
            script {
                if (isUnix()) {
                    sh 'docker logout || true'
                } else {
                    bat 'docker logout'
                }
            }
        }
    }
}
