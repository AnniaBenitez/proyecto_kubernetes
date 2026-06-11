pipeline {
    agent any

    environment {
        TAG = "${BUILD_NUMBER}"
        K8S_NAMESPACE = 'devops-lab'
        FRONTEND_LOCAL_PORT = '30174'
        FRONTEND_URL = 'http://localhost:30174'
        PROMETHEUS_URL = 'http://localhost:30090'
        GRAFANA_URL = 'http://localhost:30300'
        KUBE_STATE_METRICS_URL = 'http://localhost:30176/metrics'
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
                                kubectl get deployment/backend -n "$K8S_NAMESPACE" >/dev/null 2>&1 && \
                                    kubectl set env deployment/backend APP_VERSION- NODE_ENV- -n "$K8S_NAMESPACE" || true
                                kubectl apply -f k8s/
                                kubectl set image deployment/backend backend="$DOCKER_USER/patient-backend:$TAG" -n "$K8S_NAMESPACE"
                                kubectl set image deployment/frontend frontend="$DOCKER_USER/patient-frontend:$TAG" -n "$K8S_NAMESPACE"
                                kubectl create configmap backend-config -n "$K8S_NAMESPACE" \
                                    --from-literal=PORT=3000 \
                                    --from-literal=DB_HOST=postgres \
                                    --from-literal=DB_PORT=5432 \
                                    --from-literal=DB_DATABASE=patients_db \
                                    --from-literal=APP_VERSION="$TAG" \
                                    --from-literal=NODE_ENV=production \
                                    --dry-run=client -o yaml | kubectl apply -f -
                                kubectl rollout restart deployment/backend -n "$K8S_NAMESPACE"
                            '''
                        } else {
                            bat '''
                                @echo off
                                set "KUBECONFIG=%KUBECONFIG_FILE%"
                                kubectl cluster-info || exit /b 1
                                kubectl get deployment/backend -n %K8S_NAMESPACE% >nul 2>&1 && kubectl set env deployment/backend APP_VERSION- NODE_ENV- -n %K8S_NAMESPACE% >nul
                                kubectl apply -f k8s/ || exit /b 1
                                kubectl set image deployment/backend backend=%DOCKER_USER%/patient-backend:%TAG% -n %K8S_NAMESPACE% || exit /b 1
                                kubectl set image deployment/frontend frontend=%DOCKER_USER%/patient-frontend:%TAG% -n %K8S_NAMESPACE% || exit /b 1
                                kubectl create configmap backend-config -n %K8S_NAMESPACE% --from-literal=PORT=3000 --from-literal=DB_HOST=postgres --from-literal=DB_PORT=5432 --from-literal=DB_DATABASE=patients_db --from-literal=APP_VERSION=%TAG% --from-literal=NODE_ENV=production --dry-run=client -o yaml | kubectl apply -f - || exit /b 1
                                kubectl rollout restart deployment/backend -n %K8S_NAMESPACE% || exit /b 1
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

        stage('Stage 8 - Publicar accesos locales') {
            steps {
                withCredentials([file(
                    credentialsId: 'kubeconfig-minikube',
                    variable: 'KUBECONFIG_FILE'
                )]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                export KUBECONFIG="$KUBECONFIG_FILE"
                                export JENKINS_NODE_COOKIE=devops-port-forwards
                                pkill -f "kubectl port-forward.*service/frontend.*30174" || true
                                pkill -f "kubectl port-forward.*service/prometheus.*30090" || true
                                pkill -f "kubectl port-forward.*service/grafana.*30300" || true
                                pkill -f "kubectl port-forward.*service/kube-state-metrics.*30176" || true
                                nohup kubectl port-forward -n "$K8S_NAMESPACE" service/frontend "$FRONTEND_LOCAL_PORT:5173" --address 127.0.0.1 >/tmp/frontend-port-forward.log 2>&1 &
                                nohup kubectl port-forward -n monitoring service/prometheus 30090:9090 --address 127.0.0.1 >/tmp/prometheus-port-forward.log 2>&1 &
                                nohup kubectl port-forward -n monitoring service/grafana 30300:3000 --address 127.0.0.1 >/tmp/grafana-port-forward.log 2>&1 &
                                nohup kubectl port-forward -n monitoring service/kube-state-metrics 30176:8080 --address 127.0.0.1 >/tmp/kube-state-metrics-port-forward.log 2>&1 &
                                sleep 3
                                curl -fsS "$FRONTEND_URL" >/dev/null
                                curl -fsS "$PROMETHEUS_URL/-/ready" >/dev/null
                                curl -fsS "$GRAFANA_URL/api/health" >/dev/null
                                curl -fsS "$KUBE_STATE_METRICS_URL" >/dev/null
                                echo "Aplicacion:         $FRONTEND_URL"
                                echo "Prometheus:         $PROMETHEUS_URL"
                                echo "Prometheus targets: $PROMETHEUS_URL/targets"
                                echo "Grafana:            $GRAFANA_URL"
                                echo "kube-state-metrics: $KUBE_STATE_METRICS_URL"
                            '''
                        } else {
                            bat '''
                                @echo off
                                powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\\iniciar-accesos-locales.ps1 -Kubeconfig "%KUBECONFIG_FILE%" || exit /b 1
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
            echo "Aplicacion: ${FRONTEND_URL}"
            echo "Prometheus: ${PROMETHEUS_URL}"
            echo "Grafana: ${GRAFANA_URL}"
            echo "kube-state-metrics: ${KUBE_STATE_METRICS_URL}"
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
