const { expect } = require('chai');
const validationCompile = require('../../../src/logic/plugin/validation-compile');

describe('Testing validation-compile.js', () => {
  it('Testing function', () => {
    const fn = validationCompile((e) => typeof e === 'string');
    expect(fn('str')).to.equal(true);
    expect(fn(1)).to.equal(false);
  });

  it('Testing array', () => {
    const fn = validationCompile([(e) => typeof e === 'string']);
    expect(fn(['str'])).to.equal(true);
    expect(fn([1])).to.equal(false);
    expect(fn('str')).to.equal(false);
  });

  it('Testing obj', () => {
    const fn = validationCompile({ key: (e) => typeof e === 'string' });
    expect(fn({ key: 'str' })).to.equal(true);
    expect(fn({ key: 'str', other: 'str' })).to.equal(false);
    expect(fn({})).to.equal(false);
    expect(fn({ key: 1 })).to.equal(false);
    expect(fn('str')).to.equal(false);
  });
});
