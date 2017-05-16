// @flow

const { exec } = require('child-process-promise');
const { coroutine } = require('bluebird');

const dockerStartByServiceName = coroutine(
  function* (runNameSpecific/* : string */,
    pathToComposeFile/* : string */,
    serviceName/* : string */) {
    const commandExec = `docker-compose -p ${runNameSpecific} -f "${pathToComposeFile}" start ${serviceName}`;
    return yield exec(commandExec);
  });

module.exports = dockerStartByServiceName;
