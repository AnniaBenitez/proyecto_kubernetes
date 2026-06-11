pipeline {
    agent any

    environment {
        TAG = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

       stage('Build') {
            steps {
                echo 'Build de frontend y backend se ejecuta dentro de los Dockerfile.'
	    }
	}

        stage('Docker Build') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE_BACKEND ./be'
                sh 'docker build -t $DOCKER_IMAGE_FRONTEND ./fe'
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    docker push "$DOCKER_IMAGE_BACKEND"
                    docker push "$DOCKER_IMAGE_FRONTEND"
                    '''
                }
            }
        }

        stage('Deploy en Kubernetes') {
            steps {
                input message: '¿Desplegar en Kubernetes?', ok: 'Desplegar'

                sh '''
                kubectl apply -f k8s/
                kubectl rollout restart deployment/backend -n devops-lab
                kubectl rollout restart deployment/frontend -n devops-lab
                kubectl rollout status deployment/backend -n devops-lab --timeout=300s
                kubectl rollout status deployment/frontend -n devops-lab --timeout=300s
                '''
            }
        }

        stage('Validación') {
            steps {
                sh '''
                kubectl get pods -n devops-lab
                kubectl get svc -n devops-lab
                kubectl wait --for=condition=available deployment/backend -n devops-lab --timeout=120s
                kubectl wait --for=condition=available deployment/frontend -n devops-lab --timeout=120s
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline finalizado correctamente.'
        }
        failure {
            echo 'El pipeline falló. Revisar logs de Jenkins.'
        }
    }
}