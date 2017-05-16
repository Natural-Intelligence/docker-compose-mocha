const fs = require('fs');
const Promise = require('bluebird');
const pullTools = require('./docker-pull-image-by-name');
const yaml = require('js-yaml');

const { coroutine, promisify } = Promise;

module.exports = coroutine(
  function* (pathToCompose, startOnlyTheseServices = []) {
    const composeFileContent = yield (promisify(fs.readFile, { context: fs }))(pathToCompose, 'utf8');
    const doc = yaml.safeLoad(composeFileContent);

    // Support for Docker Compose v2 and higher
    const services = doc.services || doc;

    const images = Array.from(new Set(Object.keys(services)
      .map((service) => {
        if (startOnlyTheseServices.length > 0) {
          if (!startOnlyTheseServices.includes(service)) {
            return null;
          }
        }
        return services[service].image || null;
      })
      .filter(image => image !== null)));

    yield Promise
      .all(images
        .map(image => pullTools.dockerPullImageByName(image)));
  });
