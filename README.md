# cvs-tsk-cert-gen-init

## Introduction

The cert gen service is a lambda which is used to marshall data before cert gen service task generates the test certificates when tests are submitted.

## Dependencies

The project runs on node >10 with typescript and serverless framework. For further details about project dependencies, please refer to the `package.json` file.
[nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) is used to managed node versions and configuration explicitly done per project using an `.npmrc` file.

### Prerequisites

Please install and run the following securiy programs as part of your development process:

- [git-secrets](https://github.com/awslabs/git-secrets)
  After installing, do a one-time set up with `git secrets --register-aws`. Run with `git secrets --scan`.

These will be run as part of your projects hooks so you don't accidentally introduce any new security vulnerabilities.

You will also require Docker to run the service locally if you wish to mock external dependencies.

## Architecture

### End to end design

[All in one view](https://wiki.dvsacloud.uk/pages/viewpage.action?pageId=79254695)

### cert gen microservice

More information about technical designs can be found under the [cert gen](https://wiki.dvsacloud.uk/display/HVT/Certificate+Generation+Design) section.

## Getting started

Set up your nodejs environment running `nvm use` and once the dependencies are installed using `npm i`, you can run the scripts from `package.json` to build your project.
This code repository uses [serverless framework](https://www.serverless.com/framework/docs/) to mock AWS capabilities for local development.

### Environmental variables

- The `BRANCH` environment variable indicates in which environment is this application running. Not setting this variable will result in defaulting to `local`.

### Scripts

- Building without source maps - `npm run build`
- Building with source maps - `npm run build:dev`
- Building the docker containers - `npm run build:docker`

### Running

The app can be started by running `npm run start:docker`.

### Configuration

The configuration file can be found under `src/config/config.yml`.
Environment variable injection is possible with the syntax:
`${BRANCH}`, or you can specify a default value: `${BRANCH:local}`.

#### SQS

SQS contains configuration for the local environment or the AWS environment. Locally, you need to provide the `localhost` region and the SQS endpoint, which in this case is the address of a docker image. `apiVersion` and `queueName` need to be provided for both environments.

```yml
sqs:
  local:
    params:
      region: localhost
      endpoint: http://sqs:9324
      apiVersion: "2012-11-05"
    queueName: cert-gen-q
  remote:
    params:
      apiVersion: "2012-11-05"
    queueName: cert-gen-q
```

### Debugging

The following environmental variables can be given to your serverless scripts to trace and debug your service:

```shell
AWS_XRAY_CONTEXT_MISSING = LOG_ERROR
SLS_DEBUG = *
BRANCH = local
```

## Testing

### Unit testing

In order to test, you need to run the following:

```sh
npm run test # unit tests
```

### End to end

- [Automation test repository](https://github.com/dvsa/cvs-auto-svc)
- [Java](https://docs.oracle.com/en/java/javase/11/)
- [Serenity Cucumber with Junit](https://serenity-bdd.github.io/theserenitybook/latest/junit-basic.html)

## Infrastructure

We follow a [gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) approach for development.
For the CI/CD and automation please refer to the following pages for further details:

- [Development process](https://wiki.dvsacloud.uk/display/HVT/CVS+Pipeline+Infrastructure)
- [Pipeline](https://wiki.dvsacloud.uk/pages/viewpage.action?pageId=36870584)

## Contributing

Please familiarise yourself with [commitlint](https://commitlint.js.org/#/) and [conventional commits conventions](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) as a hook is in place to enforce standards.

### Hooks and code standards

The projects has multiple hooks configured using [husky](https://github.com/typicode/husky#readme) which will execute the following scripts: `security-checks`, `audit`, `tslint`, `prepush`.
The codebase uses [typescript clean code standards](https://github.com/labs42io/clean-code-typescript) as well as sonarqube for static analysis.

SonarQube is available locally, please follow the instructions below if you wish to run the service locally (brew is the preferred approach).

### Static code analysis

_Brew_ (recommended):

- Install sonarqube using brew
- Change `sonar.host.url` to point to localhost, by default, sonar runs on `http://localhost:9000`
- run the sonar server `sonar start`, then perform your analysis `npm run sonar-scanner`

_Manual_:

- [Download sonarqube](https://www.sonarqube.org/downloads/)
- Add sonar-scanner in environment variables in your profile file add the line: `export PATH=<PATH_TO_SONAR_SCANNER>/sonar-scanner-3.3.0.1492-macosx/bin:$PATH`
- Start the SonarQube server: `cd <PATH_TO_SONARQUBE_SERVER>/bin/macosx-universal-64 ./sonar.sh start`
- In the microservice folder run the command: `npm run sonar-scanner`
