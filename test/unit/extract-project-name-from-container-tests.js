
const { describe, it } = require('mocha');
const { expect } = require('chai');
const extractProjectNameFromContainer = require('./../../lib/extract-project-name-from-container');

describe('extractProjectNameFromContainer', () => {
  it('should extract the project name from the container stdout line', () => {
    const input = '233dfb33b22f cicontainerlodloutrinzzdivzz1481723893_dct_s1_1';
    expect(extractProjectNameFromContainer(input)).to.equal('cicontainerlodloutrinzzdivzz1481723893');
  });
});
