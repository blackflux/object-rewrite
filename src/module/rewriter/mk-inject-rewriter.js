const objectScan = require('object-scan');
const execPlugins = require('./exec-plugins');

module.exports = (keys) => objectScan(keys, {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    matchedBy.forEach((m) => {
      const promises = execPlugins('INJECT', context.injectMap[m], {
        key, value, parents, context: context.context
      });
      context.promises.push(...promises);
    });
    return true;
  }
});
