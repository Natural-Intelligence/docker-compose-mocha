/* @flow */
/* eslint no-console: 0 */
const Promise = require('bluebird');
const yaml = require('js-yaml');
const fs = Promise.promisifyAll(require('fs'));
const getAddressForService = require('./get-address-for-service');
const rp = require('request-promise');

const { coroutine } = Promise;
const pollUntilServiceIsReady = coroutine(function* (runName /* : String */,
  serviceName /* : String */,
  poller /* : Function */,
  exposedInternalPort /* : String */,
  pathToCompose /* : String */,
  timeout /* : Number */) {
  // First let's get the resolved address of the service
  const serviceAddress = yield getAddressForService(runName,
    pathToCompose, serviceName, exposedInternalPort);
  let timeElapsedUnix = 0;
  let pollingState = false;
  const startTimeStamp = Math.floor(Date.now() / 1000);

  do {
    const result = yield poller(serviceAddress);
    if (result === true) {
      console.log(`Service ${serviceName.toString()} is ready!`);
      // Exit the poller!
      pollingState = true;
      break;
    }
    timeElapsedUnix = Number(Math.floor(Date.now() / 1000) - startTimeStamp);
  } while (timeElapsedUnix <= Number(timeout));
  // Timeout reached, let's get out of here

  if (pollingState) {
    return Promise.resolve();
  }
  throw new Error(`Timeout for service ${serviceName.toString()} reached after ${timeElapsedUnix.toString()} seconds!`);
});

module.exports = {
  verifyServicesReady: coroutine(function* (runName,
    pathToCompose /* : String */,
    options /* : Object */,
    startOnlyTheseServices /* : Array<string> */ = []) {
    const composeFileContent = yield fs.readFileAsync(pathToCompose, 'utf8');
    const doc = yaml.safeLoad(composeFileContent);
    const promises = [];
    const defaultPollers = {
      http: coroutine(function* (url) {
        try {
          const response = yield rp({
            url: `http://${url}/healthcheck`,
            resolveWithFullResponse: true,
            timeout: 2000,
          });

          return (response.statusCode >= 200 && response.statusCode < 500);
        } catch (err) {
          yield Promise.delay(1000);
          return false;
        }
      }),
    };

    // Support for Docker Compose v2 and higher
    const services = doc.services || doc;

    Object
      .keys(services)
      .forEach((serviceName) => {
        // Exit health check when service is not on startOnlyTheseServices.
        if (startOnlyTheseServices.length > 0 && !startOnlyTheseServices.includes(serviceName)) {
          return;
        }
        let pollerToUse = defaultPollers.http;
        if ('custom' in options && serviceName in options.custom) {
          pollerToUse = options.custom[serviceName];
        }

        console.log(services[serviceName].ports[0]);
        promises.push(pollUntilServiceIsReady(runName, serviceName, pollerToUse,
          services[serviceName].ports[0], pathToCompose, options.timeout || 30));
      });

    yield Promise.all(promises);
  }),
};
