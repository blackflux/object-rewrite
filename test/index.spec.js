import index from '../src/index';

const expect = require('chai').expect;

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
