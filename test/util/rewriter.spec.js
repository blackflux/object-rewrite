const { expect } = require('chai');
const rewriter = require('../../src/util/rewriter');
const { injectPlugin, filterPlugin, sortPlugin } = require('../../src/util/plugin');

describe('Testing rewriter', () => {
  it('Testing inject', () => {
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['idPlus'];
    const plugin = injectPlugin({
      target: 'idPlus',
      requires: ['id'],
      fn: ({ value }) => value.id + 1
    });
    const rew = rewriter({
      '': [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ idPlus: 3 }, { idPlus: 2 }]);
  });

  it('Testing filter', () => {
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id'];
    const plugin = filterPlugin({
      target: '*',
      requires: ['id'],
      fn: ({ value }) => value.id === 1
    });
    const rew = rewriter({
      '': [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 1 }]);
  });

  it('Testing sort', () => {
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id'];
    const plugin = sortPlugin({
      target: '*',
      requires: ['id'],
      fn: ({ value }) => value.id
    });
    const rew = rewriter({
      '': [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 1 }, { id: 2 }]);
  });

  it('Testing inject + filter + sort', () => {
    const data = [{ id: 0 }, { id: 1 }, { id: 2 }];
    const fields = ['id'];
    const plugin1 = injectPlugin({
      target: 'idNeg',
      requires: ['id'],
      fn: ({ value }) => -value.id
    });
    const plugin2 = filterPlugin({
      target: '*',
      requires: ['idNeg'],
      fn: ({ value }) => [-2, -1].includes(value.idNeg)
    });
    const plugin3 = sortPlugin({
      target: '*',
      requires: ['idNeg'],
      fn: ({ value }) => value.idNeg
    });
    const rew = rewriter({
      '': [plugin1, plugin2, plugin3]
    })(fields);
    expect(rew.toRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 2 }, { id: 1 }]);
  });
});
