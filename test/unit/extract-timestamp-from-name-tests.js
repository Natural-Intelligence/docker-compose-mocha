
const { expect } = require('chai');
const extractTimestampFromName = require('./../../lib/extract-timestamp-from-name');
const { describe, it } = require('mocha');

const divider = 'zzdivzz';
describe('extractTimestampFromName', () => {
  it('should extract the unix timestamp from the container name', () => {
    const input = '233dfb33b22f cicontainerlodloutrinzzdivzz1481723893_dct_s1_1';
    expect(extractTimestampFromName(input, divider)).to.equal(1481723893);
  });
});
