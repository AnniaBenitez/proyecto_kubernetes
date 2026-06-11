pipeline {
    agent any

    environment {
        TAG = "${env.GIT_COMMIT.take(7)}"
        BE_PORT = "3000"
        FE_PORT = "3001"
        PROMETHEUS_PORT = "9090"
        GRAFANA_PORT = "3002"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Load ENV') {
            steps {
                script {
                    def props = readFile('.env').split('\n')
                    props.each { line ->
                        if (line && !line.startsWith('#')) {
                            def (key, value) = line.tokenize('=')
                            env."${key}" = value
                        }
                    }
                }
            }
        }

        stage('Wait for Backend') {
            steps {
                sh '''
                echo "Waiting backend..."
                for i in {1..20}; do
                  curl -f http://localhost:${BE_PORT}/health && exit 0
                  sleep 3
                done
                exit 1
                '''
            }
        }

        stage('Verify Prometheus') {
            steps {
                sh '''
                curl -f http://localhost:${PROMETHEUS_PORT}/-/healthy
                '''
            }
        }

        stage('Verify Grafana') {
            steps {
                sh '''
                curl -f http://localhost:${GRAFANA_PORT}/api/health
                '''
            }
        }

        stage('Build & Push') {
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-credentials',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {

            sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

            docker build -t $DOCKER_USER/be:$TAG ./be
            docker build -t $DOCKER_USER/fe:$TAG ./fe

            docker push $DOCKER_USER/be:$TAG
            docker push $DOCKER_USER/fe:$TAG
            '''
        }
    }
}

        stage('Deploy') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            sh 'docker-compose logs --tail=50'
        }
        failure {
            sh 'docker-compose down'
        }
    }
}