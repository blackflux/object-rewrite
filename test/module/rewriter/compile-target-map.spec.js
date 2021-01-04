const { expect } = require('chai');
const { injectPlugin } = require('../../../src/module/plugin');
const compileTargetMap = require('../../../src/module/rewriter/compile-target-map');

describe('Testing get-plugin-target-map.js', () => {
  let fn;
  let schema;
  let mkPlugin;
  before(() => {
    fn = () => 'value';
    schema = (e) => typeof e === 'string';
    mkPlugin = (target, requires, prefix) => injectPlugin({
      target, requires, fn, schema
    })(prefix);
  });

  it('Testing fn', () => {
    expect(fn()).to.equal('value');
    expect(schema('str')).to.equal(true);
  });

  it('Testing sorting', () => {
    const p1 = mkPlugin('a', ['b'], 'x');
    const p2 = mkPlugin('b', [], 'x');
    const p3 = mkPlugin('c', ['b'], 'x');
    const r = compileTargetMap('inject', [p1, p2, p3]);
    expect(r).to.deep.equal({
      x: [
        { ...p2, requires: [] },
        { ...p1, requires: ['x.b'] },
        { ...p3, requires: ['x.b'] }
      ]
    });
  });
});
