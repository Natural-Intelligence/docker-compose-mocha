// @flow


const childProcess = require('child-process-promise');
const { coroutine } = require('bluebird');

module.exports = coroutine(
  function* (runName/* : string */, pathToCompose/* : string */,
    serviceName/* : string */, originalPort/* : string */) {
    const { exec } = childProcess;
    if (originalPort.toString().includes(':')) {
      // If the port is locked - we return it - no need to query for it with the code below
      return `0.0.0.0:${originalPort.split(':')[0]}`;
    }

    const result = yield exec(`docker-compose -p ${runName} -f "${pathToCompose}" port ${serviceName} ${originalPort}`);
    return result.stdout.replace('\n', '');
  });
