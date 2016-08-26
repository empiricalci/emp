# TODO: Use alpine instead for smaller image. 
#But first need to be able to run nodegit in alpine.
#FROM mhart/alpine-node:5.5.0 

# Use node
FROM node:6-slim
RUN apt-get update
RUN apt-get install -y git
# Install Empirical
COPY package.json /emp/package.json
WORKDIR /emp
RUN npm install
COPY . /emp
ENTRYPOINT ["node", "index.js"]
