import { expect } from 'chai';
import joinPath from '../../../src/module/plugin/join-path.js';

describe('Testing join-path.js', () => {
  it('Testing basic join', () => {
    expect(joinPath(['a', 'b', 'c'])).to.equal('a.b.c');
  });

  it('Testing star only', () => {
    expect(joinPath(['', '*'])).to.equal('');
    expect(joinPath(['*', ''])).to.equal('');
  });

  it('Testing ends in star', () => {
    expect(joinPath(['a', '*'])).to.equal('a.');
  });

  it('Testing empty', () => {
    expect(joinPath(['', ''])).to.equal('');
  });
});
