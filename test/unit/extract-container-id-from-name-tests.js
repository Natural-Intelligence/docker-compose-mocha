const { expect } = require('chai');
const { describe, it } = require('mocha');
const extractContainerIdFromName = require('./../../lib/extract-container-id-from-name');

const divider = 'zzdivzz';
describe('extractContainerIdFromName', () => {
  it('should extract the container id from its name', () => {
    const input = '233dfb33b22f cicontainerlodloutrinzzdivzz1481723893_dct_s1_1';
    expect(extractContainerIdFromName(input, divider)).to.equal('233dfb33b22f');
  });
});
