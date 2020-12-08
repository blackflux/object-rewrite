const { expect } = require('chai');
const validationExtractKeys = require('../../src/util/validation-extract-keys');

describe('Testing validation-extract-keys.js', () => {
  it('Testing function', () => {
    const keys = validationExtractKeys('prefix', (e) => typeof e === 'string');
    expect(keys).to.deep.equal(['prefix']);
  });

  it('Testing array', () => {
    const keys = validationExtractKeys('prefix', [(e) => typeof e === 'string']);
    expect(keys).to.deep.equal(['prefix']);
  });

  it('Testing object', () => {
    const keys = validationExtractKeys('prefix', { key: (e) => typeof e === 'string' });
    expect(keys).to.deep.equal(['prefix.key']);
  });

  it('Testing object with empty string key', () => {
    const keys = validationExtractKeys('prefix', { '': (e) => typeof e === 'string' });
    expect(keys).to.deep.equal(['prefix.']);
  });

  it('Testing object with empty prefix', () => {
    const keys = validationExtractKeys('', { key: (e) => typeof e === 'string' });
    expect(keys).to.deep.equal(['.key']);
  });

  it('Testing object with empty string key with empty prefix', () => {
    const keys = validationExtractKeys('', { '': (e) => typeof e === 'string' });
    expect(keys).to.deep.equal(['.']);
  });
});
