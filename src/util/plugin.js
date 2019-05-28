const assert = require('assert');

const join = (input) => {
  const result = input.filter(e => !!e).join('.');
  if (result === '*') {
    return '';
  }
  if (result.endsWith('.*')) {
    return result.slice(0, -1);
  }
  return result;
};

const plugin = (type, options) => {
  assert(['FILTER', 'INJECT', 'SORT'].includes(type));
  assert(options instanceof Object && !Array.isArray(options));
  assert(Object.keys(options).length === 3);

  const { target, requires, fn } = options;
  assert(typeof target === 'string');
  assert(Array.isArray(requires));
  assert(typeof fn === 'function');
  assert(target !== '', 'Use "*" instead.');

  return prefix => ({
    target: join([prefix, target]),
    requires: requires.map(f => join([prefix, f])),
    type,
    fn
  });
};

module.exports.injectPlugin = options => plugin('INJECT', options);
module.exports.filterPlugin = options => plugin('FILTER', options);
module.exports.sortPlugin = options => plugin('SORT', options);
