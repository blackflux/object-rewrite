const assert = require('assert');
const objectScan = require('object-scan');
const cmpFn = require('../../util/cmp-fn');

module.exports = (keys) => objectScan(keys, {
  useArraySelector: false,
  filterFn: ({
    matchedBy, getKey, getValue, getParents, context
  }) => {
    assert(matchedBy.length === 1);
    const plugins = context.sortMap[matchedBy[0]];
    if (plugins.length === 0) {
      return true;
    }

    const key = getKey();
    const value = getValue();
    const parents = getParents();
    assert(Array.isArray(parents[0]), 'Sort must be on "Array" type.');
    if (context.lookups[key.length - 1] === undefined) {
      context.lookups[key.length - 1] = new Map();
    }
    const lookup = context.lookups[key.length - 1];
    const kwargs = {
      key,
      value,
      parents
    };
    lookup.set(value, plugins.map((plugin) => plugin.fn(kwargs)));
    if (key[key.length - 1] === 0) {
      parents[0].sort((a, b) => cmpFn(lookup.get(a), lookup.get(b)));
      const limits = plugins
        .filter((p) => p.limit !== undefined)
        .map((p) => p.limit({ context: context.context }))
        .filter((l) => l !== undefined);
      if (limits.length !== 0) {
        assert(limits.every((l) => Number.isInteger(l) && l >= 0));
        parents[0].splice(Math.min(...limits));
      }
      context.lookups.splice(key.length - 1);
    }
    return true;
  }
});
