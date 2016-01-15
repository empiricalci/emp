# Install Node (https://github.com/mhart/alpine-node)
FROM mhart/alpine-node:5.2.0

# Install Empirical
COPY . /emp
WORKDIR /emp
RUN npm install
ENTRYPOINT ["node", "index.js"]
