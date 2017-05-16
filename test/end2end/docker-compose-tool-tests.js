const { describe, it } = require('mocha');
const { expect } = require('chai');
const { coroutine } = require('bluebird');
const main = require('./../../index');
const simulateMochaRun = require('../tools/mocha-helper').simulateMochaRun;
const sinon = require('sinon');
const { dockerPullImageByName } = require('./../../lib/docker-pull-image-by-name');
const dockerPullHostObject = require('./../../lib/docker-pull-image-by-name');

const {
  runAnOldEnvironment,
  checkOldEnvironmentWasCleaned,
  runASubEnvironment,
  runAnEnvironmentWithStopStart,
  runAnEnvironment,
} = require('./../tools/helpers');

describe('dockerComposeTool', () => {
  const pathToCompose = `${__dirname}/docker-compose.yml`;
  const pathToComposeForEnv = `${__dirname}/docker-compose-envvars.yml`;

  it('should load an environment correctly and wait for it (healthcheck) to be ready', () => runAnEnvironment(pathToCompose));

  it.only('should load a sub-environment correctly, and then the rest of the environment', coroutine(function* () {
    const spy = sinon.spy(dockerPullImageByName);
    dockerPullHostObject.dockerPullImageByName = spy;
    const envName = yield runASubEnvironment(pathToCompose);
    expect(spy.callCount).to.equal(2);
    yield runAnEnvironment(pathToCompose, envName);
  }));

  it('should stop the service by name and see its not running and then start the service and see its running', () => runAnEnvironmentWithStopStart(pathToCompose));

  it('should clean up before setting up an environment correctly', () => runAnOldEnvironment(pathToCompose)
    .then(oldEnvironmentName => runAnEnvironment(pathToCompose)
      .then(() => checkOldEnvironmentWasCleaned(pathToCompose, oldEnvironmentName))));

  it('getLogsForService and should use envVar', coroutine(function* () {
    let envName;
    yield simulateMochaRun((before, after) => {
      envName = main.dockerComposeTool(before, after, pathToComposeForEnv, { envVars: { FILE_TO_TAIL: '/etc/hosts' } });
    }, coroutine(function* () {
      const stdout = yield main.getLogsForService(envName, pathToComposeForEnv, 'dct_s1');
      expect(stdout).to.include('localhost');
    }));
  }));
});
