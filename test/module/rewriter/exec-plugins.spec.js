const { expect } = require('chai');
const plugin = require('../../../src/module/plugin');
const execPlugins = require('../../../src/module/rewriter/exec-plugins');

describe('Testing exec-plugins.js', () => {
  let mkFilterPlugin;
  let mkInjectPlugin;
  let mkSortPlugin;
  before(() => {
    const mkPlugin = (type, target, fn, schema) => plugin[`${type}Plugin`]({
      target, requires: [], fn, schema
    })('');
    mkFilterPlugin = (...args) => mkPlugin('filter', ...args);
    mkInjectPlugin = (...args) => mkPlugin('inject', ...args);
    mkSortPlugin = (...args) => mkPlugin('sort', ...args);
  });

  it('Testing filter plugins', () => {
    const p1 = mkFilterPlugin('*', ({ value }) => value.a === 1);
    expect(execPlugins('FILTER', [p1], { value: { a: 1 } })).to.equal(true);
    expect(execPlugins('FILTER', [p1], { value: { a: 2 } })).to.equal(false);
  });

  it('Testing inject plugins (as string)', () => {
    const isString = (e) => typeof e === 'string';
    const p1 = mkInjectPlugin('a', () => 'v1', isString);
    const p2 = mkInjectPlugin('b', () => 'v2', isString);
    const p3 = mkInjectPlugin('c', () => 'v3', isString);
    const value = {};
    const r = execPlugins('INJECT', [p1, p2, p3], { value });
    expect(r).to.deep.equal([]);
    expect(value).to.deep.equal({
      a: 'v1',
      b: 'v2',
      c: 'v3'
    });
  });

  it('Testing inject plugins (as object)', () => {
    const isNumber = (e) => typeof e === 'number';
    const p1 = mkInjectPlugin('*', () => ({ x: 0 }), { x: isNumber });
    const p2 = mkInjectPlugin('*', () => ({ y: 1 }), { y: isNumber });
    const p3 = mkInjectPlugin('*', () => ({ z: 2 }), { z: isNumber });
    const value = {};
    const r = execPlugins('INJECT', [p1, p2, p3], { value });
    expect(r).to.deep.equal([]);
    expect(value).to.deep.equal({ x: 0, y: 1, z: 2 });
  });

  it('Testing inject plugins (as promise)', async () => {
    const p1 = mkInjectPlugin('a', () => Promise.resolve('v1'), (e) => typeof e === 'string');
    const value = {};
    const r = execPlugins('INJECT', [p1], { value });
    expect(r.length).to.equal(1);
    expect(value).to.deep.equal({});
    await Promise.all(r.map((f) => f()));
    expect(value).to.deep.equal({ a: 'v1' });
  });

  it('Testing sort plugins', () => {
    const p1 = mkSortPlugin('*', ({ value }) => value.a);
    expect(execPlugins('SORT', [p1], { value: { a: 1 } })).to.deep.equal([1]);
    expect(execPlugins('SORT', [p1], { value: { a: 2 } })).to.deep.equal([2]);
  });
});
