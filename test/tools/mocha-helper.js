const { coroutine } = require('bluebird');

const simulateMochaRun = coroutine(function* (initCode, testCode) {
  let mochaBeforeReceivedMethod;
  let mochaAfterReceivedMethod;

  const mochaBefore = (b) => {
    mochaBeforeReceivedMethod = b;
  };

  const mochaAfter = (a) => {
    mochaAfterReceivedMethod = a;
  };

  initCode(mochaBefore, mochaAfter);
  yield mochaBeforeReceivedMethod();
  yield testCode();
  yield mochaAfterReceivedMethod();
});

module.exports = {
  simulateMochaRun,
};
