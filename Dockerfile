# Install Node (https://github.com/mhart/alpine-node)
FROM mhart/alpine-node:5.2.0

# Install Empirical Interface
COPY . /emp
WORKDIR /emp
RUN npm install

# Setup entrypoint
EXPOSE 3001
ENTRYPOINT ["node","index.js"]
