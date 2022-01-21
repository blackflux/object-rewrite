import { expect } from 'chai';
import cmpFn from '../../src/util/cmp-fn';

describe('Testing cmp-fn.js', () => {
  it('Testing sort', () => {
    expect([[1, 1], [0, 3], [0, 2]].sort(cmpFn))
      .to.deep.equal([[0, 2], [0, 3], [1, 1]]);
  });

  it('Testing sort identical nested lists', () => {
    expect([[0], [0]].sort(cmpFn))
      .to.deep.equal([[0], [0]]);
  });
});
