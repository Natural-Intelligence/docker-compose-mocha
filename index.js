// @flow


const { exec } = require('child-process-promise');
const Promise = require('bluebird');
const chalk = require('chalk');
const chance = require('./lib/setup-environment-names-seed');
const { Spinner } = require('cli-spinner');
const { cleanupContainersByEnvironmentName, cleanupOrphanEnvironments } = require('./lib/docker-utility-functions');

const dockerPullImagesFromComposeFile = require('./lib/docker-pull-images-from-compose-file');
const { getRandomEnvironmentName, extractEnvFromEnvName } = require('./lib/get-random-environment-name');

const dockerStartByServiceName = require('./lib/docker-start-by-service-name');
const dockerStopByServiceName = require('./lib/docker-stop-by-service-name');
const dockerCheckByServiceName = require('./lib/docker-check-by-service-name');
const healthCheckMethods = require('./lib/health-check-methods');
const getAddressForService = require('./lib/get-address-for-service');
const getLogsForService = require('./lib/get-logs-for-service');

/* ::
 type DockerComposeToolOptions = {
 startOnlyTheseServices: ?string[],
 envName: ?string,
 envVars: ?{[name:string]: string},
 healthCheck: ?Object,
 cleanUp: ?boolean,
 containerCleanUp: ?boolean
 }
 */

module.exports = {
  /**
   * Running this method will fire up the environment written in your provided Docker Compose file.
   * The environment will run isolated and with random ports to not
   * interfere with any other test suites which
   * might be running on the same CI machine.
   *
   * This methods expects the following variables
   *
   * @param beforeFunction - from your Mocha.js setup file you need to provide
   * access to the global before() function
   * so that this code can use it to start up your environment.
   *
   * @param afterFunction - from your Mocha.js setup file you need to provide
   * access to the global after() function
   * so that this code can use it to shut down your environment and clean it from the CI server
   *
   * @param pathToComposeFile - the absolute path to your docker-compose.yml file
   * for your test environment
   *
   */
  dockerComposeTool: function dockerComposeTool(beforeFunction/* :Function */,
    afterFunction/* :Function */,
    pathToComposeFile/* : string */,
    { startOnlyTheseServices, envName, envVars,
      healthCheck, cleanUp, containerCleanUp, shouldPullImages = true, brutallyKill = false }
      /* :DockerComposeToolOptions */ = {})/* : string */ {
    const randomComposeEnv = envName
      ? extractEnvFromEnvName(envName)
      : getRandomEnvironmentName(chance);
    const runNameSpecific = randomComposeEnv.envName;
    const runNameDisplay = `${randomComposeEnv.firstName} ${randomComposeEnv.lastName}`;
    const performCleanup = cleanUp === undefined ? true : cleanUp;
    const performContainerCleanup = containerCleanUp === undefined ? true : containerCleanUp;

    beforeFunction(Promise.coroutine(function* () {
      if (shouldPullImages) {
        yield dockerPullImagesFromComposeFile(pathToComposeFile, startOnlyTheseServices);
      }
      if (performCleanup) {
        yield cleanupOrphanEnvironments();
      }
      const onlyTheseServicesMessage = startOnlyTheseServices
        ? `, using only these services: ${startOnlyTheseServices.join(',')}`
        : '';
      const consoleMessage = `Docker: starting up runtime environment for this run (codenamed: ${runNameDisplay})${onlyTheseServicesMessage}... `;
      const spinner = new Spinner(`${chalk.cyan(consoleMessage)}${chalk.yellow('%s')}`);

      if (!process.env.NOSPIN) {
        spinner.setSpinnerString('|/-\\');
        spinner.start();
      } else {
        console.log(consoleMessage);
      }
      const onlyTheseServicesMessageCommandAddition = startOnlyTheseServices
        ? startOnlyTheseServices.join(' ')
        : '';
      yield exec(`docker-compose -p ${runNameSpecific} -f "${pathToComposeFile}" up -d ${onlyTheseServicesMessageCommandAddition}`,
        envVars ? { env: envVars } : {});

      if (!process.env.NOSPIN) {
        spinner.stop();
        console.log(''); // We add this in order to generate a new line after the spinner has stopped
      }

      if (healthCheck !== null && typeof healthCheck === 'object' && healthCheck.state === true) {
        yield healthCheckMethods.verifyServicesReady(runNameSpecific,
          pathToComposeFile,
          healthCheck.options || {},
          startOnlyTheseServices);
      }
    }));

    afterFunction(() => {
      if (performContainerCleanup) {
        return cleanupContainersByEnvironmentName(runNameSpecific,
          pathToComposeFile, runNameDisplay, brutallyKill);
      }

      return Promise.resolve();
    });

    return runNameSpecific;
  },
  getAddressForService,
  getLogsForService,
  getRandomPortForService(...args/* :Object[] */) {
    console.warn('getRandomPortForService has been deprecated. Use "getAddressForService" instead (same signature)');

    return getAddressForService(...args);
  },
  getRandomAddressForService(...args/* :Object[] */) {
    console.warn('getRandomAddressForService has been deprecated. Use "getAddressForService" instead (same signature)');

    return getAddressForService(...args);
  },
  dockerStartByServiceName,
  dockerStopByServiceName,
  dockerCheckByServiceName,
};

