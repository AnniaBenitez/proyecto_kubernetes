pipeline {
    agent any

    stages {
        stage('Clonar repositorio') {
            steps {
                echo 'Obteniendo codigo fuente...'
            }
        }

        stage('Construir imagen Backend') {
            steps {
                echo 'Building backend...'
                bat 'docker build -t %BACKEND_IMAGE%:%TAG% ./be'
                echo 'Backend built successfully...'
            }
        }

        stage('Construir imagen Frontend') {
            steps {
                echo 'Building frontend...'
                bat 'docker build -t %FRONTEND_IMAGE%:%TAG% ./fe'
                echo 'Frontend built successfully...'
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
