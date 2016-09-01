# Changelog
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
