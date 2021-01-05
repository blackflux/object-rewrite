const assert = require('assert');
const objectScan = require('object-scan');
const execPlugins = require('./exec-plugins');

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
    const promises = execPlugins('INJECT', plugins, {
      key, value, parents, context: context.context
    });
    context.promises.push(...promises);
    return true;
  }
});
