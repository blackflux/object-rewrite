const assert = require('assert');
const objectScan = require('object-scan');
const set = require('lodash.set');

module.exports = (keys) => objectScan(keys, {
  useArraySelector: false,
  filterFn: ({
    matchedBy, getKey, getValue, getParents, context
  }) => {
    assert(matchedBy.length === 1);
    const plugins = context.injectMap[matchedBy[0]];
    if (plugins.length === 0) {
      return true;
    }

    const key = getKey();
    const value = getValue();
    const parents = getParents();
    const kwargs = {
      key,
      value,
      parents
    };
    const promises = [];
    plugins.forEach((plugin) => {
      const exec = (r) => {
        assert(plugin.schema(r) === true);
        if (plugin.targetRel === '*') {
          Object.assign(kwargs.value, r);
        } else {
          set(kwargs.value, plugin.targetRel, r);
        }
      };
      const result = plugin.fn(kwargs);
      if (result instanceof Promise) {
        promises.push(async () => exec(await result));
      } else {
        exec(result);
      }
    });
    context.promises.push(...promises);
    return true;
  }
});
