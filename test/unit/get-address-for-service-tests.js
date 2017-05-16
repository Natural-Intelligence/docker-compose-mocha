

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const Promise = require('bluebird');
const childProcess = require('child-process-promise');
const getAddressForService = require('./../../lib/get-address-for-service');

const { coroutine } = Promise;

let sandbox;

describe('getAddressForService', () => {
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should handle the exposed port correctly when port is not random', coroutine(function* () {
    const spy = sandbox.spy(childProcess, 'exec');
    yield getAddressForService('test', 'stam-path', 'service', '3000:3000');
    expect(spy.callCount).to.equal(0);
  }));

  it('should handle ports which are also a number', coroutine(function* () {
    sandbox.stub(childProcess, 'exec', () => Promise.resolve({
      stdout: 'dfasdfas',
    }));

    yield getAddressForService('test', 'stam-path', 'service', 3000);
  }));
});
