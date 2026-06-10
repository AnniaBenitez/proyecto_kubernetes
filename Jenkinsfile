pipeline {
    agent any
    environment {
        TAG = 'latest'
    }
    stages {
        stage('Clonar repositorio') {
            steps { echo 'Obteniendo codigo fuente...' }
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
    }
    post {
        success {
            echo 'Pipeline finalizado correctamente. Imagenes publicadas en Docker Hub'
        }
        failure {
            echo 'El pipeline fallo. Revisar logs de Jenkins.'
        }
    }
}