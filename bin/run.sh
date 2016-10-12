#!/bin/bash

set -e

VERSION="v0.4.1"
IMAGE="empiricalci/emp:$VERSION"

# Functions
launch() {
  docker run $DOCKER_RUN_OPTIONS --rm \
    $VOLUMES \
    $ENV_VARS \
    -e HOME=$HOME \
    -e DEBUG=$DEBUG \
    $IMAGE "$@"
}

absolute_path() {
  if [ -e "$(dirname $1)" ]; then
    echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  fi
}

# Get configuration
EMP_CONF_FILE="$HOME/.emp/emp.env"
if [ -f "$HOME/.emp/emp.env" ]; then
  source "$HOME/.emp/emp.env"
else
  # Create default configuration
  if [ ! -d "$HOME/.emp" ]; then
    mkdir $HOME/.emp
  fi
  echo "EMPIRICAL_DIR=$HOME/empirical" > $HOME/.emp/emp.env
fi

if [ -z "$EMPIRICAL_DIR" ]; then
  EMPIRICAL_DIR="$HOME/empirical"
fi

VOLUMES="-v /var/run/docker.sock:/var/run/docker.sock"
VOLUMES="$VOLUMES -v $EMPIRICAL_DIR/data:$EMPIRICAL_DIR/data"
VOLUMES="$VOLUMES -v $EMPIRICAL_DIR/workspaces:$EMPIRICAL_DIR/workspaces"
VOLUMES="$VOLUMES -v $EMP_CONF_FILE:$EMP_CONF_FILE"

if [ "$1" = "replicate" ]; then
  if [ -z $3 ]; then
    CODE_DIR="$(pwd)/$(basename $(dirname $2))"
    # Append absolute path to the end
    set -- "${@}" "$CODE_DIR"
  else
    CODE_DIR=$(absolute_path $3)
    # Replaces last arg by the new absolute path
    set -- "${@:1:$(($#-1))}" "$CODE_DIR"
  fi
  if [ -z $CODE_DIR ]; then 
    echo "Path $(dirname $3) doesn't exists"
    exit 1
  fi
    VOLUMES="$VOLUMES -v $CODE_DIR:$CODE_DIR"
fi

if [ "$1" = "run" ]; then
  # Check if version is passed to run
  for key in "$@"; do
    case $key in
      -v|--version)
        SHA=true
    esac
  done
  if [ -z "$SHA" ]; then
    CODE_DIR=$(absolute_path "${@: -1}")
    if [ -z $CODE_DIR ]; then 
      echo "Path doesn't exists"
      exit 1
    fi
    VOLUMES="$VOLUMES -v $CODE_DIR:$CODE_DIR:ro"
    # Replaces last arg by the new absolute path
    set -- "${@:1:$(($#-1))}" "$CODE_DIR"
  fi
fi

if [ "$1" = "data" ] && [ "$2" = "hash" ]; then
  DATA_FILE=$(absolute_path $3)
  if [ -z $DATA_FILE ]; then 
    echo "Path doesn't exists"
    exit 1
  fi
  VOLUMES="$VOLUMES -v $DATA_FILE:$DATA_FILE"
fi

DOCKER_RUN_OPTIONS="-i"
if [ -t 1  ]; then
  DOCKER_RUN_OPTIONS="$DOCKER_RUN_OPTIONS -t"
fi

# Test environment
if [ "$EMPIRICAL_ENV" = "test" ]; then
  DOCKER_RUN_OPTIONS="$DOCKER_RUN_OPTIONS --net=host"
  ENV_VARS="-e EMPIRICAL_HOST=http://localhost:1337"
  IMAGE="empiricalci/emp:test"
fi

launch $@
