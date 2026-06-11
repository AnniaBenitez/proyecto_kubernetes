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
                bat """
                (
                    echo # BE
                    echo BE_PORT=3000
                    echo DB_HOST=db
                    echo DB_PORT=5433
                    echo DB_USERNAME=postgres
                    echo DB_PASSWORD=postgres
                    echo DB_DATABASE=patients_db
                    echo APP_VERSION=1.0

                    echo # FE
                    echo VITE_API_URL=http://localhost:3000/api
                    echo FE_PORT=3001

                    echo # PROMETHEUS
                    echo PROMETHEUS_PORT=9090

                    echo # GRAFANA
                    echo GRAFANA_PORT=3002
                ) > .env
                """
            }
        }

        stage('Build & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin

                    docker build -t %DOCKER_USER%/fe:%TAG% ./fe
                    docker build -t %DOCKER_USER%/be:%TAG% ./be

                    docker push %DOCKER_USER%/fe:%TAG%
                    docker push %DOCKER_USER%/be:%TAG%
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                bat """
                docker-compose build
                set COMPOSE_PROJECT_NAME=devops_%BUILD_NUMBER%
                docker-compose up -d
                """
            }
        }

        stage('Wait for Backend') {
            steps {
                bat """
                echo Waiting backend...
                set /a count=0

                :loop
                curl -f http://localhost:%BE_PORT%/health
                if %errorlevel%==0 exit /b 0

                timeout /t 3 >nul
                set /a count+=1
                if %count% lss 20 goto loop

                exit /b 1
                """
            }
        }

        stage('Verify Prometheus') {
            steps {
                bat """
                curl -f http://localhost:%PROMETHEUS_PORT%/-/healthy
                """
            }
        }

        stage('Verify Grafana') {
            steps {
                bat """
                curl -f http://localhost:%GRAFANA_PORT%/api/health
                """
            }
        }

    }

    post {
        always {
            bat "docker-compose logs --tail=50"
        }
        failure {
            bat "docker-compose down"
        }
    }
}