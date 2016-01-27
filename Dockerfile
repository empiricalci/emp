# TODO: Use alpine instead for smaller image. 
#But first need to be able to run nodegit in alpine.
#FROM mhart/alpine-node:5.5.0 

# Use node
FROM node:5.5.0

# Install Empirical
COPY . /emp
WORKDIR /emp
RUN npm install
ENTRYPOINT ["node", "index.js"]
