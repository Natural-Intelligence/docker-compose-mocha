// @flow


const exec = require('child-process-promise').exec;

module.exports = function dockerKillByContainerId(id/* : string */) {
  return exec(`docker rm -f -v ${id}`);
};
