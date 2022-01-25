import { expect } from 'chai';
import * as index from '../src/index.js';

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
