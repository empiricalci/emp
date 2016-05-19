
emp(){
  if [ -z "$1" ]; then
    echo "Make sure you are current directory is the source directory and provide an experiment name"
    echo "Use: emp experiment-name [path to code]"
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
    -e EMPIRICAL_DIR=$EMPIRICAL_DIR \
    empiricalci/emp $1
} 

emp $1 $2
