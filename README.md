
<h1 align='center'>
  <a href='https://empiricalci.com'>
    <img src='https://cloud.githubusercontent.com/assets/689720/17884275/43072938-68cc-11e6-9131-ca0ffa0afa0a.png'/>
  </a>
  <br/>
  emp
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

## Dependencies
One of the enabling technologies that's used in this framework is **Docker**. 
Docker allows us to create self-contained portable environments that work accross different platforms. 
- Follow [these instructions](https://docs.docker.com/engine/installation/) to install Docker

## Install
There are 2 distribution methods currently supported. They're both compatible with Linux & Mac. Windows support is on the way.

#### Via npm
If you already have node.js installed in your computer you can install **emp** using ``npm``.
```
npm install -g empirical-cli
```

#### Docker container distribution
If you don't have node.js installed of if you have any troubles with the node distribution,
you can use **emp** as a Docker container, just by installing the launcher:
```
curl -s https://raw.githubusercontent.com/empiricalci/emp/master/install.sh | sudo sh
```

## Get started
Test your installation by replicating an experiment.
```
emp replicate empiricalci/mnist-sample/mnist/SJCSKAeT
```

## Replicate an experiment
You can easily replicate an experiment by running:
```
emp replicate <experimentId>
```
This will clone the source code from GitHub, checkout the appropriate version, 
build the experiment image, download the required datasets, run the experiment, 
and save the results on your computer. All in **one single command**.

## Run your own experiments
Once you have defined your experiment using the [Empirical Framework](http://empiricalci.com/docs).
You can use the tool to execute your experiment on your own computer.
```
emp run <protocol> </path/to/code>
```
This is useful for quickly testing on your computer before saving changes to your code.

## Authenticate with the server
Authenticating with [empiricalci.com](https://empiricalci.com) allows you to save the results of your experiments
and share them with your peers.  
1. If you haven't done so, sign up with GitHub for an account on [empiricalci.com](http://empiricalci.com)  
2. Set up a password on your [account page](https://empiricalci.com/account)  
3. Login using the CLI: ``emp login`` will ask for your credentials and store them on your computer  

## Keep track of your experiments
In order to keep track of your experiments on [empiricalci.com](https://empiricalci.com),
we integrate with GitHub for tracking any updates made to your research code.
Associate your repository by creating a [new project](https://empiricalci.com/projects/new).
Once you linked your project, every time that you push to that repo we'll create a new
version of your code on [empiricalci.com](https://empiricalci.com). 

Then, you can run a specific version of the research code by doing the following:
```
emp run --version <SHA> --save <owner/project> <protocol>
```
Note that you cannot run arbitray commits. Usually when pushing to GitHub,
the push contains multiple commits, but only the head commit is associated with the 
new version created on [empiricalci](https://empiricalci.com).
Therefore the given ``<SHA>`` must belong to a push's head commit.
You can review the versions with their associated commits
on [empiricalci.com/experiments](https://empiricalci.com/experiments).

To simplify things, when **emp** is run without a ``--version`` and a code path is given,
**emp** will get the SHA of the current head commit of the code in order to retrieve the version.
This means that you can run this command right after pushing your commits to GitHub
without having to look for the commit ``<SHA>``, like this:

1. Push your changes to GitHub: ``git push``  
2. Run your experiments: ``emp run --save <owner/project> <protocol> </path/to/code>``

## Configure

### Empirical directory
Empirical uses a directory to cache all the datasets downloaded and to save any files generated during the
tests or experiments. This defaults to ``~/empirical``. You can change this by doing:
```
emp configure
```
