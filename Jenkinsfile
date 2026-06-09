pipeline {
    agent any

    environment {
        TAG = "latest"
    }

    stages {
        stage('Clonar repositorio') {
            steps {
                echo 'Obteniendo codigo fuente...'
            }
        }

        stage('Construir imagen Backend') {
            steps {
                bat 'docker build -t %BACKEND_IMAGE%:%TAG% ./be'
            }
        }

        stage('Construir imagen Frontend') {
            steps {
                bat 'docker build -t %FRONTEND_IMAGE%:%TAG% ./fe'
            }
        }

        stage('Publicar imagenes en Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'

                )]) {
                    bat '''
                    echo %DOCKER_PASS%> dockerpass.txt
                    type dockerpass.txt | docker login -u %DOCKER_USER% --password-stdin
                    del dockerpass.txt
                    '''
                    bat 'docker push %BACKEND_IMAGE%:%TAG%'
                    bat 'docker push %FRONTEND_IMAGE%:%TAG%'
                }
            }
        }

        stage('Desplegar en Kubernetes') {
            steps {
                bat 'kubectl apply -f k8s/00-namespace.yaml'
                bat 'kubectl apply -f k8s/01-postgres.yaml'
                bat 'kubectl apply -f k8s/02-backend.yaml'
                bat 'kubectl apply -f k8s/03-frontend.yaml'
                bat 'kubectl apply -f k8s/04-prometheus.yaml'
                bat 'kubectl apply -f k8s/05-grafana.yaml'
                bat 'kubectl apply -f k8s/06-node-exporter.yaml'
                bat 'kubectl rollout status deployment/backend -n devops-lab --timeout=120s'
                bat 'kubectl rollout status deployment/frontend -n devops-lab --timeout=120s'
                bat 'kubectl rollout status deployment/prometheus -n devops-lab --timeout=120s'
                bat 'kubectl rollout status deployment/grafana -n devops-lab --timeout=120s'
            }
        }
    }

    post {
        success {
            echo 'Pipeline finalizado correctamente. Imagenes publicadas en Docker Hub y desplegadas en Kubernetes.'
        }

        failure {
            echo 'El pipeline fallo. Revisar logs de Jenkins.'
        }
    }
}