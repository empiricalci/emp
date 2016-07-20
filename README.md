# EMP [![Circle CI](https://circleci.com/gh/alantrrs/emp.svg?style=svg&circle-token=cd5663fe04e7c0ed40a7a1d33a66d2431763a3d5)](https://circleci.com/gh/alantrrs/emp)
_Empirical Experiment Toolkit_

**emp** is a command line tool that helps you run your experiments
using the [Empirical Framework](http://empiricalci.com/docs/framework)

---

## Dependencies
The core enabling technology that's used in this framework is **Docker**. 
Docker allows us to create self-contained portable environments that work accross different platforms. 
In order to keep the dependencies  to a minmum and keep the whole environment portable, 
everything is run through Docker. The only requirement is:
- Follow [these instructions](https://docs.docker.com/engine/installation/) to install Docker

## Install

### Linux & Mac
Install the launcher
```
curl https://github.com/empiricalci/launcher/releases/download/v0.1/install.sh | sudo sh
```

### Windows
TBD

## Configure

### Empirical directory
Empirical uses a directory to cache all the datasets downloaded and to save any files generated during the
tests or experiments. This defaults to ``~/empirical``. You can change this by doing:
```
emp configure
```

## Run
Once you have defined your experiment using the [Empirical Framework](http://empiricalci.com/docs).
You can use the tool to execute your experiment.
```
emp run my-experiment /path/to/project
```

