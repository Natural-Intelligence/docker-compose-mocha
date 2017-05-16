// @flow
/* eslint no-console: 0*/


const exec = require('child-process-promise').exec;

module.exports = function dockerKillNetworkByProjectName(projectName /* : string */) {
  console.log(`Removing network for project name: ${projectName}...`);
  return exec(`docker network ls | grep ${projectName} | awk '{print $2}' | xargs docker network rm`);
};
