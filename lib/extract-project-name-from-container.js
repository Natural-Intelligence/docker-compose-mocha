
/* eslint no-console: 0 */
// @flow

module.exports = function extractProjectNameFromContainer(container /* : string */) /* : string */ {
  return container.split('_')[0].split(' ')[1];
};
