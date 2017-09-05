
/* eslint no-console: 0 */
const { exec } = require('child-process-promise');

module.exports = {
  dockerPullImageByName: function dockerPullImageByName(name) {
    console.log(`Pulling image ${name}...`);
    return exec(`docker pull ${name}`);
  },
};
