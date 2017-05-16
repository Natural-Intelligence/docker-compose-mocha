// @flow
/* eslint no-console: 0*/


const exec = require('child-process-promise').exec;
const Promise = require('bluebird');

const { coroutine } = Promise;

module.exports = coroutine(function* () {
  console.log('Removing volumes which we don\'t need..');
  try {
    // http://stackoverflow.com/questions/17402345/ignore-empty-results-for-xargs-in-mac-os-x
    yield exec('(docker volume ls -q || echo :) | xargs docker volume rm');
  } catch (err) {
    console.log('No volumes require removal.. we\'re good to go');
  }

  return Promise.resolve();
});
