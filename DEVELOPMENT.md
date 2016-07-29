
# EMP
_Empirical Client_ 
---

**emp** is a client that connects to  **empiricalci.com** to automate running experiments in your computer

## Use
### Build the image
The ``node_modules/`` are built  and cached into the image. So every time you update the package.json
make sure you re-build the image:
```
docker-compose build emp-test
```

### Run from CLI
Running the tool directly from the CLI is helpful to quickly test an experiment without having to communicate 
with the server or go through GitHub. You can run your experiments by doing:
```
EMPIRICAL_ENV=test ./bin/run.sh experiment-name /path/to/code
```
This will build and run ``experiment-name`` defined in ``/path/to/code/empirical.yml``. 

## Test
The tests for the empirical client are run in conjuntion with the empirical server. 
So you should have the Docker image for it ``empiricalci/empirical``.
