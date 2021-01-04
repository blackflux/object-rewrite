const objectScan = require('object-scan');
const runPlugins = require('./run-plugins');

module.exports = (keys) => objectScan(keys, {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    matchedBy.forEach((m) => {
      const promises = runPlugins('INJECT', context.injectMap[m], {
        key, value, parents, context: context.context
      });
      context.promises.push(...promises);
    });
    return true;
  }
});
