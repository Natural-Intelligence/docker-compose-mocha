// @flow

function extractContainerIdFromName(containerName/* : string */, divider/* : string */) {
  return containerName.split('_')[0].split(divider)[0].split(' ')[0];
}

module.exports = extractContainerIdFromName;
