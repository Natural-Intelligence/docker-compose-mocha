// @flow
/* eslint no-console: 0 */

const { exec } = require('child-process-promise');
const chalk = require('chalk');
const Spinner = require('cli-spinner').Spinner;
const Promise = require('bluebird');
const extractTimestampFromName = require('./extract-timestamp-from-name');
const extractContainerIdFromName = require('./extract-container-id-from-name');
const dockerKillByContainerId = require('./docker-kill-by-container-id');
const extractProjectNameFromContainer = require('./extract-project-name-from-container');
const dockerKillNetworkByProjectName = require('./docker-kill-network-by-project-name');
const dockerRemoveStaleVolumes = require('./docker-remove-stale-volumes');

const coroutine = Promise.coroutine;
const divider = 'zzdivzz';
const containerRetentionInMinutes = process.env.CONTAINER_STALE_MIN === undefined ?
  0 :
  Number(process.env.CONTAINER_STALE_MIN);

function getUnixTimestampNow() {
  return Math.floor(new Date() / 1000);
}

/**
 * This method filters stale containers from the docker ps command
 * e.g - here's an example of a docker ps output
 *
 * 74934f702e5b cicontainerdenisekochanovitchzzdivzz1483974116_dct_s1_1
 * 490cd2f7f23e cicontainerdenisekochanovitchzzdivzz1483974116_dct_s2_1
 * 0a0d54af82ae cicontainerdenisekochanovitchzzdivzz1483974116_db_1
 *
 * The first value being the container Id and the second one is the container name.
 *
 * @param stdout
 * @param minutesAgoInUnixTimestamp
 * @param containerRetentionInMinutesParam
 * @returns {Array.<String>}
 */
function getStaleContainers(stdout /* : String */,
  minutesAgoInUnixTimestamp /* : number */,
  containerRetentionInMinutesParam /* : number */) /* : Array<string> */ {
  return stdout
    .split('\n')
    .filter(o => o.length > 0 && o.indexOf('cicontainer') !== -1)
    .filter((o) => {
      console.log(`inspecting container named: ${o} for cleanup`);
      const decision = (extractTimestampFromName(o, divider) <= minutesAgoInUnixTimestamp) ||
        (containerRetentionInMinutesParam === 0);
      if (decision) {
        console.log(`container named: ${o} is more than ${containerRetentionInMinutesParam ||
          containerRetentionInMinutes} minutes old and will be cleaned up`);
      } else {
        console.log(`container named: ${o} is fresh and will NOT be cleaned up`);
      }
      return decision;
    });
}

const cleanupContainersByEnvironmentName = coroutine(
  function* cleanupContainersByEnvironmentName(envName/* : string */,
    pathToComposeFile/* : string */, envDisplayName/* : string */, brutallyKill/* : boolean */) {
    const consoleMessage = `${brutallyKill ? 'Killing' : 'Stopping'} all containers of environment codenamed: ${envDisplayName}.. `;
    const spinner = new Spinner(`${chalk.cyan(consoleMessage)}${chalk.yellow('%s')}`);

    if (!process.env.NOSPIN) {
      spinner.setSpinnerString('|/-\\');
      spinner.start();
    } else {
      console.log(consoleMessage);
    }

    yield exec(`docker-compose -p ${envName} -f "${pathToComposeFile}" ${brutallyKill ? 'kill' : 'down'}`);

    const consoleMessageDispose = `Disposing of ${envDisplayName} environment.. `;
    const spinner2 = new Spinner(`${chalk.cyan(consoleMessageDispose)}${chalk.yellow('%s')}`);

    if (!process.env.NOSPIN) {
      spinner.stop();
      spinner2.setSpinnerString('|/-\\');
      spinner2.start();
    } else {
      console.log(consoleMessageDispose);
    }

    yield exec(`docker-compose -p ${envName} -f "${pathToComposeFile}" rm -f -v --all`);
    if (!process.env.NOSPIN) {
      spinner2.stop();
      console.log(''); // We add this in order to generate a new line after the spinner has stopped
    }

    return Promise.resolve();
  });

const cleanupOrphanEnvironments = coroutine(
  function* cleanupOrphanEnvironments(containerRetentionInMinutesParam) {
    console.log('Performing orphan containers cleanup (from previous CI runs)..');
    const minutesAgoInUnixTimestamp = containerRetentionInMinutes === 0 ?
      getUnixTimestampNow() :
      getUnixTimestampNow() - (60 * (containerRetentionInMinutesParam
        || containerRetentionInMinutes));
    const result = yield exec('docker ps --format "{{.ID}} {{.Names}}"');

    const staleContainers = getStaleContainers(result.stdout,
      minutesAgoInUnixTimestamp, containerRetentionInMinutes);

    // Kill stale containers
    yield Promise
      .all(staleContainers
        .map(container => extractContainerIdFromName(container, divider))
        .map(containerId => dockerKillByContainerId(containerId)));

    // Remove stale networks
    yield Promise.all(Array
      .from(new Set(staleContainers
        .map(container => extractProjectNameFromContainer(container)))
        .values())
      .map(projectName => dockerKillNetworkByProjectName(projectName)));

    // Clean up old volumes which are not connected to anything
    // Volumes which are in use will not be harmed by this
    yield dockerRemoveStaleVolumes();

    return Promise.resolve();
  });

module.exports = {
  cleanupContainersByEnvironmentName,
  cleanupOrphanEnvironments,
};
