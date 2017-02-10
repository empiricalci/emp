
<h1 align='center'>
  <a href='https://empiricalci.com'>
    <img src='https://cloud.githubusercontent.com/assets/689720/22778232/1723bff0-ee6b-11e6-9703-07b9d7d5a58d.png'/>
  </a>
</h1>
<p align='center'>
  <i>A Package Manager for Empirical Science</i><br/><br/>
  <a href='https://travis-ci.org/empiricalci/emp'>
    <img src='https://travis-ci.org/empiricalci/emp.svg?branch=master' alt='build status'/>
  </a>
  <a href='https://gitter.im/empiricalci/emp?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge'>
    <img src='https://badges.gitter.im/empiricalci/emp.svg' alt='gitter'/>
  </a>
</p>

**emp** is a command line tool that helps you run and replicate experiments
using the [Empirical Framework](https://empiricalci.com/docs/framework)

<p align='center'>
  <img src='https://cloud.githubusercontent.com/assets/689720/22812270/97c874b0-eef8-11e6-819b-cf17485cfe7e.gif'/>
</p>

## Dependencies
There are only 2 requirements:

- **Node.js** is a JavaScript runtime required to run  this program on your computer. Download and install Node.js [from here](https://nodejs.org/en/). **Note:** Node.js v7.0.0 is not yet compatible.
- **Docker** allows us to create self-contained portable environments that work accross different platforms. Follow [these instructions](https://docs.docker.com/engine/installation/) to install Docker.

## Install

**emp** is supported on Windows, Mac and Linux.
Once you have node.js installed on your computer, you can install **emp** using ``npm``. 
```
npm install -g empirical-cli
```

## Get started
Test your installation by replicating an experiment.
```
emp run empiricalci/mnist/x/SJCSKAeT
```

This will clone the source code from GitHub, checkout the appropriate version, 
build the experiment image, download the required datasets, run the experiment, 
and save the results on your computer. All in **one single command**.

## Run your experiments
Once you have defined your experiment using the [Empirical Framework](http://empiricalci.com/docs).

### From GitHub
Run an experiment directly from a GitHub repository.
```
emp run mnist https://github.com/empiricalci/mnist-sample
```

Or provide a specific commit.
```
emp run mnist https://github.com/empiricalci/mnist-sample#0e6b04363c374992eb94a80dd2db0895711fb60f
```

### From empiricalci.com
You can easily replicate any experiment pushed to [empiricalci](https://empiricalci.com) by running:
```
emp run <experimentId>
```

### From a local directory
Or you can run an experiment from a local directory.
```
emp run my-protocol /path/to/code
```

## Keep track of your experiments

### Authenticate with the server
Authenticating with [empiricalci.com](https://empiricalci.com) allows you to save the results of your experiments
and share them with your peers.  
1. If you haven't done so, sign up for an account on [empiricalci.com](http://empiricalci.com)    
2. Login using the CLI: ``emp login`` will ask for your credentials and store them on your computer  

### Push your results

Push your results to the online dashboard by providing a message a path to the output directory created by ``emp run`` and the project id.

```
emp push -m "Experiment message" /path/to/report <projectId>
```

## Configure

Empirical uses a directory to cache all the datasets downloaded and to save any files generated during the
tests or experiments. This defaults to ``~/empirical``. You can change this by doing:
```
emp configure
```

## Notes

### GPU Support

GPU support is provided for Linux via [nvidia-docker](https://github.com/NVIDIA/nvidia-docker), you can follow the instructions on the ["Quick start"](https://github.com/NVIDIA/nvidia-docker#quick-start) to install it and learn how to run GPU enabled experiments [here](http://empiricalci.com/docs/gpu-support).

Currently Windows and MacOS are not supported since they rely on VMs to run Docker. See [this issue](https://github.com/NVIDIA/nvidia-docker/issues/101) for more information.


### About Docker on Windows

If you're using the [Docker for Windows](https://docs.docker.com/docker-for-windows) version, as opposed to [Docker toolbox](https://docs.docker.com/toolbox/overview/) make sure of the following:

- **emp** requires to mount certain directories on your containers, so make sure to [share your local drives](https://docs.docker.com/docker-for-windows/#/shared-drives).
- **emp** can usually communicate with Docker using the default settings. If it fails to connect, make sure the ``DOCKER_HOST`` environment variable is set to the correct value. On [Docker for Windows](https://docs.docker.com/docker-for-windows) this defaults to ``127.0.0.1:2375``. You can set it using CMD as ``setx DOCKER_HOST "127.0.0.1:2375"``.

