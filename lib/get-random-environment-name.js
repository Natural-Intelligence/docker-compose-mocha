// @flow


exports.getRandomEnvironmentName = function (chance/* :any*/, minutesBackward/* :number*/ = 0) {
  const firstName/* :string*/= chance.first({ nationality: 'en' });
  const lastName/* :string*/ = chance.last({ nationality: 'en' });
  const envName/* :string*/ = `cicontainer${firstName}_${lastName}zzdivzz${(Math.floor(new Date() / 1000)) - (60 * minutesBackward)}`
    .toLowerCase();

  return {
    firstName,
    lastName,
    envName,
  };
};

exports.extractEnvFromEnvName = function (envName/* : string */) {
  const [firstName, lastName] = /^cicontainer(.*?)zzdivzz/.exec(envName)[1].split('_');

  return {
    firstName,
    lastName,
    envName,
  };
};
