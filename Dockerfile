# TODO: Use alpine instead for smaller image. 
#But first need to be able to run nodegit in alpine.
#FROM mhart/alpine-node:5.5.0 

# Use node
FROM node:5.11

# Install docker client (for debugging purposes)
RUN wget https://get.docker.com/builds/Linux/x86_64/docker-1.9.1 && mv docker-1.9.1 /usr/bin/docker && chmod 777 /usr/bin/docker

# Install Empirical
COPY package.json /emp/package.json
WORKDIR /emp
RUN npm install
COPY . /emp
ENTRYPOINT ["node", "index.js"]
