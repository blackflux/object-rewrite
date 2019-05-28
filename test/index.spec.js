const expect = require('chai').expect;
const index = require('../src/index');

describe('Testing Package', () => {
  it('Testing Exposed', () => {
    expect(Object.keys(index)).to.deep.equal([
      'injectPlugin',
      'filterPlugin',
      'sortPlugin',
      'rewriter'
    ]);
  });
});
