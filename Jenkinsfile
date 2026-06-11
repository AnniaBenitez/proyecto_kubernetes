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

        stage('Create .env') {
            steps {
                sh '''
                cat > .env <<EOF
                # BE
                BE_PORT=3000
                DB_HOST=db
                DB_PORT=5432
                DB_USERNAME=postgres
                DB_PASSWORD=postgres
                DB_DATABASE=patients_db
                APP_VERSION=1.0

                # FE
                VITE_API_URL=http://localhost:3000/api
                FE_PORT=3001

                # PROMETHEUS
                PROMETHEUS_PORT=9090

                # GRAFANA
                GRAFANA_PORT=3002
                EOF
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

            docker build -t $DOCKER_USER/fe:$TAG ./fe
            docker build -t $DOCKER_USER/be:$TAG ./be
            
            docker push $DOCKER_USER/fe:$TAG
            docker push $DOCKER_USER/be:$TAG
            '''
        }
    }
}

        stage('Deploy') {
            steps {
                sh 'docker-compose build'
                sh 'COMPOSE_PROJECT_NAME=devops_${BUILD_NUMBER} docker-compose up -d'
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