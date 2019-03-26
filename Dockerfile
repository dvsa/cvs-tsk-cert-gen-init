FROM node:latest
RUN mkdir -p /usr/src/cvs-tsk-cert-gen-init
WORKDIR /usr/src/cvs-tsk-cert-gen-init

# Copy source & tests
COPY src /usr/src/cvs-tsk-cert-gen-init/src
COPY tests/resources /usr/src/cvs-tsk-cert-gen-init/tests/resources

# Copy configuration & npm files
COPY tsconfig.json /usr/src/cvs-tsk-cert-gen-init
COPY tslint.json /usr/src/cvs-tsk-cert-gen-init
COPY serverless.yml /usr/src/cvs-tsk-cert-gen-init
COPY src/config /usr/src/cvs-tsk-cert-gen-init/.build/src/config
COPY package.json /usr/src/cvs-tsk-cert-gen-init
COPY package-lock.json /usr/src/cvs-tsk-cert-gen-init

# Install dependencies
RUN npm install

## Script from the web to wait for SQS to start up
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

## Run the wait script until SQS is up
CMD /wait && npm start
