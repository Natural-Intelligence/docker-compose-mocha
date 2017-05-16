const exec = require('child-process-promise').exec;
const Promise = require('bluebird');

module.exports = Promise.coroutine(function* (runName, pathToCompose, serviceName) {
  return (yield exec(`docker-compose -p ${runName} -f "${pathToCompose}" logs ${serviceName}`)).stdout;
});
