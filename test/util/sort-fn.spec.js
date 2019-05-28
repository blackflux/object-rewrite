const { expect } = require('chai');
const sortFn = require('../../src/util/sort-fn');

describe('Testing sort util', () => {
  it('Testing sort', () => {
    expect([[1, 1], [0, 3], [0, 2]].sort(sortFn))
      .to.deep.equal([[0, 2], [0, 3], [1, 1]]);
  });

  it('Testing sort identical nested lists', () => {
    expect([[0], [0]].sort(sortFn))
      .to.deep.equal([[0], [0]]);
  });
});
