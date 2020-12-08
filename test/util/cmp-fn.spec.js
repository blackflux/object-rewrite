const { expect } = require('chai');
const cmpFn = require('../../src/util/cmp-fn');

describe('Testing sort util', () => {
  it('Testing sort', () => {
    expect([[1, 1], [0, 3], [0, 2]].sort(cmpFn))
      .to.deep.equal([[0, 2], [0, 3], [1, 1]]);
  });

  it('Testing sort identical nested lists', () => {
    expect([[0], [0]].sort(cmpFn))
      .to.deep.equal([[0], [0]]);
  });
});
