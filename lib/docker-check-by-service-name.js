const { exec } = require('child-process-promise');
const Promise = require('bluebird');

/**
 * check if the container exist by name
 */
module.exports = Promise.coroutine(
  function* (runName/* : Function */,
    pathToCompose/* : string */,
    serviceName/* : string */) /* : boolean */ {
    const command = `docker-compose -p ${runName} -f "${pathToCompose}" ps`;
    const result = yield exec(command);
    const lines = result.stdout.split('\n');
    const exist = lines.find((element) => {
      const containerName = `${runName.replace('_', '')}_${serviceName}`;
      return element.indexOf(containerName) > -1 && element.indexOf('Up') > -1;
    });
    return Boolean(exist);
  });
