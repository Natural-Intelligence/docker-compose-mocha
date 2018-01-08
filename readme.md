<img src="https://umbrella.s3.naturalint.com/opensource/docker-compose-mocha/ni-eng-strip.jpg" alt="NI Engineering">

# Docker Compose Mocha

A tool used to create an isolated environment for services which are Docker-ized
based on services found inside a given docker-compose.yml file when run through the Docker Compose binary.

This can be particularly useful when you want to setup other services with end to end testing before your application starts to run it's test suite.

One thing to note: this tool is meant to be used with any testing framework (not necessarily Mocha) although the following examples
are based on Mocha (due to it's popularity).

Docker and CI/CD are incredibly important for us at <a target="_blank" href="http://naturalint.com/">Natural Intelligence</a>, as we have a large micro-service oriented system serving listings in more than 100 different fields. In addition, we are also <a href="http://naturalint.com/careers">hiring talented engineers</a> to help us grow as a technological pioneers

## Node versions supported
This package supports Node v6 and higher

## Purpose
This package is solely for testing purposes for building CI/CD pipelines using Docker and can be used
in combination with any language as long as your service is wrapped in a Docker image.

You will however need to orchestrate your CI/CD flow using Node (and possibly bash/zsh)

## Installation
Inside your project directory type the following code:

### When using npm
```bash
$ npm i docker-compose-mocha --save-dev
```

### When using yarn
```bash
$ yarn add docker-compose-mocha --dev
```

## Cleanup logic
The compose tool has a cleanup logic against mocha before and after functions.
before:
Full environment cleanup of all containers, networks, volumes etc... (Start tests with clean state).
Full cleanup uses environment variable: `process.env.CONTAINER_STALE_MIN` parameter (with 0 minutes default value).
It means that every containers/networks created by the tool will be removed immediately from its creation time (unix timestamp).
* In your CI machines when your run multiple tests on the same time,
you probably want to change cleanup `CONTAINER_STALE_MIN` to 20-30 minutes in order to prevent cleanup collision between tests.

after:
Cleanup of current running environment containers.

* On local developer machine (NODE_ENV empty or equal to development) cleanup run immediately on each run.
When in development mode you can control cleanup flow. Example:

 ```js
 // run only a and b, do not cleanup container (We need them up and running for second call to dockerComposeTool)
 const envName = dct.dockerComposeTool(before, after, pathToCompose, {startOnlyTheseServices: ['a', 'b'], containerCleanUp: false});

// add services c and d with the same envName. Do not perform full cleanup on before.
 dct.dockerComposeTool(before, after, pathToCompose, {startOnlyTheseServices: ['c', 'd'], envName, cleanUp: false});
 // now run all the rest
 dct.dockerComposeTool(before, after, pathToCompose, {envName});
 ```
cleanup parameters:
`cleanUp` - true/false (default true) control on full cleanup on before function.
`containerCleanUp` - true/false (default true) control on containers cleanup on after function.


## Usage example

Assume the following docker-compose.yml
```yaml
service1:
    image: ubuntu:14.04
    links:
        - db
    ports:
        - '3002'

service2:
    image: ubuntu:14.04
    links:
        - db
    ports:
        - '3004'

db:
    image: mongo:3.3
    ports:
        - '27017'

```

After using our package's code to fire up an environment as defined in the Yaml file you will have 3 services up and running
in your computer as Docker containers. all of them attaching a random TCP/IP port to your host computer (IP 127.0.0.1 / 0.0.0.0)

Consider the following Javascript code which is supposed to be placed in your end to end test suite setup.js file
(most preferably in your before() block)

```js

const {before, after} = require('mocha');
const {dockerComposeTool} = require('docker-compose-mocha');
const pathToCompose = './docker-compose.yml';

const envName = dockerComposeTool(before, after, pathToCompose);

```

Once this code ran before your test suite, you will have all the services from your Yaml file
up and running and ready to receive requests from your application under test.

Since these services are fired up under random TCP/IP ports you will need a way to know which
service is available at which address. For that we have supplied an helper function which can do just that

Please consider the following code

```js

const {before, after} = require('mocha');
const {dockerComposeTool, getAddressForService} = require('docker-compose-mocha');
const pathToCompose = './docker-compose.yml';

const envName = dockerComposeTool(before, after, pathToCompose);

const serviceName = 'service1';
const originalPort = 3002;

getAddressForService(envName, pathToCompose, serviceName, originalPort)
    .then((result) => {
        console.log(result); // => '0.0.0.0:36589'
    });

```

This way you can find out on which address every service form your Docker Compose is running

## Running Sub-environments

In some cases, you would like to run a subset of the services in the docker-compose file, and maybe run the rest after
that. For these cases, the last `option` parameter is used. It comprises the following two _optional_ fields:

* `startOnlyTheseServices`: an array of strings, comprising the services we want to run. If this value is undefined,
the default is to run all services.
* `envName`: if you already ran a subset of the services, and want to run another subset _under the same environment_,
specify here the envName you received in the previous call.
* `cleanUp`: specify here if you want to run full cleanup (run on mocha before).
* `containerCleanUp`: specify here if you want to run container cleanup (run on mocha after).

Disabling cleanup is especially useful when you run sub environments.

Example:

```js
// run only a and b
const envName = dct.dockerComposeTool(before, after, pathToCompose, {startOnlyTheseServices: ['a', 'b'], containerCleanUp: false});
// add services c and d
dct.dockerComposeTool(before, after, pathToCompose, {startOnlyTheseServices: ['c', 'd'], envName, cleanUp: false});
// now run all the rest
dct.dockerComposeTool(before, after, pathToCompose, {envName});
```

You can also perform starting and stoping dockerized services during the test:

1. stop the service (containers) which was started inside the docker compose file
const serviceName = 'dct_s1';
const envName = main.dockerComposeTool(before, after, pathToCompose, {envName});
yield dockerStopByServiceName(generatedEnvName, pathToCompose, serviceName);

2. and then you can start the service (container) after it was stopped
const afterStopResults = yield dockerListByServiceName(generatedEnvName, pathToCompose, serviceName);
expect(afterStopResults).to.eql(false);
yield dockerStartByServiceName(generatedEnvName, pathToCompose, serviceName);

3. check if a service is running by serviceName and status Up
const afterStopResults = yield dockerListByServiceName(generatedEnvName, pathToCompose, serviceName);

```js
// run only a and b
const envName = dct.dockerComposeTool(before, after, pathToCompose, {startOnlyTheseServices: ['a', 'b']});
// add services c and d
dct.dockerComposeTool(before, after, pathToCompose, {startOnlyTheseServices: ['c', 'd'], envName});
// now run all the rest
dct.dockerComposeTool(before, after, pathToCompose, {envName});
```

## Optimization options

* `brutallyKill`: will destroy the containers and not gently stop them. Usually, for test containers
  this is enough and improves shutdown considerably.
* `shouldPullImages`: will pull images only if this is true (and the default is true), otherwise it will
  assume they are already pulled. This should be used only in production, and thus should be used thusly:
  `shouldPullImages: !!process.env.NODE_ENV && process.env.NODE_ENV !== 'production'`

## Service checking

Since version `1.0.7` support for service checking was added with built in support for HTTP services
for all Natural Intelligence services (counting on the service to have a /healthcheck route)

Notice in the last example we have a `healthCheck` property inside the `options` object which
has two properties. Once the entire `healthCheck` object is supplied and state set to `true`
the Docker Compose Mocha will automatically scan all services available under your Compose yaml file
and will service check their availability using a simple HTTP GET health checker under the route
of `http://0.0.0.0:XXXX/healthcheck` - `XXXX` being the random port of your service.

Here's an example code of the service checking ability:

```js

const {before, after} = require('mocha');
const {dockerComposeTool} = require('docker-compose-mocha');
const pathToCompose = './docker-compose.yml';
const options = {
    healthCheck: {
        state: true,
        options: {
            custom: {
                mysql: Promise.coroutine(function*(address) {
                    // => Do some code here to check when
                    // mysql is ready to accept connections
                })
             }
        }
    }
};

const envName = dockerComposeTool(before, after, pathToCompose);

```

### Custom polling methods

In case you want to add a custom polling method you can do so easily as can be seen in the example.
Your polling method will accept as an argument the address at which your service can be found. If for example
our service is a MySQL container tagged in your compose file as the service `mysql` listening on the port `3306`
and binded to your host at port `30156`. Your polling method will accept `0.0.0.0:30156` (string) as an input
into your method so you can do your polling mechanism. Example of such a method can look like the following:

(Important: your method should return a promise, so it can also be an async function
and should also return `true` upon a successful polling or `false` for a non successful one)

```js
const options = {
  custom: {
    mysql: async function(address) {
        try {
          const connection = await mysqlDriver.connect(address);
          console.log(connection); // => The connection here should be open
          return true;
        } catch (err) {
          return false;
        }
    })
  }
}
```

## Credits and Thank you's

Thanks for reading and enjoy Dockerizing your end to end test suites.

This package was developed by: [Itamar Arjuan](https://github.com/itamararjuan) and with some help from:
[Gil Tayar](https://github.com/giltayar) and [Rotem Bloom](https://github.com/rockrotem).

Natural Intelligence - Node Infrastructure Team
Here at Natural Intelligence we use this tool to setup our end to end test suites
