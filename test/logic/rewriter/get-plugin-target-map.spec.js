const { expect } = require('chai');
const { injectPlugin } = require('../../../src/module/plugin');
const getPluginTargetMap = require('../../../src/logic/rewriter/get-plugin-target-map');

describe('Testing get-plugin-target-map.js', () => {
  let fn;
  let schema;
  before(() => {
    fn = () => 'value';
    schema = (e) => typeof e === 'string';
  });

  it('Testing fn', () => {
    expect(fn()).to.equal('value');
    expect(schema('str')).to.equal(true);
  });

  it('Testing sorting', () => {
    const p1 = injectPlugin({
      target: 'a', requires: ['b'], fn, schema
    })('x');
    const p2 = injectPlugin({
      target: 'b', requires: [], fn, schema
    })('x');
    const p3 = injectPlugin({
      target: 'c', requires: ['b'], fn, schema
    })('x');
    expect(getPluginTargetMap([p1, p2, p3])).to.deep.equal({
      x: [
        { ...p2, requires: [] },
        { ...p1, requires: ['x.b'] },
        { ...p3, requires: ['x.b'] }
      ]
    });
  });
});
