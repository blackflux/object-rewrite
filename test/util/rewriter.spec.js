const get = require('lodash.get');
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

  it('Testing inject is bottom up', () => {
    const data = [
      { id: 2, c: [{ id: 3 }, { id: 4 }] },
      { id: 1, c: [{ id: 5 }, { id: 6 }] }
    ];
    const fields = ['idSum', 'c.idSum'];
    const plugin = injectPlugin({
      target: 'idSum',
      requires: ['id'],
      fn: ({ value }) => value.id + (value.c || []).reduce((p, c) => p + c.id, 0)
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(['id', 'c.id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([
      { idSum: 9, c: [{ idSum: 3 }, { idSum: 4 }] },
      { idSum: 12, c: [{ idSum: 5 }, { idSum: 6 }] }
    ]);
  });

  it('Testing filter is bottom up', () => {
    const data = [
      { id: 2, c: [{ id: 3 }, { id: 4 }] },
      { id: 1, c: [{ id: 5 }, { id: 6 }] }
    ];
    const fields = ['id', 'c.id'];
    const plugin = filterPlugin({
      target: '*',
      requires: ['id'],
      fn: ({ value }) => (value.c || []).length !== 0 || value.id === 6
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 1, c: [{ id: 6 }] }]);
  });

  it('Testing sort is bottom up', () => {
    const data = [
      { id: 1, c: [{ id: 4 }, { id: 5 }] },
      { id: 2, c: [{ id: 6 }, { id: 3 }] }
    ];
    const fields = ['id', 'c.id'];
    const plugin = sortPlugin({
      target: '*',
      requires: ['id'],
      fn: ({ value }) => get(value, 'c[0].id', value.id)
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([
      { id: 2, c: [{ id: 3 }, { id: 6 }] },
      { id: 1, c: [{ id: 4 }, { id: 5 }] }
    ]);
  });

  it('Testing inject can overwrite existing field', () => {
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id'];
    const plugin = injectPlugin({
      target: 'id',
      requires: ['id'],
      fn: ({ value }) => value.id + 1
    });
    const rew = rewriter({
      '': [plugin]
    })(fields);
    expect(rew.toRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 3 }, { id: 2 }]);
  });
});
