const { expect } = require('chai');
const compileValidation = require('../../src/util/compile-validation');

describe('Testing compile-validation.js', () => {
  it('Testing function', () => {
    const fn = compileValidation((e) => typeof e === 'string');
    expect(fn('str')).to.equal(true);
    expect(fn(1)).to.equal(false);
  });

  it('Testing array', () => {
    const fn = compileValidation([(e) => typeof e === 'string']);
    expect(fn(['str'])).to.equal(true);
    expect(fn([1])).to.equal(false);
    expect(fn('str')).to.equal(false);
  });

  it('Testing obj', () => {
    const fn = compileValidation({ key: (e) => typeof e === 'string' });
    expect(fn({ key: 'str' })).to.equal(true);
    expect(fn({ key: 'str', other: 'str' })).to.equal(false);
    expect(fn({})).to.equal(false);
    expect(fn({ key: 1 })).to.equal(false);
    expect(fn('str')).to.equal(false);
  });
});
