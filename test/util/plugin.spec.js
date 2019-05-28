const { expect } = require('chai');
const { injectPlugin, filterPlugin, sortPlugin } = require('../../src/util/plugin');

describe('Testing plugin', () => {
  it('Testing nested prefix', () => {
    const result = filterPlugin({
      target: 'key',
      requires: ['req'],
      fn: () => {}
    })('prefix');
    expect(result.target).to.equal('prefix.key');
    expect(result.requires).to.deep.equal(['prefix.req']);
  });

  it('Testing top level prefix', () => {
    const result = filterPlugin({
      target: 'key',
      requires: ['req'],
      fn: () => {}
    })('');
    expect(result.target).to.equal('key');
    expect(result.requires).to.deep.equal(['req']);
  });

  it('Testing nested prefix with star target', () => {
    const result = filterPlugin({
      target: '*',
      requires: ['*'],
      fn: () => {}
    })('prefix');
    expect(result.target).to.equal('prefix.');
    expect(result.requires).to.deep.equal(['prefix.']);
  });

  it('Testing top level prefix with star target', () => {
    const result = filterPlugin({
      target: '*',
      requires: ['*'],
      fn: () => {}
    })('');
    expect(result.target).to.equal('');
    expect(result.requires).to.deep.equal(['']);
  });

  it('Testing plugin types', () => {
    const resultInject = injectPlugin({ target: '*', requires: [], fn: () => {} })('');
    const resultFilter = filterPlugin({ target: '*', requires: [], fn: () => {} })('');
    const resultSort = sortPlugin({ target: '*', requires: [], fn: () => {} })('');
    expect(resultInject.type).to.equal('INJECT');
    expect(resultFilter.type).to.equal('FILTER');
    expect(resultSort.type).to.equal('SORT');
  });
});
