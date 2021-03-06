# Changelog

## v0.7.0 (15 Jul 2017)
- Fail whenever a container throws an error
- Allows to run experiments from pre-built images
- Allows to upload result images
- Reports timestams and durations
- Compatible with Node 7.0
- Drop support for Node 4

## v0.6.0 (28 Feb 2017)
- **Breaking changes:** Full API refactor
- Saving results to the server is now done on 2 steps:
``emp run`` runs the experiment and saves a report. Then ``emp push`` posts the report
to the server.
- Replaced ``emp replicate <experimentId>`` with ``emp run <experimentId>``

## v0.5.0 (26 Oct 2016)
- Allows to run GPU enabled docker containers by reading GPU info provided by nvidia-docker-plugin
- Upgrades dockerise to v0.3.0
- Fixes logger.write()

## v0.4.2 (12 Oct 2016)
- Upgrades dataset-cache to v2.0.2: 
Fixes windows checksum missmatch for directories

## v0.4.1 (11 Oct 2016)
- Upgrade dataset-cache to v2.0.1. This change makes it required to pass a
``directory: true`` flag when the resource is going to be extracted to a directory from ``.zip`` or ``.tar.gz``  
- ``emp data --dir URL.(zip|tar.gz)`` will download the file and extract the contents to a directory

## v0.4.0 (7 Oct 2016)
- Windows compatibility via npm distribution

## v0.3.2 (28 Sep 2016)
- Don't hardcode docker socket
- Fix json stream parsing from build image

## v0.3.1 (27 Sep 2016)
- Allows to pass entrypoint from protocol envrionment

## v0.3.0 (21 Sep 2016)
- Saves log files to experiment directory
- Uploads the logs to the server when using ``--save owner/project``

## v0.2.3 (8 Sep 2016)
- Only requires auth token to clone private repositories.

## v0.2.2 (7 Sep 2016)
- Saves environment and dataset

## v0.2.1 (31 Aug 2016)
- Fixes binary for npm package by adding hashbang

## v0.2.0 (31 Aug 2016)
- Complete refactor of the code
- Breaking changes on ``empirical.yml``: Changed top node key from ``experiments`` to ``protocols``
- Data volumens are now mounted independently to the experiment container
and are now referenced from the experiment container by the key used to define the resource as ``/data/{key}``
- Adds replicate command
- Adds ``--save <project>`` functionality to ``emp run``,
for saving the status of experiments to [empiricalci.com](https://empiricalci.com) 

## v0.1.2 (12 Aug 2016)
- Fixes run script on Mac 
- Shows basic usage and version on the CLI

## v0.1.1 (20 Jul 2016)
- Adds full version to launch script ``./bin/run.sh``
- Fix install script

## v0.1.0 (20 Jul 2016)
- First alpha release candidate
