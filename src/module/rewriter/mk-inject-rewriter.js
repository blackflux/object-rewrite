const objectScan = require('object-scan');

module.exports = (injectCbs) => objectScan(Object.keys(injectCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    matchedBy.forEach((m) => {
      const promises = injectCbs[m].fn({
        key, value, parents, context: context.context
      });
      context.promises.push(...promises);
    });
    return true;
  }
});
