# Install Node (https://github.com/mhart/alpine-node)
FROM mhart/alpine-node:5.2.0

# Install Empirical Interface
RUN apk add --update zeromq zeromq-dev
COPY . /emp
WORKDIR /emp
RUN npm install

# Setup entrypoint
EXPOSE 3001
ENTRYPOINT ["node","index.js"]
