const assert = require('assert');
const objectScan = require('object-scan');

module.exports = (keys) => objectScan(keys, {
  useArraySelector: false,
  filterFn: ({
    matchedBy, getKey, getValue, getParents, context
  }) => {
    assert(matchedBy.length === 1);
    const plugins = context.filterMap[matchedBy[0]];
    if (plugins.length === 0) {
      return true;
    }

    const key = getKey();
    const value = getValue();
    const parents = getParents();
    const kwargs = {
      key,
      value,
      parents,
      context: context.context
    };
    const result = plugins.every((plugin) => plugin.fn(kwargs)) === true;
    if (result === false) {
      if (Array.isArray(parents[0])) {
        parents[0].splice(key[key.length - 1], 1);
      } else {
        delete parents[0][key[key.length - 1]];
      }
    }
    return result;
  }
});
