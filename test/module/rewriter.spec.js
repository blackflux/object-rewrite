import get from 'lodash.get';
import { expect } from 'chai';
import shuffle from 'lodash.shuffle';
import rewriter from '../../src/module/rewriter.js';
import { injectPlugin, filterPlugin, sortPlugin } from '../../src/module/plugin.js';

describe('Testing rewriter', () => {
  it('Testing name not unique', () => {
    const fn = () => null;
    expect(fn()).to.equal(null);
    const mkPlugin = () => sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: [],
      fn
    });
    expect(() => rewriter({ '': [mkPlugin(), mkPlugin()] }, []))
      .to.throw('Plugin name "sort-plugin-name" not unique');
  });

  it('Testing inject', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['idPlus'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'idPlus',
      requires: ['id'],
      schema: {
        fnInput: {
          id: (r) => Number.isInteger(r)
        },
        fnOutput: (r) => Number.isInteger(r)
      },
      fn: ({ value }) => value.id + 1
    });
    const Rew = rewriter({
      '': [plugin]
    }, dataStoreFields);
    expect(Rew.init([]).activePlugins).to.deep.equal([]);
    const rew = Rew.init(fields);
    expect(rew.activePlugins.map(({ name }) => name)).to.deep.equal(['inject-plugin-name']);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ idPlus: 3 }, { idPlus: 2 }]);
  });

  it('Testing inject object', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id', 'meta.id'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'meta',
      schema: {
        fnOutput: [{
          id: (r) => Number.isInteger(r)
        }]
      },
      requires: ['id'],
      fn: ({ value }) => [{ id: value.id + 1 }]
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 2, meta: [{ id: 3 }] }, { id: 1, meta: [{ id: 2 }] }]);
  });

  it('Testing inject deep merge', () => {
    [
      { name: (r) => typeof r === 'string', desc: (r) => typeof r === 'string' },
      (r) => r instanceof Object && !Array.isArray(r)
    ].forEach((fnOutputSchema) => {
      const dataStoreFields = ['name', 'desc', 'property.name', 'property.desc'];
      const data = [{ name: 'name-en', desc: 'desc-en', property: { name: 'name-en', desc: 'desc-en' } }];
      const fields = ['name', 'desc', 'property.name', 'property.desc'];
      const plugin = injectPlugin({
        name: 'inject-plugin-name',
        target: '*',
        schema: { fnOutput: fnOutputSchema },
        requires: ['name', 'desc'],
        fn: () => ({ name: 'name-fr', desc: 'desc-fr' })
      });
      const rew = rewriter({
        '': [plugin],
        property: [plugin]
      }, dataStoreFields).init(fields);
      expect(rew.fieldsToRequest).to.deep.equal(['name', 'desc', 'property.name', 'property.desc']);
      rew.rewrite(data);
      expect(data).to.deep.equal([{
        name: 'name-fr',
        desc: 'desc-fr',
        property: { name: 'name-fr', desc: 'desc-fr' }
      }]);
    });
  });

  it('Testing inject with **', () => {
    const dataStoreFields = ['**.id'];
    const data = {
      data: [
        { id: 2, c: [{ id: 3 }, { id: 4 }] },
        { id: 1, c: [{ id: 5 }, { id: 6 }] }
      ]
    };
    const fields = ['**.id'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'id',
      requires: ['id'],
      schema: { fnOutput: (r) => Number.isInteger(r) },
      fn: ({ value }) => (value.id ? value.id + 1 : 0)
    });
    const rew = rewriter({
      '**': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal({
      data: [
        { id: 3, c: [{ id: 4 }, { id: 5 }] },
        { id: 2, c: [{ id: 6 }, { id: 7 }] }
      ]
    });
  });

  it('Testing inject with context', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['idPlus'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'idPlus',
      requires: ['id'],
      schema: { fnOutput: (r) => Number.isInteger(r) },
      fn: ({ value, context }) => value.id + context.inc
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data, { inc: 2 });
    expect(data).to.deep.equal([{ idPlus: 4 }, { idPlus: 3 }]);
  });

  it('Testing filter array element', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id'];
    const plugin = filterPlugin({
      name: 'inject-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => value.id === 1
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 1 }]);
  });

  it('Testing filter object key', () => {
    const dataStoreFields = ['obj.id'];
    const data = [{ obj: { id: 2 } }, { obj: { id: 1 } }];
    const fields = ['obj.id'];
    const plugin = filterPlugin({
      name: 'inject-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => value.id === 1
    });
    const rew = rewriter({
      obj: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{}, { obj: { id: 1 } }]);
  });

  it('Testing sort', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id'];
    const plugin = sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => value.id
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 1 }, { id: 2 }]);
  });

  it('Testing sort list primitive', () => {
    const dataStoreFields = ['numbers'];
    const data = [{ numbers: [2, 1] }];
    const fields = ['numbers'];
    const plugin = sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: [],
      fn: ({ value }) => value
    });
    const rew = rewriter({
      numbers: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ numbers: [1, 2] }]);
  });

  it('Testing filter list primitive', () => {
    const dataStoreFields = ['numbers'];
    const data = [{ numbers: [2, 1] }];
    const fields = ['numbers'];
    const plugin = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: [],
      fn: ({ value }) => value === 2
    });
    const rew = rewriter({
      numbers: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ numbers: [2] }]);
  });

  it('Testing filter non-list primitive', () => {
    const dataStoreFields = ['numbers'];
    const data = [{ numbers: 2 }];
    const fields = ['numbers'];
    const plugin = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: [],
      fn: ({ value }) => value === 1
    });
    const rew = rewriter({
      numbers: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{}]);
  });

  it('Testing multiple sort plugins', () => {
    const dataStoreFields = ['idA', 'idB'];
    const data = [
      { idA: 2, idB: 4 },
      { idA: 2, idB: 3 },
      { idA: 1, idB: 2 },
      { idA: 1, idB: 1 }
    ];
    const fields = ['idA', 'idB'];
    const plugin1 = sortPlugin({
      name: 'sort-plugin1-name',
      target: '*',
      requires: ['idA'],
      fn: ({ value }) => value.idA
    });
    const plugin2 = sortPlugin({
      name: 'sort-plugin2-name',
      target: '*',
      requires: ['idB'],
      fn: ({ value }) => value.idB
    });
    const rew = rewriter({
      '': [plugin1, plugin2]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([
      { idA: 1, idB: 1 },
      { idA: 1, idB: 2 },
      { idA: 2, idB: 3 },
      { idA: 2, idB: 4 }
    ]);
  });

  it('Testing inject + filter + sort', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 0 }, { id: 1 }, { id: 2 }];
    const fields = ['id'];
    const plugin1 = injectPlugin({
      name: 'inject-plugin-name',
      target: 'idNeg',
      requires: ['id'],
      schema: { fnOutput: (r) => Number.isInteger(r) },
      fn: ({ value }) => -value.id
    });
    const plugin2 = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: ['idNeg'],
      fn: ({ value }) => [-2, -1].includes(value.idNeg)
    });
    const plugin3 = sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: ['idNeg'],
      fn: ({ value }) => value.idNeg
    });
    const rew = rewriter({
      '': [plugin1, plugin2, plugin3]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 2 }, { id: 1 }]);
  });

  it('Testing inject is bottom up', () => {
    const dataStoreFields = ['id', 'c.id'];
    const data = [
      { id: 2, c: [{ id: 3 }, { id: 4 }] },
      { id: 1, c: [{ id: 5 }, { id: 6 }] }
    ];
    const fields = ['idSum', 'c.idSum'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'idSum',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['id'],
      fn: ({ value }) => value.id + (value.c || []).reduce((p, c) => p + c.id, 0)
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['id', 'c.id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([
      { idSum: 9, c: [{ idSum: 3 }, { idSum: 4 }] },
      { idSum: 12, c: [{ idSum: 5 }, { idSum: 6 }] }
    ]);
  });

  it('Testing filter is bottom up', () => {
    const dataStoreFields = ['id', 'c.id'];
    const data = [
      { id: 2, c: [{ id: 3 }, { id: 4 }] },
      { id: 1, c: [{ id: 5 }, { id: 6 }] }
    ];
    const fields = ['id', 'c.id'];
    const plugin = filterPlugin({
      name: 'inject-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => (value.c || []).length !== 0 || value.id === 6
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 1, c: [{ id: 6 }] }]);
  });

  it('Testing sort is bottom up', () => {
    const dataStoreFields = ['id', 'c.id'];
    const data = [
      { id: 1, c: [{ id: 4 }, { id: 5 }] },
      { id: 2, c: [{ id: 6 }, { id: 3 }] }
    ];
    const fields = ['id', 'c.id'];
    const plugin = sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => get(value, 'c[0].id', value.id)
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([
      { id: 2, c: [{ id: 3 }, { id: 6 }] },
      { id: 1, c: [{ id: 4 }, { id: 5 }] }
    ]);
  });

  it('Testing sort duplicate element', () => {
    const dataStoreFields = ['id', 'c.id'];
    const eA = { id: 5 };
    const data = [
      eA,
      { id: 1, c: [{ id: 4 }, eA] },
      { id: 2, c: [{ id: 6 }, { id: 3 }] }
    ];
    const fields = ['id', 'c.id'];
    const plugin = sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => get(value, 'c[0].id', value.id)
    });
    const rew = rewriter({
      '': [plugin],
      c: [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data);
    expect(data).to.deep.equal([
      { id: 2, c: [{ id: 3 }, { id: 6 }] },
      { id: 1, c: [{ id: 4 }, eA] },
      eA
    ]);
  });

  it('Testing sort and limit', () => {
    const dataStoreFields = ['id'];
    const data = [
      { id: 3 },
      { id: 1 },
      { id: 2 }
    ];
    const fields = ['id'];
    const plugin = sortPlugin({
      name: 'sort-plugin-name',
      target: '*',
      requires: ['id'],
      fn: ({ value }) => value.id,
      limit: ({ context }) => context.limit
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(fields);
    rew.rewrite(data, { limit: 2 });
    expect(data).to.deep.equal([{ id: 1 }, { id: 2 }]);
  });

  it('Testing inject can overwrite existing field', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['id'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'id',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['id'],
      fn: ({ value }) => value.id + 1
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ id: 3 }, { id: 2 }]);
  });

  it('Testing inject can overwrite existing dynamic field', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['idPlus'];
    const plugin1 = injectPlugin({
      name: 'inject-plugin1-name',
      target: 'idPlus',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['id'],
      fn: ({ value }) => value.id + 1
    });
    const plugin2 = injectPlugin({
      name: 'inject-plugin2-name',
      target: 'idPlus',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['idPlus'],
      fn: ({ value }) => value.idPlus + 1
    });
    const rew = rewriter({
      '': [plugin1, plugin2]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ idPlus: 4 }, { idPlus: 3 }]);
  });

  it('Testing dependent injects', () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['c'];
    const p1 = injectPlugin({
      name: 'inject-plugin1-name',
      target: 'b',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      fn: ({ value }) => value.a + 1
    });
    const p2 = injectPlugin({
      name: 'inject-plugin2-name',
      target: 'c',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['b'],
      fn: ({ value }) => value.b + 1
    });
    const rew = rewriter({
      '': [p1, p2]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ c: 4 }, { c: 3 }]);
  });

  it('Testing async inject', async () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['b'];
    const p1 = injectPlugin({
      name: 'inject-plugin-name',
      target: 'b',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      fn: async ({ value }) => value.a + 1
    });
    const rew = rewriter({
      '': [p1]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);
    await rew.rewriteAsync(data);
    expect(data).to.deep.equal([{ b: 3 }, { b: 2 }]);
  });

  it('Testing async inject with dependent sync plugin', async () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['b', 'c'];
    const p1 = injectPlugin({
      name: 'inject-plugin-name-async',
      target: 'b',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      fn: async ({ value }) => value.a + 1
    });
    const p2 = injectPlugin({
      name: 'inject-plugin-name-sync',
      target: 'c',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['b'],
      fn: ({ value }) => value.b
    });
    const rew = rewriter({ '': [p1, p2] }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);
    await rew.rewriteAsync(data);
    expect(data).to.deep.equal([{ b: 3, c: 3 }, { b: 2, c: 2 }]);
  });

  it('Testing async inject with beforeFn', async () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['b'];
    const p1 = injectPlugin({
      name: 'inject-plugin-name',
      target: 'b',
      schema: { fnOutput: [(r) => Number.isInteger(r)] },
      requires: ['a'],
      onRewrite: ({ cache }) => {
        // eslint-disable-next-line no-param-reassign
        cache.data = [];
        return true;
      },
      beforeFn: ({ value, cache }) => {
        cache.data.push(value.a);
      },
      fn: async ({ cache }) => cache.data
    });
    const rew = rewriter({
      '': [p1]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);
    await rew.rewriteAsync(data);
    expect(data).to.deep.equal([{ b: [1, 2] }, { b: [1, 2] }]);
  });

  it('Testing nested inject', async () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['settings.a', 'settings.b'];
    const p1 = injectPlugin({
      name: 'inject-plugin1-name',
      target: 'settings.a',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      fn: ({ value }) => value.a
    });
    const p2 = injectPlugin({
      name: 'inject-plugin2-name',
      target: 'settings.b',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      fn: ({ value }) => value.a + 1
    });
    const rew = rewriter({
      '': [p1, p2]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ settings: { a: 2, b: 3 } }, { settings: { a: 1, b: 2 } }]);
  });

  it('Testing onRewrite', async () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['a'];
    const logs = [];
    const mkPlugin = (name) => injectPlugin({
      name,
      target: 'a',
      requires: ['a'],
      schema: {
        rewriteContext: {
          enabled: (e) => typeof e === 'boolean'
        },
        fnOutput: (r) => Number.isInteger(r)
      },
      onRewrite: ({ context, cache }) => {
        logs.push('onRewrite');
        logs.push(`context = ${context.a}`);
        context.a = (context.a || 0) + 3;
        logs.push(`cache = ${cache.a}`);
        // eslint-disable-next-line no-param-reassign
        cache.a = (cache.a || 0) + 5;
        return context.enabled;
      },
      fn: ({ value, context, cache }) => {
        logs.push(`value = ${value.a}`);
        logs.push(`context = ${context.a}`);
        logs.push(`cache = ${cache.a}`);
        return value.a + context.a + cache.a;
      }
    });
    const p1 = mkPlugin('inject-plugin1-name');
    const p2 = mkPlugin('inject-plugin2-name');
    const rew = rewriter({
      '': [p1, p2]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);

    rew.rewrite(data, { enabled: false });
    expect(logs).to.deep.equal([
      'onRewrite', 'context = undefined', 'cache = undefined',
      'onRewrite', 'context = undefined', 'cache = undefined'
    ]);
    expect(data).to.deep.equal([{ a: 2 }, { a: 1 }]);

    logs.length = 0;
    rew.rewrite(data, { enabled: true });
    expect(logs).to.deep.equal([
      'onRewrite', 'context = undefined', 'cache = 5',
      'onRewrite', 'context = undefined', 'cache = 5',
      'value = 1', 'context = 3', 'cache = 10',
      'value = 14', 'context = 3', 'cache = 10',
      'value = 2', 'context = 3', 'cache = 10',
      'value = 15', 'context = 3', 'cache = 10'
    ]);
    expect(data).to.deep.equal([{ a: 28 }, { a: 27 }]);
  });

  it('Testing onInit and onRewrite executes once per plugin', async () => {
    const dataStoreFields = ['a', 'b.a'];
    const data = [{ a: 2, b: { a: 3 } }, { a: 1, b: { a: 4 } }];
    const fields = ['a', 'b.a'];
    const logs = [];
    const p1 = injectPlugin({
      name: 'inject-plugin-name',
      target: 'a',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      onInit: () => {
        logs.push('onInit');
        return true;
      },
      onRewrite: () => {
        logs.push('onRewrite');
        return true;
      },
      fn: ({ value }) => value.a + 1
    });
    const rew = rewriter({
      '': [p1, p1],
      b: [p1]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a', 'b.a']);

    rew.rewrite(data);
    expect(logs).to.deep.equal(['onInit', 'onRewrite']);
    expect(data).to.deep.equal([{ a: 4, b: { a: 4 } }, { a: 3, b: { a: 5 } }]);
  });

  it('Testing disabled', async () => {
    const dataStoreFields = ['a'];
    const data = [{ a: 2 }, { a: 1 }];
    const fields = ['a'];
    const p1 = injectPlugin({
      name: 'inject-plugin-name',
      target: 'a',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      onRewrite: () => false,
      fn: () => 3
    });
    const p2 = filterPlugin({
      name: 'filter-plugin-name',
      target: 'a',
      requires: ['a'],
      onInit: () => false,
      fn: () => false
    });
    const p3 = sortPlugin({
      name: 'sort-plugin-name',
      target: 'a',
      requires: ['a'],
      onRewrite: () => false,
      fn: () => []
    });
    expect(p1('').fn()).to.deep.equal(3);
    expect(p2('').fn()).to.deep.equal(false);
    expect(p3('').fn()).to.deep.equal([]);
    const rew = rewriter({
      '': [p1, p2, p3]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['a']);
    expect(rew.activePlugins).to.deep.equal([p1.meta, p3.meta]);

    rew.rewrite(data);
    expect(data).to.deep.equal([{ a: 2 }, { a: 1 }]);
  });

  it('Testing bad fn return', async () => {
    const p1 = injectPlugin({
      name: 'inject-plugin-name',
      target: 'a',
      schema: { fnOutput: (r) => Number.isInteger(r) },
      requires: ['a'],
      fn: () => undefined
    });
    expect(() => p1('').fn()).to.throw('inject-plugin-name: bad fn return value "undefined"');
  });

  it('Testing Bad Field Requested', () => {
    expect(() => rewriter({}, []).init(['id'])).to.throw('Bad Field Requested: id');
    const p1 = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: ['id'],
      fn: () => true
    });
    expect(p1('').fn()).to.equal(true);
    expect(() => rewriter({
      '': [p1]
    }, ['a']).init(['a'])).to.throw('Bad Field Requested: id');
  });

  it('Testing Bad Rewrite Context', () => {
    const log = [];
    const logger = { warn: (arg) => log.push(arg) };
    const p1 = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: [],
      schema: {
        rewriteContext: {
          enabled: (e) => typeof e === 'boolean'
        }
      },
      fn: () => false
    });
    expect(p1('').fn()).to.equal(false);
    const data = [{ a: 1 }];
    rewriter({ '': [p1] }, ['a'], logger)
      .init(['a'])
      .rewrite(data, {});
    expect(log).to.deep.equal([
      `Rewrite Context validation failure\n${JSON.stringify({
        origin: 'object-rewrite',
        options: {
          name: 'filter-plugin-name', target: '*', requires: [], schema: { rewriteContext: {} }
        }
      })}`
    ]);
    expect(data).to.deep.equal([{ a: 1 }]);
  });

  it('Testing Bad Init Context', () => {
    const log = [];
    const logger = { warn: (arg) => log.push(arg) };
    const p1 = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: [],
      schema: {
        initContext: {
          enabled: (e) => typeof e === 'boolean'
        }
      },
      fn: () => false
    });
    expect(p1('').fn()).to.equal(false);
    const data = [{ a: 1 }];
    rewriter({ '': [p1] }, ['a'], logger)
      .init(['a'], {})
      .rewrite(data, {});
    expect(log).to.deep.equal([
      `Init Context validation failure\n${JSON.stringify({
        origin: 'object-rewrite',
        options: {
          name: 'filter-plugin-name', target: '*', requires: [], schema: { initContext: {} }
        }
      })}`
    ]);
    expect(data).to.deep.equal([{ a: 1 }]);
  });

  it('Testing Bad Value', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 'x' }, { id: 1 }];
    const fields = ['idPlus'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'idPlus',
      requires: ['id'],
      schema: {
        fnInput: {
          id: (r) => Number.isInteger(r)
        },
        fnOutput: (r) => Number.isInteger(r)
      },
      fn: ({ value }) => value.id + 1
    });
    const Rew = rewriter({
      '': [plugin]
    }, dataStoreFields);
    expect(Rew.init([]).activePlugins).to.deep.equal([]);
    const rew = Rew.init(fields);
    expect(rew.activePlugins.map(({ name }) => name)).to.deep.equal(['inject-plugin-name']);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    expect(() => rew.rewrite(data)).to.throw(
      `Value Schema validation failure\n${
        JSON.stringify({
          origin: 'object-rewrite',
          value: { id: 'x' },
          options: {
            name: 'inject-plugin-name',
            target: 'idPlus',
            requires: ['id'],
            schema: { fnInput: {} }
          }
        })
      }`
    );
  });

  it('Testing Recursive Inject', () => {
    const dataStoreFields = [
      'parent',
      'child'
    ];
    const data = [{
      parent: 'location/d0f15c90-a309-4d78-a3ef-deffc8df3c84',
      child: 'address/2cfc6103-5aac-4866-91d5-cdd8bd1cbed7'
    }];
    const fields = ['id', 'parent', 'child', 'parentType', 'parentId'];

    // CHILD
    const childType = injectPlugin({
      name: 'inject/childType',
      target: 'childType',
      requires: ['child'],
      schema: {
        fnInput: {
          child: (r) => /^[^/]+\/[^/]+$/.test(r)
        },
        fnOutput: (r) => typeof r === 'string'
      },
      fn: ({ value }) => value.child.split('/')[0]
    });
    const childId = injectPlugin({
      name: 'inject/childId',
      target: 'childId',
      requires: ['child'],
      schema: {
        fnInput: {
          child: (r) => /^[^/]+\/[^/]+$/.test(r)
        },
        fnOutput: (r) => typeof r === 'string'
      },
      fn: ({ value }) => value.child.split('/')[1]
    });
    const childHash = injectPlugin({
      name: 'inject/childHash',
      target: 'childHash',
      requires: ['childType', 'childId'],
      schema: {
        fnInput: {
          childType: (r) => typeof r === 'string',
          childId: (r) => typeof r === 'string'
        },
        fnOutput: (r) => typeof r === 'string'
      },
      fn: ({ value }) => `${value.childType}#${value.childId}`
    });

    // PARENT
    const parentType = injectPlugin({
      name: 'inject/parentType',
      target: 'parentType',
      requires: ['parent'],
      schema: {
        fnInput: {
          parent: (r) => /^[^/]+\/[^/]+$/.test(r)
        },
        fnOutput: (r) => typeof r === 'string'
      },
      fn: ({ value }) => value.parent.split('/')[0]
    });
    const parentId = injectPlugin({
      name: 'inject/parentId',
      target: 'parentId',
      requires: ['parent'],
      schema: {
        fnInput: {
          parent: (r) => /^[^/]+\/[^/]+$/.test(r)
        },
        fnOutput: (r) => typeof r === 'string'
      },
      fn: ({ value }) => value.parent.split('/')[1]
    });
    const parentHash = injectPlugin({
      name: 'inject/parentHash',
      target: 'parentHash',
      requires: ['parentType', 'parentId'],
      schema: {
        fnInput: {
          parentType: (r) => typeof r === 'string',
          parentId: (r) => typeof r === 'string'
        },
        fnOutput: (r) => typeof r === 'string'
      },
      fn: ({ value }) => `${value.parentType}#${value.parentId}`
    });

    // ID
    const id = injectPlugin({
      name: 'inject/id',
      target: 'id',
      requires: ['parentHash', 'childHash'],
      schema: { fnOutput: (r) => typeof r === 'string' },
      fn: ({ value }) => `${value.parentHash}||${value.childHash}`
    });

    const Rew = rewriter({
      '': shuffle([id, childType, childId, parentType, parentId, childHash, parentHash])
    }, dataStoreFields);
    const rew = Rew.init(fields);
    expect(new Set(rew.activePlugins.map(({ name }) => name))).to.deep.equal(new Set([
      'inject/childType',
      'inject/childId',
      'inject/childHash',
      'inject/parentType',
      'inject/parentId',
      'inject/parentHash',
      'inject/id'
    ]));
    expect(rew.fieldsToRequest).to.deep.equal(['parent', 'child']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{
      child: 'address/2cfc6103-5aac-4866-91d5-cdd8bd1cbed7',
      id: 'location#d0f15c90-a309-4d78-a3ef-deffc8df3c84||address#2cfc6103-5aac-4866-91d5-cdd8bd1cbed7',
      parent: 'location/d0f15c90-a309-4d78-a3ef-deffc8df3c84',
      parentId: 'd0f15c90-a309-4d78-a3ef-deffc8df3c84',
      parentType: 'location'
    }]);
  });

  it('Testing dynamic require', () => {
    const dataStoreFields = ['id'];
    const data = [{ id: 2 }, { id: 1 }];
    const fields = ['idPlus'];
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'idPlus',
      requires: (ctx) => ctx.fields,
      schema: {
        fnInput: {
          id: (r) => Number.isInteger(r)
        },
        fnOutput: (r) => Number.isInteger(r)
      },
      fn: ({ value }) => value.id + 1
    });
    const Rew = rewriter({
      '': [plugin]
    }, dataStoreFields);
    expect(Rew.init([]).activePlugins).to.deep.equal([]);
    const rew = Rew.init(fields, { fields: ['id'] });
    expect(rew.activePlugins.map(({ name }) => name)).to.deep.equal(['inject-plugin-name']);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(data).to.deep.equal([{ idPlus: 3 }, { idPlus: 2 }]);
  });

  it('Testing prefix map order', () => {
    const dataStoreFields = ['idA', 'idB'];
    const data = [{ idA: [1], idB: [2] }];
    const logs = [];
    const fields = ['idA', 'idB'];
    const plugin1 = filterPlugin({
      name: 'filter-plugin1-name',
      target: '*',
      requires: [],
      fn: () => {
        logs.push(1);
        return true;
      }
    });
    const plugin2 = filterPlugin({
      name: 'filter-plugin2-name',
      target: '*',
      requires: [],
      fn: () => {
        logs.push(2);
        return true;
      }
    });
    const rew1 = rewriter({ idA: [plugin1], idB: [plugin2] }, dataStoreFields).init(fields);
    expect(rew1.fieldsToRequest).to.deep.equal(fields);
    rew1.rewrite(data);
    expect(data).to.deep.equal([{ idA: [1], idB: [2] }]);
    expect(logs).to.deep.equal([1, 2]);

    const rew2 = rewriter({ idB: [plugin2], idA: [plugin1] }, dataStoreFields).init(fields);
    expect(rew2.fieldsToRequest).to.deep.equal(fields);
    rew2.rewrite(data);
    expect(data).to.deep.equal([{ idA: [1], idB: [2] }]);
    expect(logs).to.deep.equal([1, 2, 2, 1]);
  });

  it('Testing onRewrite kwargs', () => {
    const dataStoreFields = ['id'];
    const data = { id: 1 };
    const fields = ['name'];
    let onRewriteKwargs;
    const plugin = injectPlugin({
      name: 'inject-plugin-name',
      target: 'name',
      onRewrite: (kwargs) => {
        onRewriteKwargs = Object.keys(kwargs);
        return true;
      },
      schema: { fnOutput: (r) => typeof r === 'string' },
      requires: ['id'],
      fn: ({ value }) => `name: ${String(value.id)}`
    });
    const rew = rewriter({
      '': [plugin]
    }, dataStoreFields).init(fields);
    expect(rew.fieldsToRequest).to.deep.equal(['id']);
    rew.rewrite(data);
    expect(onRewriteKwargs).to.deep.equal(['data', 'cache', 'context']);
    expect(data).to.deep.equal({ name: 'name: 1' });
  });
});
