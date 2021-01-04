const objectScan = require('object-scan');
const runPlugins = require('./run-plugins');

module.exports = (filterCbs) => objectScan(Object.keys(filterCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, property, parent, matchedBy, context
  }) => {
    const result = matchedBy.some((m) => runPlugins('FILTER', filterCbs[m], {
      key, value, parents, context: context.context
    }) === true);
    if (result === false) {
      if (Array.isArray(parent)) {
        parent.splice(property, 1);
      } else {
        // eslint-disable-next-line no-param-reassign
        delete parent[property];
      }
    }
    return result;
  }
});
