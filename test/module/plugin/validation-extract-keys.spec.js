import { expect } from 'chai';
import validationExtractKeys from '../../../src/module/plugin/validation-extract-keys.js';

describe('Testing validation-extract-keys.js', () => {
  let fn;

  before(() => {
    fn = (e) => typeof e === 'string';
  });

  it('Testing fn', () => {
    expect(fn('str')).to.equal(true);
  });

  it('Testing function', () => {
    const keys = validationExtractKeys('prefix', fn);
    expect(keys).to.deep.equal(['prefix']);
  });

  it('Testing array', () => {
    const keys = validationExtractKeys('prefix', [fn]);
    expect(keys).to.deep.equal(['prefix']);
  });

  it('Testing object', () => {
    const keys = validationExtractKeys('prefix', { key: fn });
    expect(keys).to.deep.equal(['prefix.key']);
  });

  it('Testing object with empty string key', () => {
    const keys = validationExtractKeys('prefix', { '': fn });
    expect(keys).to.deep.equal(['prefix.']);
  });

  it('Testing object with empty prefix', () => {
    const keys = validationExtractKeys('', { key: fn });
    expect(keys).to.deep.equal(['.key']);
  });

  it('Testing object with empty string key with empty prefix', () => {
    const keys = validationExtractKeys('', { '': fn });
    expect(keys).to.deep.equal(['.']);
  });
});
