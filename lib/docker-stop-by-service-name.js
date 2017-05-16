// @flow

const { exec } = require('child-process-promise');
const { coroutine } = require('bluebird');

const dockerStopByServiceName = coroutine(
  function* (runNameSpecific/* : string */,
    pathToComposeFile/* : string */,
    serviceName/* : string */) {
    const commandExec = `docker-compose -p ${runNameSpecific} -f "${pathToComposeFile}" stop ${serviceName}`;
    return yield exec(commandExec);
  });

module.exports = dockerStopByServiceName;
