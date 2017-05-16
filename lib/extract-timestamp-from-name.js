// @flow

function extractTimestampFromName(containerName/* : string */, divider/* : string */) {
  return Number(containerName.split('_')[0].split(divider)[1]);
}

module.exports = extractTimestampFromName;
