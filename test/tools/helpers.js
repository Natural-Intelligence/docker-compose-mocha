const chance = require('./../../lib/setup-environment-names-seed');
const { expect } = require('chai');
const Promise = require('bluebird');
const { getRandomEnvironmentName } = require('./../../lib/get-random-environment-name');
const dockerStopByServiceName = require('./../../lib/docker-stop-by-service-name');
const dockerStartByServiceName = require('./../../lib/docker-start-by-service-name');
const dockerCheckByServiceName = require('./../../lib/docker-check-by-service-name');
const main = require('./../../index');
const { exec } = require('child-process-promise');
const rp = require('request-promise');
const simulateMochaRun = require('./mocha-helper').simulateMochaRun;
const pullTools = require('./../../lib/docker-pull-image-by-name');

const { coroutine } = Promise;
let envName = '';

function verifyEnvironmentDownByProjectName(pathToCompose, runName) {
  return main.getAddressForService(runName, pathToCompose, 'dct_s1', 3001)
    .then(() => {
      expect(true, 'Should not get here since the dct_s1 service should be down').to.equal(false);
    })
    .catch(() => main
      .getAddressForService(runName, pathToCompose, 'dct_s2', 3002)
      .then(() => {
        expect(true, 'Should not get here since the dct_s2 service should be down').to.equal(false);
      })
      .catch(() =>
        // If we got here it means that both services went down successfully!
        Promise.resolve()));
}

const runAnEnvironment = coroutine(function* (pathToCompose, targetEnvName) {
  let generatedEnvName = '';
  yield simulateMochaRun((before, after) => {
    generatedEnvName = main.dockerComposeTool(before, after, pathToCompose, {
      targetEnvName,
      healthCheck: {
        state: true,
        options: {
          custom: {
            db: coroutine(function* (url) {
              try {
                const response = yield rp({
                  url: `http://${url}/`,
                  resolveWithFullResponse: true,
                  timeout: 2000,
                });

                console.log('From within the custom poll method..');
                return (response.statusCode >= 200 && response.statusCode < 500);
              } catch (err) {
                yield Promise.delay(1000);
                return false;
              }
            }),
          },
        },
      },
    });
  }, coroutine(function* () {
    const resultDct1 = yield main.getAddressForService(generatedEnvName, pathToCompose, 'dct_s1', 3001);
    expect(Number(resultDct1.replace('0.0.0.0:', ''))).to.be.above(1);
    const targetUriForService1 = `http://${resultDct1}`;
    console.log(`Performing request to ${targetUriForService1}`);

    const requestResult = yield rp({
      uri: targetUriForService1,
      timeout: 2000,
    });
    expect(requestResult).to.equal('Hello from test app on port 3001');
    console.log('success!');

    // use the deprecated function, just to check that it still works.
    const resultDct2 = yield main.getAddressForService(generatedEnvName, pathToCompose, 'dct_s2', 3002);
    expect(Number(resultDct2.replace('0.0.0.0:', ''))).to.be.above(1);
    const targetUriForService2 = `http://${resultDct2}`;
    console.log(`Performing request to ${targetUriForService2}`);

    const request2Result = yield rp({
      uri: targetUriForService2,
      timeout: 2000,
    });
    expect(request2Result).to.equal('Hello from test app on port 3002');
    console.log('success again!');
  }));
  return verifyEnvironmentDownByProjectName(generatedEnvName, pathToCompose);
});

const runAnEnvironmentWithStopStart = coroutine(
  function* runAnEnvironmentWithStopStart(pathToCompose) {
    let generatedEnvName = '';
    yield simulateMochaRun((before, after) => {
      generatedEnvName = main.dockerComposeTool(before, after, pathToCompose);
    }, coroutine(function* () {
      try {
        const serviceName = 'dct_s1';
        const checkBefore = yield dockerCheckByServiceName(generatedEnvName,
          pathToCompose, serviceName);
        expect(checkBefore).to.eql(true);
        yield dockerStopByServiceName(generatedEnvName,
          pathToCompose, serviceName);
        const checkAfterStop = yield dockerCheckByServiceName(generatedEnvName,
          pathToCompose, serviceName);
        expect(checkAfterStop).to.eql(false);
        yield dockerStartByServiceName(generatedEnvName,
          pathToCompose, serviceName);
        const checkAfterRestart = yield dockerCheckByServiceName(generatedEnvName,
          pathToCompose, serviceName);
        expect(checkAfterRestart).to.eql(true);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }));
    return verifyEnvironmentDownByProjectName(generatedEnvName, pathToCompose);
  });

const runASubEnvironment = coroutine(function* (pathToCompose) {
  const firstEnvLoad = (before, after) => {
    const options = {
      containerCleanUp: false,
      healthCheck: {
        state: true,
      },
      startOnlyTheseServices: ['dct_s1'],
    };
    envName = main.dockerComposeTool(before, after, pathToCompose, options);
  };
  const firstTestCheck = coroutine(function* () {
    const resultDct1 = yield main.getAddressForService(envName, pathToCompose, 'dct_s1', 3001);
    expect(Number(resultDct1.replace('0.0.0.0:', '')), 'Make sure we have a numeric port above:').to.be.above(1);
    expect(pullTools.dockerPullImageByName.callCount).to.equal(1);

    try {
      yield main.getAddressForService(envName, pathToCompose, 'dct_s2', 3002);
      expect.fail();
    } catch (e) {
      // if it fails - is good.
    }
  });

  yield simulateMochaRun((before, after) => {
    firstEnvLoad(before, after);
  }, firstTestCheck, false, true);

  const secondEnvLoad = (before, after) => {
    const options = {
      cleanUp: false,
      healthCheck: {
        state: true,
      },
      startOnlyTheseServices: ['dct_s2'],
      envName,
    };
    main.dockerComposeTool(before, after, pathToCompose, options);
  };
  const secondTestCheck = coroutine(function* () {
    const resultDct1 = yield main.getAddressForService(envName, pathToCompose, 'dct_s1', 3001);
    expect(Number(resultDct1.replace('0.0.0.0:', '')), 'Make sure we have a numeric port for dct_s1:').to.be.above(1);
    const resultDct2 = yield main.getAddressForService(envName, pathToCompose, 'dct_s2', 3002);
    expect(Number(resultDct2.replace('0.0.0.0:', '')), 'Make sure we have a numeric port for dct_s2').to.be.above(1);
  });

  yield simulateMochaRun((before, after) => {
    secondEnvLoad(before, after);
  }, secondTestCheck, true, false);

  return envName;
});

function checkOldEnvironmentWasCleaned(pathToCompose, oldEnvName) {
  return verifyEnvironmentDownByProjectName(oldEnvName, pathToCompose);
}

const runAnOldEnvironment = coroutine(function* (pathToCompose) {
  const moreThan20MinutesOldProjectName = getRandomEnvironmentName(chance, 35).envName;
  yield exec(`docker-compose -p ${moreThan20MinutesOldProjectName} -f ${pathToCompose} up -d`);

  const resultDct1 = yield main.getAddressForService(moreThan20MinutesOldProjectName, pathToCompose, 'dct_s1', 3001);
  expect(Number(resultDct1.replace('0.0.0.0:', ''))).to.be.above(1);

  const resultDct2 = yield main.getAddressForService(moreThan20MinutesOldProjectName, pathToCompose, 'dct_s2', 3002);
  expect(Number(resultDct2.replace('0.0.0.0:', ''))).to.be.above(1);

  return moreThan20MinutesOldProjectName;
});

module.exports = {
  runAnOldEnvironment,
  checkOldEnvironmentWasCleaned,
  runASubEnvironment,
  runAnEnvironmentWithStopStart,
  runAnEnvironment,
};
