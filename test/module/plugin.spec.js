import { expect } from 'chai';
import { injectPlugin, filterPlugin, sortPlugin } from '../../src/module/plugin.js';

describe('Testing plugin', () => {
  const fn = () => null;
  const fnOutputSchema = () => true;

  it('Testing fn', () => {
    expect(fn()).to.equal(null);
    expect(fnOutputSchema()).to.equal(true);
  });

  it('Testing nested prefix', () => {
    const result = filterPlugin({
      name: 'filter-plugin-name',
      target: 'key',
      requires: ['req'],
      fn
    })('prefix');
    expect(result.target).to.equal('prefix.key');
    expect(result.requires({})).to.deep.equal(['prefix.req']);
  });

  it('Testing nested prefix with root reference', () => {
    const result = filterPlugin({
      name: 'filter-plugin-name',
      target: 'key',
      requires: ['/req'],
      fn
    })('prefix');
    expect(result.target).to.equal('prefix.key');
    expect(result.requires({})).to.deep.equal(['req']);
  });

  it('Testing top level prefix', () => {
    const result = filterPlugin({
      name: 'filter-plugin-name',
      target: 'key',
      requires: ['req'],
      fn
    })('');
    expect(result.target).to.equal('key');
    expect(result.requires({})).to.deep.equal(['req']);
  });

  it('Testing nested prefix with star target', () => {
    const result = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: ['*'],
      fn
    })('prefix');
    expect(result.target).to.equal('prefix.');
    expect(result.requires({})).to.deep.equal(['prefix.']);
  });

  it('Testing top level prefix with star target', () => {
    const result = filterPlugin({
      name: 'filter-plugin-name',
      target: '*',
      requires: ['*'],
      fn
    })('');
    expect(result.target).to.equal('');
    expect(result.requires({})).to.deep.equal(['']);
  });

  it('Testing plugin types', () => {
    const resultInject = injectPlugin({
      name: 'inject-plugin-name', target: '*', requires: [], fn, schema: { fnOutput: fnOutputSchema }
    })('');
    const resultFilter = filterPlugin({
      name: 'filter-plugin-name', target: '*', requires: [], fn
    })('');
    const resultSort = sortPlugin({
      name: 'sort-plugin-name', target: '*', requires: [], fn
    })('');
    expect(resultInject.type).to.equal('INJECT');
    expect(resultFilter.type).to.equal('FILTER');
    expect(resultSort.type).to.equal('SORT');
  });
});
