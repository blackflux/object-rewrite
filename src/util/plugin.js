const assert = require('assert');

const pluginTypes = ['FILTER', 'INJECT', 'SORT'];

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
  assert(pluginTypes.includes(type));
  assert(options instanceof Object && !Array.isArray(options));
  assert(Object.keys(options).length === 3);

  const { target, requires, fn } = options;
  assert(typeof target === 'string');
  assert(Array.isArray(requires));
  assert(typeof fn === 'function');
  assert(target !== '', 'Use "*" instead.');

  return prefix => ({
    prefix,
    target: join([prefix, target]),
    targetRel: target,
    requires: requires.map(f => join([prefix, f])),
    type,
    fn
  });
};

module.exports = pluginTypes.reduce((prev, t) => Object.assign(prev, {
  [`${t.toLowerCase()}Plugin`]: options => plugin(t, options)
}), { pluginTypes });
