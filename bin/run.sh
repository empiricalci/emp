#!/bin/bash

set -e

VERSION="v0.1.1"
IMAGE="empiricalci/emp:$VERSION"

# Functions
launch() {
  docker run $DOCKER_RUN_OPTIONS --rm \
    $VOLUMES \
    $ENV_VARS \
    -e EMPIRICAL_API_URI=$EMPIRICAL_API_URI \
    -e EMPIRICAL_API_KEY=$EMPIRICAL_API_KEY \
    -e EMPIRICAL_API_SECRET=$EMPIRICAL_API_SECRET \
    -e EMPIRICAL_DIR=$EMPIRICAL_DIR \
    -e DEBUG=$DEBUG \
    $IMAGE "$@"
}

# Get configuration
if [ -f "$HOME/.emp/emp.env" ]; then
  source "$HOME/.emp/emp.env"
else
  # Create default configuration
  if [ ! -d "$HOME/.emp" ]; then
    mkdir $HOME/.emp
  fi
  echo "EMPIRICAL_DIR=$HOME/empirical" > $HOME/.emp/emp.env
fi

if [ -z "$DOCKER_HOST"  ]; then
  DOCKER_HOST="/var/run/docker.sock"
fi

if [ -z "$EMPIRICAL_DIR" ]; then
  EMPIRICAL_DIR="$HOME/empirical"
fi

VOLUMES="-v $DOCKER_HOST:/var/run/docker.sock"
VOLUMES="$VOLUMES -v $EMPIRICAL_DIR/data:/empirical/data"
VOLUMES="$VOLUMES -v $EMPIRICAL_DIR/workspaces:/empirical/workspaces"
VOLUMES="$VOLUMES -v $HOME/.emp/emp.env:/emp.env"

if [ "$1" = "run" ]; then
   if [ -z "$3" ]; then
    echo "emp run requires two arguments"
    echo "Usage: emp run my-experiment /path/to/project"
    exit
  else
    CODE_DIR=$(readlink -f $3)
    ENV_VARS="$ENV_VARS -e CODE_DIR=$CODE_DIR"
    VOLUMES="$VOLUMES -v $CODE_DIR:/empirical/code:ro"
  fi
fi

if [ "$1" = "data" ] && [ "$2" = "hash" ]; then
  DATA_FILE=$(readlink -f $3)
  VOLUMES="$VOLUMES -v $DATA_FILE:/x$DATA_FILE"
  ENV_VARS="$ENV_VARS -e DATA_FILE=/x$DATA_FILE"
fi

DOCKER_RUN_OPTIONS="-ti"

# Test environment
if [ "$EMPIRICAL_ENV" = "test" ]; then
  IMAGE="empiricalci/emp:test"
  VOLUMES="$VOLUMES -v $(pwd):/emp"
  DOCKER_RUN_OPTIONS="-i"
fi

launch $@
