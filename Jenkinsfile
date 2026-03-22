// Jenkins Declarative — FE socialTTVV
// Monorepo: workspace có UI/socialTTVV/package.json → chạy trong đó; không thì coi root là FE.

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds(abortPrevious: true)
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Detect project dir') {
      steps {
        script {
          env.PROJECT_DIR = fileExists('UI/socialTTVV/package.json') ? 'UI/socialTTVV' : '.'
          echo "PROJECT_DIR=${env.PROJECT_DIR}"
        }
      }
    }

    stage('Install') {
      steps {
        dir("${env.PROJECT_DIR}") {
          sh 'node -v && npm -v'
          sh 'npm ci'
        }
      }
    }

    stage('Lint') {
      steps {
        dir("${env.PROJECT_DIR}") {
          sh 'npm run lint'
        }
      }
    }

    stage('Test') {
      steps {
        dir("${env.PROJECT_DIR}") {
          sh 'npm run test'
        }
      }
    }

    stage('Build') {
      steps {
        dir("${env.PROJECT_DIR}") {
          sh 'npm run build'
        }
      }
    }
  }

  post {
    success {
      echo 'socialTTVV: lint + test + build OK'
    }
    failure {
      echo 'Pipeline failed — xem log từng stage'
    }
  }
}
