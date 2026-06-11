pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Load Secrets') {
            steps {
                withCredentials([file(
                    credentialsId: 'devops-env-file',
                    variable: 'ENV_FILE'
                )]) {
                    bat '''
                    copy "%ENV_FILE%" .env
                    '''
                }
            }
        }

        stage('Load Config') {
            steps {
                script {
                    def envFile = readFile('.env')
                    def props = [:]

                    envFile.split('\n').each { line ->
                        line = line.trim()
                        if (!line || line.startsWith('#') || !line.contains('=')) return

                        def (key, value) = line.split('=', 2)
                        props[key.trim()] = value.trim()
                    }

                    env.BE_PORT = props['BE_PORT']
                    env.FE_PORT = props['FE_PORT']
                    env.PROMETHEUS_PORT = props['PROMETHEUS_PORT']
                    env.GRAFANA_PORT = props['GRAFANA_PORT']

                    env.TAG = env.GIT_COMMIT?.take(7) ?: 'latest'
                }
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

        stage("Show Services"){
            steps {
                script {
                    echo "Backend: http://localhost:${env.BE_PORT}"
                    echo "Frontend: http://localhost:${env.FE_PORT}"
                    echo "Prometheus: http://localhost:${env.PROMETHEUS_PORT}"
                    echo "Grafana: http://localhost:${env.GRAFANA_PORT}"
                }
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