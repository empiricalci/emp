# DEVELOPMENT

### Run against your local server
You can change the HOST to run ``emp`` againts your local development server.
```
EMPIRICAL_HOST=http://localhost:5000 ./bin/cli.js run user/project/x/Xsrsr_8
```

## Test
### Setup
The tests for the empirical client are run in conjuntion with the empirical server. 
So you should have the Docker image for it ``empiricalci/empirical``.

```
docker pull empiricalci/test_standalone
docker run -d -P --name rethink1 rethinkdb
docker run -d -p 1337 --net host -e AWS_SECRET_KEY=$AWS_SECRET_KEY -e AWS_ACCESS_KEY=$AWS_ACCESS_KEY --entrypoint=npm empiricalci/empirical run test-server
```

### Lint
We use Standard for linting.
```
npm run lint
```

### Lib
```
npm run test
```

### CLI
```
npm run test-cli
```

### Test coverage
```
npm run test-cov
```

## TODO:
- We need to serate server dependent tests so any contributor can run tests independently of the server.
