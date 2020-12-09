const { expect } = require('chai');
const { injectPlugin } = require('../../../src/module/plugin');
const getPluginTargetMap = require('../../../src/module/rewriter/get-plugin-target-map');

describe('Testing get-plugin-target-map.js', () => {
  let fn;
  let schema;
  let mkPlugin;
  before(() => {
    fn = () => 'value';
    schema = (e) => typeof e === 'string';
    mkPlugin = (target, requires) => injectPlugin({
      target, requires, fn, schema
    })('x');
  });

  it('Testing fn', () => {
    expect(fn()).to.equal('value');
    expect(schema('str')).to.equal(true);
  });

  it('Testing sorting', () => {
    const p1 = mkPlugin('a', ['b']);
    const p2 = mkPlugin('b', []);
    const p3 = mkPlugin('c', ['b']);
    expect(getPluginTargetMap([p1, p2, p3])).to.deep.equal({
      x: [
        { ...p2, requires: [] },
        { ...p1, requires: ['x.b'] },
        { ...p3, requires: ['x.b'] }
      ]
    });
  });
});
