const objectScan = require('object-scan');
const runPlugins = require('./run-plugins');

module.exports = (injectCbs) => objectScan(Object.keys(injectCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    matchedBy.forEach((m) => {
      const promises = runPlugins('INJECT', injectCbs[m], {
        key, value, parents, context: context.context
      });
      context.promises.push(...promises);
    });
    return true;
  }
});
