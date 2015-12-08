FROM docker:1.9.1-dind

# Install Node (https://github.com/mhart/alpine-node)
ENV VERSION=v5.1.1 NPM_VERSION=3
RUN apk add --update curl make gcc g++ python linux-headers paxctl libgcc libstdc++ && \
  curl -sSL https://nodejs.org/dist/${VERSION}/node-${VERSION}.tar.gz | tar -xz && \
  cd /node-${VERSION} && \
  ./configure --prefix=/usr ${CONFIG_FLAGS} && \
  make -j$(grep -c ^processor /proc/cpuinfo 2>/dev/null || 1) && \
  make install && \
  paxctl -cm /usr/bin/node && \
  cd / && \
  if [ -x /usr/bin/npm ]; then \
    npm install -g npm@${NPM_VERSION} && \
    find /usr/lib/node_modules/npm -name test -o -name .bin -type d | xargs rm -rf; \
  fi 
# Install Empirical Interface
RUN apk add --update zeromq zeromq-dev
COPY . /emp
WORKDIR /emp
RUN npm install

# Remove stuff to keep image light
# RUN apk del curl make gcc g++ python linux-headers paxctl ${DEL_PKGS} && \
#  rm -rf /etc/ssl /node-${VERSION} \
#    /usr/share/man /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp \
#    /usr/lib/node_modules/npm/man /usr/lib/node_modules/npm/doc /usr/lib/node_modules/npm/html

# Start Docker daemon
RUN dockerd-entrypoint.sh

# Setup entrypoint
EXPOSE 3001
ENTRYPOINT ["node","index.js"]
