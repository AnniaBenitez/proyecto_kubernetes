pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'sebasbog'
        BACKEND_IMAGE = "${DOCKERHUB_USER}/patient-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/patient-frontend"
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
    }

    post {
        success {
            echo 'Pipeline finalizado correctamente. Imagenes publicadas en Docker Hub.'
        }

        failure {
            echo 'El pipeline fallo. Revisar logs de Jenkins.'
        }
    }
}
