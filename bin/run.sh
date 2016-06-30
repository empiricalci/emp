
run(){
  if [ -z "$1" ]; then
    echo "Usage: emp experiment-name [path to code]"
    exit
  fi
  if [ -z "$2" ]; then
    CODE_DIR=$(pwd)
  else
    CODE_DIR=$(readlink -f $2)
  fi
  if [ -z "$EMPIRICAL_DIR" ]; then
    EMPIRICAL_DIR='/tmp'
    echo "WARNING: EMPIRICAL_DIR not set. Defaulting to /tmp/"
  fi
  docker run -t --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $CODE_DIR:/empirical/code:ro \
    -v $EMPIRICAL_DIR/data:/empirical/data \
    -v $EMPIRICAL_DIR/workspaces:/empirical/workspaces \
    -e EMPIRICAL_API_URI=$EMPIRICAL_API_URI \
    -e EMPIRICAL_DIR=$EMPIRICAL_DIR \
    -e DEBUG=$DEBUG \
    empiricalci/emp run $1
}

listen(){
  docker run -t --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $EMPIRICAL_DIR/data:/empirical/data \
    -v $EMPIRICAL_DIR/workspaces:/empirical/workspaces \
    -e EMPIRICAL_API_URI=$EMPIRICAL_API_URI \
    -e EMPIRICAL_API_KEY=56f21e9c444d700624705d16 \
    -e EMPIRICAL_API_SECRET=e6bbfb2b-f608-48a8-8a60-c78df6c2bb97 \
    -e EMPIRICAL_DIR=$EMPIRICAL_DIR \
    -e DEBUG=$DEBUG \
    empiricalci/emp listen
}

# CLI
if [ -z "$EMPIRICAL_DIR" ]; then
  EMPIRICAL_DIR='/tmp'
  echo "WARNING: EMPIRICAL_DIR not set. Defaulting to /tmp/"
fi

if [ "$1" = "listen" ]; then
  listen
fi

if [ "$1" = "run" ]; then
 run $2 $3
fi 
