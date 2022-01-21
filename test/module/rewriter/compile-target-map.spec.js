import { expect } from 'chai';
import objectScan from 'object-scan';
import { injectPlugin } from '../../../src/module/plugin';
import compileTargetMap from '../../../src/module/rewriter/compile-target-map';

describe('Testing get-plugin-target-map.js', () => {
  let fn;
  let fnOutputSchema;
  let mkPlugin;
  before(() => {
    fn = () => 'value';
    fnOutputSchema = (e) => typeof e === 'string';
    mkPlugin = (name, target, requires, prefix) => injectPlugin({
      name, target, requires, fn, schema: { fnOutput: fnOutputSchema }
    })(prefix);
  });

  it('Testing fn', () => {
    expect(fn()).to.equal('value');
    expect(fnOutputSchema('str')).to.equal(true);
  });

  it('Testing sorting', () => {
    const p1 = mkPlugin('A', 'a', ['b'], 'x');
    const p2 = mkPlugin('B', 'b', [], 'x');
    const p3 = mkPlugin('C', 'c', ['b'], 'x');
    const r = compileTargetMap('inject', [p1, p2, p3], {});
    objectScan(['**.requires'], {
      filterFn: ({ parent, property, value }) => {
        // eslint-disable-next-line no-param-reassign
        parent[property] = value({});
      }
    })(r);
    expect(r).to.deep.equal({
      x: [
        { ...p2, requires: [] },
        { ...p1, requires: ['x.b'] },
        { ...p3, requires: ['x.b'] }
      ]
    });
  });
});
