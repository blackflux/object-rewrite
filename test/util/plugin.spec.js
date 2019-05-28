const { expect } = require('chai');
const plugin = require('../../src/util/plugin');

describe('Testing plugin', () => {
  it('Testing nested prefix', () => {
    const result = plugin.filter({
      target: 'key',
      requires: ['req'],
      fn: () => {}
    })('prefix');
    expect(result.target).to.equal('prefix.key');
    expect(result.requires).to.deep.equal(['prefix.req']);
  });

  it('Testing top level prefix', () => {
    const result = plugin.filter({
      target: 'key',
      requires: ['req'],
      fn: () => {}
    })('');
    expect(result.target).to.equal('key');
    expect(result.requires).to.deep.equal(['req']);
  });

  it('Testing nested prefix with star target', () => {
    const result = plugin.filter({
      target: '*',
      requires: ['*'],
      fn: () => {}
    })('prefix');
    expect(result.target).to.equal('prefix.');
    expect(result.requires).to.deep.equal(['prefix.']);
  });

  it('Testing top level prefix with star target', () => {
    const result = plugin.filter({
      target: '*',
      requires: ['*'],
      fn: () => {}
    })('');
    expect(result.target).to.equal('');
    expect(result.requires).to.deep.equal(['']);
  });

  it('Testing plugin types', () => {
    const resultFilter = plugin.filter({ target: '*', requires: [], fn: () => {} })('');
    const resultInject = plugin.inject({ target: '*', requires: [], fn: () => {} })('');
    const resultSort = plugin.sort({ target: '*', requires: [], fn: () => {} })('');
    expect(resultFilter.type).to.equal('FILTER');
    expect(resultInject.type).to.equal('INJECT');
    expect(resultSort.type).to.equal('SORT');
  });
});
