pipeline {
    agent any
    environment {
        TAG = "${BUILD_NUMBER}.0"
    }
    stages {
        stage('Clonar repositorio') {
            steps {
                checkout scm
            }
        }
        stage('Build & Push') {
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

                    bat 'docker build -t %DOCKER_USER%/be:%TAG% ./be'
                    bat 'docker build -t %DOCKER_USER%/fe:%TAG% ./fe'
                    bat 'docker push %DOCKER_USER%/be:%TAG%'
                    bat 'docker push %DOCKER_USER%/fe:%TAG%'
                }
            }
        }
        stage('Deploy en Kubernetes') {
            steps {
                input message: '¿Desplegar en Kubernetes?', ok: 'Desplegar'

                bat 'kubectl apply -f k8s/'
                bat 'kubectl rollout restart deployment/backend -n devops-lab'
                bat 'kubectl rollout restart deployment/frontend -n devops-lab'
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