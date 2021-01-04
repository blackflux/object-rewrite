const assert = require('assert');
const objectScan = require('object-scan');
const runPlugins = require('./run-plugins');
const cmpFn = require('../../util/cmp-fn');

module.exports = (sortCbs) => objectScan(Object.keys(sortCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    assert(Array.isArray(parents[0]), 'Sort must be on "Array" type.');
    if (context.lookups[key.length - 1] === undefined) {
      context.lookups[key.length - 1] = new Map();
    }
    const lookup = context.lookups[key.length - 1];
    lookup.set(value, runPlugins('SORT', sortCbs[matchedBy[0]], {
      key, value, parents, context: context.context
    }));
    if (key[key.length - 1] === 0) {
      parents[0].sort((a, b) => cmpFn(lookup.get(a), lookup.get(b)));
      const limits = sortCbs[matchedBy[0]]
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
